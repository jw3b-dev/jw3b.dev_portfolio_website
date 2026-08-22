import { describe, it, expect } from 'vitest'
import {
  OVERMIND_PHASES,
  PRINCIPLES,
  SEVERITY,
  TOTAL_PHASES,
  DEFAULT_CONTEXT,
  phaseIndex,
  phaseAt,
  haltingPrinciples,
  applies,
  checkPrinciples,
  canExit,
  advancePhase,
  resetPhase,
  phaseStatus,
} from '../overmindGovernance.js'

/*
 * FR-006 — Overmind, the governed engine.
 *
 * This suite exists because the surface it guards was rendered WRONG three times: the model is a
 * transcription of another repo's source, and a transcription that silently drifts is worse than
 * no transcription at all. So the tests assert the transcribed facts themselves — the phase order,
 * the severities, WHICH three principles halt — not merely that the functions run.
 */
describe('FR-006: the transcription itself (lifecycle.ts / principles.ts)', () => {
  it('carries the six DSDM phases in lifecycle order, verbatim', () => {
    // lifecycle.ts:20, asserted verbatim by that engine's own tests-workers/lifecycle.test.ts:12.
    expect(OVERMIND_PHASES.map((p) => p.id)).toEqual([
      'PRE_PROJECT', 'FEASIBILITY', 'FOUNDATIONS', 'EVOLUTIONARY', 'DEPLOYMENT', 'POST_PROJECT',
    ])
    expect(TOTAL_PHASES).toBe(6)
  })

  it('is SIX phases, not thirteen — the claim that caused the first wrong rebuild', () => {
    // CR-06 read "13-phase pipeline" for a month. The source system has 13 PRODUCTS and 6 phases.
    // If anyone ever re-transcribes 13 phases into this file, this fails first.
    expect(OVERMIND_PHASES).toHaveLength(6)
  })

  it('carries all eight principles, numbered 1..8', () => {
    expect(PRINCIPLES).toHaveLength(8)
    expect(PRINCIPLES.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it('halts on exactly principles 4, 5 and 8 — the asymmetry is the design', () => {
    expect(haltingPrinciples().map((p) => p.number)).toEqual([4, 5, 8])
    expect(haltingPrinciples().every((p) => p.severity === SEVERITY.EXCEPTION)).toBe(true)
  })

  it('gives every principle a context field that actually exists in the default context', () => {
    // A typo'd field would read `undefined`, never equal false, and the principle would become
    // unbreakable — a gate that silently cannot fail, which is the exact failure mode being fixed.
    for (const p of PRINCIPLES) expect(DEFAULT_CONTEXT).toHaveProperty(p.field)
  })

  it('defaults every context key to the compliant value', () => {
    expect(Object.values(DEFAULT_CONTEXT).every((v) => v === true)).toBe(true)
  })
})

describe('phase lookup', () => {
  it('indexes a known phase and rejects an unknown one', () => {
    expect(phaseIndex('FOUNDATIONS')).toBe(2)
    expect(phaseIndex('NOT_A_PHASE')).toBe(-1)
  })

  it('returns null past the end rather than undefined', () => {
    expect(phaseAt(0).id).toBe('PRE_PROJECT')
    expect(phaseAt(TOTAL_PHASES)).toBeNull()
  })

  it('reports phase status relative to the current position', () => {
    expect(phaseStatus(0, 1)).toBe('done')
    expect(phaseStatus(1, 1)).toBe('active')
    expect(phaseStatus(2, 1)).toBe('pending')
  })
})

describe('applies() — a principle must not bite in a phase the real engine never checks it', () => {
  const collaborate = PRINCIPLES.find((p) => p.id === 'COLLABORATE')
  const incrementally = PRINCIPLES.find((p) => p.id === 'BUILD_INCREMENTALLY')
  const quality = PRINCIPLES.find((p) => p.id === 'NEVER_COMPROMISE_QUALITY')

  it('applies an unscoped principle everywhere', () => {
    expect(applies(quality, 'PRE_PROJECT')).toBe(true)
    expect(applies(quality, 'POST_PROJECT')).toBe(true)
  })

  it('holds a scoped principle back until its phase', () => {
    expect(applies(collaborate, 'FEASIBILITY')).toBe(false)
    expect(applies(collaborate, 'FOUNDATIONS')).toBe(true)
    expect(applies(incrementally, 'FOUNDATIONS')).toBe(false)
    expect(applies(incrementally, 'EVOLUTIONARY')).toBe(true)
  })

  it('treats an unknown phase as out of scope rather than throwing', () => {
    expect(applies(collaborate, 'NOT_A_PHASE')).toBe(false)
  })
})

describe('checkPrinciples() — the gate sweep', () => {
  it('passes cleanly on the default context', () => {
    const v = checkPrinciples()
    expect(v.ok).toBe(true)
    expect(v.gateAllowed).toBe(true)
    expect(v.violations).toEqual([])
    expect(v.checks).toHaveLength(8)
  })

  it('HALTS on an EXCEPTION violation', () => {
    const v = checkPrinciples({ qualityAccepted: false }, 'FOUNDATIONS')
    expect(v.gateAllowed).toBe(false)
    expect(v.exceptions.map((e) => e.number)).toEqual([4])
    expect(v.exceptions[0].detail).toMatch(/FAILED review/)
  })

  it('PROCEEDS on a COACHING violation — and still reports it', () => {
    // The interesting case: ok=false while gateAllowed=true. A gate that swallowed the violation
    // to stay green would be indistinguishable from one with nothing to report.
    const v = checkPrinciples({ withinBudget: false }, 'FOUNDATIONS')
    expect(v.gateAllowed).toBe(true)
    expect(v.ok).toBe(false)
    expect(v.violations.map((x) => x.number)).toEqual([2])
  })

  it('does not fire a scoped principle before its phase', () => {
    expect(checkPrinciples({ foundationsBaselined: false }, 'FEASIBILITY').gateAllowed).toBe(true)
    expect(checkPrinciples({ foundationsBaselined: false }, 'EVOLUTIONARY').gateAllowed).toBe(false)
  })

  it('marks an out-of-scope principle as not in force rather than as passing', () => {
    const check = checkPrinciples({}, 'PRE_PROJECT').checks.find((c) => c.principle === 'COLLABORATE')
    expect(check.inForce).toBe(false)
    expect(check.ok).toBe(true)
  })

  it('accumulates multiple exceptions', () => {
    const v = checkPrinciples({ qualityAccepted: false, exceptionsResolved: false }, 'FOUNDATIONS')
    expect(v.exceptions.map((e) => e.number)).toEqual([4, 8])
  })

  it('merges a partial context over the defaults', () => {
    // Passing one key must not blank the other six into undefined (which never equals false).
    expect(checkPrinciples({ qualityAccepted: false }, 'FOUNDATIONS').violations).toHaveLength(1)
  })

  it('defaults to the first phase when none is given', () => {
    expect(checkPrinciples({}).checks.find((c) => c.principle === 'COLLABORATE').inForce).toBe(false)
  })
})

describe('canExit()', () => {
  it('mirrors gateAllowed', () => {
    expect(canExit('FOUNDATIONS')).toBe(true)
    expect(canExit('FOUNDATIONS', { qualityAccepted: false })).toBe(false)
    expect(canExit('FOUNDATIONS', { withinBudget: false })).toBe(true)
  })
})

describe('advancePhase() — a halt is a reported outcome, never a silent no-op', () => {
  it('advances a clean gate', () => {
    expect(advancePhase(0)).toEqual({ index: 1, halted: false, complete: false, exceptions: [] })
  })

  it('holds the index and names the exceptions when refused', () => {
    const r = advancePhase(2, { qualityAccepted: false })
    expect(r.index).toBe(2)
    expect(r.halted).toBe(true)
    expect(r.complete).toBe(false)
    expect(r.exceptions).toHaveLength(1)
  })

  it('reports completion when the last gate is crossed', () => {
    const r = advancePhase(TOTAL_PHASES - 1)
    expect(r.index).toBe(TOTAL_PHASES)
    expect(r.complete).toBe(true)
  })

  it('is idempotent past the end', () => {
    expect(advancePhase(TOTAL_PHASES)).toEqual({ index: TOTAL_PHASES, halted: false, complete: true, exceptions: [] })
  })

  it('walks the whole lifecycle on the default context', () => {
    let i = resetPhase()
    expect(i).toBe(0)
    for (let n = 0; n < TOTAL_PHASES; n++) {
      const r = advancePhase(i)
      expect(r.halted).toBe(false)
      i = r.index
    }
    expect(i).toBe(TOTAL_PHASES)
  })

  it('cannot be walked past Evolutionary with foundations unbaselined', () => {
    // The lifecycle-shaped proof: the run gets as far as the phase where the principle starts
    // biting, and stops there — not earlier, not later.
    let i = resetPhase()
    const ctx = { foundationsBaselined: false }
    for (let n = 0; n < TOTAL_PHASES; n++) {
      const r = advancePhase(i, ctx)
      if (r.halted) break
      i = r.index
    }
    expect(OVERMIND_PHASES[i].id).toBe('EVOLUTIONARY')
  })
})
