/*
 * FR-006 — Overmind's DSDM lifecycle model.
 *
 * Rewritten 2026-08-22 with the model. Every expected value here is transcribed from Overmind's
 * own source (lifecycle.ts PROJECT_PHASES/PHASE_PLANS, products.ts PHASE_GATES/evaluatePhaseGate,
 * director.ts TIMEBOX_PHASES) — so these tests fail if the site's copy drifts from the engine it
 * describes, which is a failure the previous thirteen invented stage names could not produce.
 */
import { describe, it, expect } from 'vitest'
import {
  OVERMIND_PHASES,
  TOTAL_PHASES,
  TIMEBOX_PHASES,
  gateCount,
  phaseGateProducts,
  evaluatePhaseGate,
  seedTasks,
  baseline,
  phaseStatus,
  advance,
  reset,
  isComplete,
  gatesPassed,
  phaseDetail,
} from '../overmindPipeline.js'

const FOUNDATIONS = 2
const EVOLUTIONARY = 3

describe("FR-006: the phases are Overmind's, not a generic agent pipeline", () => {
  it('is the six DSDM project phases in lifecycle order', () => {
    expect(OVERMIND_PHASES.map((p) => p.id)).toEqual([
      'pre-project', 'feasibility', 'foundations', 'evolutionary', 'deployment', 'post-project',
    ])
    expect(TOTAL_PHASES).toBe(6)
  })

  it('carries the timebox cycle as a sub-structure, never as extra phases', () => {
    expect(TIMEBOX_PHASES).toEqual(['Investigation', 'Refinement', 'Consolidation'])
    // Exploration/Engineering are activities inside evolutionary development. If they ever leak
    // into the spine, six phases silently becomes a longer list.
    expect(OVERMIND_PHASES.map((p) => p.id)).not.toContain('exploration')
    expect(OVERMIND_PHASES).toHaveLength(6)
  })

  it('gates exactly the three phases PHASE_GATES gates, with their real products', () => {
    expect(gateCount()).toBe(3)
    expect(phaseGateProducts(1)).toEqual(['feasibility-assessment'])
    expect(phaseGateProducts(FOUNDATIONS)).toEqual(['foundations-summary', 'prl', 'delivery-plan'])
    expect(phaseGateProducts(4)).toEqual(['project-review-report'])
  })

  it('gives every ungated phase a documented reason, so absent never reads as forgotten', () => {
    for (const p of OVERMIND_PHASES) {
      if (p.gateProducts.length === 0) expect(p.noGateReason).toBeTruthy()
      else expect(p.noGateReason).toBeNull()
    }
  })

  it('returns empty/null for an out-of-range phase rather than throwing', () => {
    expect(phaseGateProducts(99)).toEqual([])
    expect(seedTasks(99)).toEqual([])
    expect(phaseDetail(99)).toBeNull()
  })
})

describe('FR-006: the governance gate refuses, and names what is missing', () => {
  it('refuses while any gate product is unbaselined, listing exactly those', () => {
    expect(evaluatePhaseGate(FOUNDATIONS, [])).toEqual({
      allowed: false, missing: ['foundations-summary', 'prl', 'delivery-plan'],
    })
    expect(evaluatePhaseGate(FOUNDATIONS, ['prl'])).toEqual({
      allowed: false, missing: ['foundations-summary', 'delivery-plan'],
    })
  })

  it('allows only when EVERY gate product is baselined', () => {
    const all = ['foundations-summary', 'prl', 'delivery-plan']
    expect(evaluatePhaseGate(FOUNDATIONS, all)).toEqual({ allowed: true, missing: [] })
  })

  it('an ungated phase always allows', () => {
    expect(evaluatePhaseGate(EVOLUTIONARY, [])).toEqual({ allowed: true, missing: [] })
    expect(evaluatePhaseGate(EVOLUTIONARY)).toEqual({ allowed: true, missing: [] })
  })

  it('advance is BLOCKED by an unmet gate and carries the reason', () => {
    expect(advance(1, [])).toEqual({ step: 1, advanced: false, missing: ['feasibility-assessment'] })
  })

  it('advance succeeds once the gate is satisfied', () => {
    expect(advance(1, ['feasibility-assessment'])).toEqual({ step: 2, advanced: true, missing: [] })
  })

  it('advance through an ungated phase is never blocked', () => {
    expect(advance(0, [])).toEqual({ step: 1, advanced: true, missing: [] })
    expect(advance(0)).toEqual({ step: 1, advanced: true, missing: [] })
  })

  it('advance past the end is a no-op, not an overflow', () => {
    expect(advance(TOTAL_PHASES, [])).toEqual({ step: TOTAL_PHASES, advanced: false, missing: [] })
  })
})

describe('FR-006: product baselining', () => {
  it('seeds only the products not already baselined', () => {
    expect(seedTasks(1, [])).toEqual(['feasibility-assessment'])
    expect(seedTasks(1, ['feasibility-assessment'])).toEqual([])
    expect(seedTasks(FOUNDATIONS, ['prl', 'sad'])).toEqual([
      'business-case', 'dad', 'delivery-plan', 'mad', 'foundations-summary',
    ])
    expect(seedTasks(1)).toEqual(['feasibility-assessment'])
  })

  it('baseline is pure and idempotent', () => {
    const before = ['prl']
    const after = baseline(before, 'sad')
    expect(after).toEqual(['prl', 'sad'])
    expect(before).toEqual(['prl']) // not mutated
    expect(baseline(after, 'sad')).toBe(after) // re-baselining does not duplicate
  })
})

describe('FR-006: stepper mechanics', () => {
  it('reports passed / active / pending around the current step', () => {
    expect(phaseStatus(0, 1)).toBe('passed')
    expect(phaseStatus(1, 1)).toBe('active')
    expect(phaseStatus(2, 1)).toBe('pending')
  })

  it('counts only the gates actually cleared', () => {
    expect(gatesPassed(0)).toBe(0)
    expect(gatesPassed(2)).toBe(1)            // feasibility behind us
    expect(gatesPassed(TOTAL_PHASES)).toBe(3) // all three
  })

  it('completes only after the final phase', () => {
    expect(isComplete(TOTAL_PHASES - 1)).toBe(false)
    expect(isComplete(TOTAL_PHASES)).toBe(true)
  })

  it('reset returns to the first phase', () => {
    expect(reset()).toBe(0)
  })

  it('phaseDetail carries the index and whether the phase is gated', () => {
    expect(phaseDetail(FOUNDATIONS)).toMatchObject({ id: 'foundations', index: FOUNDATIONS, hasGate: true })
    expect(phaseDetail(EVOLUTIONARY)).toMatchObject({ id: 'evolutionary', hasGate: false })
  })
})
