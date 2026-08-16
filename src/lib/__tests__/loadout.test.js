import { describe, it, expect } from 'vitest'
import {
  lookupTier,
  recommendEngagement,
  indicativeScope,
  priceLabel,
  resolveLoadout,
  OBJECTIVES,
  ENGAGEMENTS,
} from '../loadout.js'
import RETAINER from '../../data/retainer.json'

describe('lookupTier — pure catalog lookup', () => {
  it('returns the unique tier for a valid (objective × engagement) pair', () => {
    const t = lookupTier('security', 'project')
    expect(t).toBeTruthy()
    expect(t.objective).toBe('security')
    expect(t.engagement).toBe('project')
  })
  it('returns null for a missing arg or an unknown pair', () => {
    expect(lookupTier(null, 'project')).toBeNull()
    expect(lookupTier('security', null)).toBeNull()
    expect(lookupTier('security', 'nonsense')).toBeNull()
  })
  it('every catalog (objective × engagement) pair resolves to exactly one tier', () => {
    for (const o of OBJECTIVES) {
      for (const e of ENGAGEMENTS) {
        const matches = RETAINER.tiers.filter((t) => t.objective === o && t.engagement === e)
        expect(matches).toHaveLength(1)
        expect(lookupTier(o, e)).toEqual(matches[0])
      }
    }
  })
})

describe('recommendEngagement — FR-029: the assessment is non-decorative', () => {
  it('an early-stage, urgent piece of work scores toward a project', () => {
    const r = recommendEngagement({ stage: 'idea', surface: 'contracts', urgency: 'urgent' })
    expect(r.recommended).toBe('project')
    expect(r.scores.project).toBeGreaterThan(r.scores.retainer)
    expect(r.topSignal).toMatchObject({ shape: 'project' })
  })
  it('a shipped, open-ended system scores toward a retainer', () => {
    const r = recommendEngagement({ stage: 'shipped', surface: 'both', urgency: 'exploring' })
    expect(r.recommended).toBe('retainer')
    expect(r.scores.retainer).toBeGreaterThan(r.scores.project)
  })
  it('an empty / unknown assessment ties and resolves to the safer "project" floor', () => {
    const r = recommendEngagement({})
    expect(r.scores).toEqual({ project: 0, retainer: 0 })
    expect(r.recommended).toBe('project')
    expect(r.topSignal).toBeNull()
  })
  it('ignores answers that carry no weight (e.g. surface: agentic) and unknown values', () => {
    const r = recommendEngagement({ surface: 'agentic', stage: 'bogus' })
    expect(r.scores).toEqual({ project: 0, retainer: 0 })
    expect(r.recommended).toBe('project')
  })
  it('defaults to an empty assessment when called with no argument', () => {
    expect(recommendEngagement().recommended).toBe('project')
  })
})

describe('indicativeScope — FR-029: derived, stable, answer-driven scope lines', () => {
  it('renders one line per answered dimension, in surface → stage → urgency order', () => {
    const lines = indicativeScope({ stage: 'shipped', surface: 'contracts', urgency: 'weeks' })
    expect(lines).toEqual([
      'Solidity / EVM contract review',
      'Live system — audit and hardening',
      'Multi-week delivery window',
    ])
  })
  it('drops unanswered / unknown dimensions', () => {
    expect(indicativeScope({ surface: 'both' })).toEqual(['Contracts + agentic system, end to end'])
    expect(indicativeScope({})).toEqual([])
    expect(indicativeScope()).toEqual([])
  })
})

describe('priceLabel — FR-030 / BR-12: price copied from the catalog, never free-typed', () => {
  it('states the honest floor for an unprovisioned tier and for a null tier', () => {
    expect(priceLabel(null)).toEqual({
      text: 'Sized honestly on the call — no template number.',
      provisioned: false,
    })
    // Every real catalog tier is currently unprovisioned — none may emit a number.
    for (const tier of RETAINER.tiers) {
      const p = priceLabel(tier)
      expect(p.provisioned).toBe(false)
      expect(p.text).not.toMatch(/\d/)
    }
  })
  it('copies the catalog price + catalog currency verbatim when a tier is provisioned', () => {
    const provisioned = { price_provisioned: true, indicative_price: '2,500' }
    const p = priceLabel(provisioned)
    expect(p).toEqual({ text: `2,500 ${RETAINER.currency}`, provisioned: true })
    // The number came from the tier, not the module.
    expect(p.text).toContain(provisioned.indicative_price)
  })
})

describe('resolveLoadout — composes the final loadout', () => {
  it('uses the user-chosen engagement when supplied', () => {
    const out = resolveLoadout({ objective: 'security', engagement: 'retainer', assessment: {} })
    expect(out.tier.id).toBe('security-retainer')
    expect(out.price.provisioned).toBe(false)
  })
  it('assessment answers change the recommended tier when the user has not chosen yet (FR-029)', () => {
    const early = resolveLoadout({
      objective: 'security',
      assessment: { stage: 'idea', urgency: 'urgent' },
    })
    const ongoing = resolveLoadout({
      objective: 'security',
      assessment: { stage: 'shipped', urgency: 'exploring' },
    })
    expect(early.tier.id).toBe('audit-sprint') // security × project
    expect(ongoing.tier.id).toBe('security-retainer') // security × retainer
    expect(early.tier.id).not.toBe(ongoing.tier.id)
  })
  it('carries a rationale referencing the dominant signal, and a fallback when none', () => {
    const withSignal = resolveLoadout({ objective: 'pm', assessment: { urgency: 'urgent' } })
    expect(withSignal.rationale).toMatch(/urgent/)
    const noSignal = resolveLoadout({ objective: 'pm', assessment: {} })
    expect(noSignal.rationale).toMatch(/answer the assessment/i)
  })
  it('returns a null tier for an unknown objective without throwing, and defaults its argument', () => {
    expect(resolveLoadout({ objective: 'unknown', engagement: 'project' }).tier).toBeNull()
    const out = resolveLoadout()
    expect(out.tier).toBeNull()
    expect(out.recommendedEngagement).toBe('project')
    expect(out.scope).toEqual([])
  })
})
