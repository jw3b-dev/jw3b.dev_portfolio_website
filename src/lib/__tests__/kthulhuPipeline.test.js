/*
 * FR-006 — KTHULHU Overmind's real pipeline.
 *
 * Rebuilt 2026-08-22 with the model, second pass. Every expected value is transcribed from
 * `mas/audits/KTHULHU_INFRA_AUDIT.md` §2, which read them from KTHULHU's `lib/ui/display.ts`
 * (PIPELINE_STEPS, STEP_META) and `lib/engine/phases/`. These fail if the site's copy drifts from
 * the system it describes.
 *
 * The two-lane split gets its own assertions on purpose: it is the differentiating claim, and a
 * model that silently collapsed every step onto one lane would still render and still step.
 */
import { describe, it, expect } from 'vitest'
import {
  KTHULHU_PHASES,
  KTHULHU_STEPS,
  TOTAL_STEPS,
  LANES,
  GATES,
  DEADLINES_MIN,
  stepStatus,
  advance,
  reset,
  isComplete,
  gatesPassed,
  gateCount,
  stepDetail,
  laneSteps,
  phaseProgress,
} from '../kthulhuPipeline.js'

describe('FR-006: the phases are KTHULHU’s, in order', () => {
  it('is the four recorded phases', () => {
    expect(KTHULHU_PHASES.map((p) => p.id)).toEqual(['triage', 'ensemble', 'verification', 'reporting'])
  })

  it('carries ~20 recorded steps, with Ensemble the widest phase', () => {
    expect(TOTAL_STEPS).toBe(21)
    expect(KTHULHU_PHASES.find((p) => p.id === 'ensemble').steps).toHaveLength(14)
    expect(KTHULHU_PHASES.find((p) => p.id === 'verification').steps).toHaveLength(3)
  })

  it('names the steps KTHULHU names, not paraphrases of them', () => {
    const ids = KTHULHU_STEPS.map((s) => s.id)
    for (const id of ['attack-surface-scoping', 'static-grounding', 'claude-discovery',
      'static-adjudication', 'kill-gate-vote', 'scenario-decomposition', 'fv-dispatch', 'review-gate']) {
      expect(ids).toContain(id)
    }
    // The v1 invention must never come back. Audit-domain semantics were right; these names were not.
    for (const invented of ['ingest', 'classify', 'retrieve', 'draft', 'critique', 'revise', 'govern', 'approve']) {
      expect(ids).not.toContain(invented)
    }
    // Nor the v2 error: MB-agentic's DSDM lifecycle is a DIFFERENT product also called "Overmind".
    for (const wrongSystem of ['pre-project', 'feasibility', 'foundations', 'evolutionary', 'post-project']) {
      expect(ids).not.toContain(wrongSystem)
    }
  })
})

describe('FR-006: the two-lane split is the differentiating claim', () => {
  it('every step declares a lane', () => {
    for (const s of KTHULHU_STEPS) expect([LANES.CLOUD, LANES.BOX]).toContain(s.lane)
  })

  it('both lanes carry real work — a collapse to one lane is the failure to catch', () => {
    expect(laneSteps(LANES.BOX).length).toBeGreaterThan(0)
    expect(laneSteps(LANES.CLOUD).length).toBeGreaterThan(0)
    expect(laneSteps(LANES.BOX).length + laneSteps(LANES.CLOUD).length).toBe(TOTAL_STEPS)
  })

  it('Verification runs entirely on the box; Reporting entirely in the cloud', () => {
    const verification = KTHULHU_PHASES.find((p) => p.id === 'verification')
    expect(verification.steps.every((s) => s.lane === LANES.BOX)).toBe(true)
    const reporting = KTHULHU_PHASES.find((p) => p.id === 'reporting')
    expect(reporting.steps.every((s) => s.lane === LANES.CLOUD)).toBe(true)
  })

  it('FV dispatch is marked async — its verdict may not land', () => {
    expect(KTHULHU_STEPS.find((s) => s.id === 'fv-dispatch').async).toBe(true)
  })
})

describe('FR-006: the two real gates, transcribed not summarised', () => {
  it('has exactly two gates: the kill-gate vote and the review gate', () => {
    expect(gateCount()).toBe(2)
    expect(KTHULHU_STEPS.filter((s) => s.gate).map((s) => s.id)).toEqual(['kill-gate-vote', 'review-gate'])
  })

  it('the kill gate is asymmetric and persists its refutation reason', () => {
    expect(GATES.kill.outcome).toMatch(/dropped_fp/)
    expect(GATES.kill.outcome).toMatch(/never silently lost/i)
    expect(GATES.kill.asymmetry).toMatch(/false negative is far worse/i)
    expect(GATES.kill.scope).toMatch(/deep tier only/i)
  })

  it('the review gate DERIVES status, and holds delivery on an unconfirmed high', () => {
    expect(GATES.review.mechanism).toMatch(/derived/i)
    expect(GATES.review.outcome).toMatch(/awaiting_review/)
    expect(GATES.review.outcome).toMatch(/HELD/i)
    // awaiting_review means it FOUND something — the inversion that once understated findings 12x.
    expect(GATES.review.asymmetry).toMatch(/found something serious/i)
  })

  it('counts gates only once passed', () => {
    expect(gatesPassed(0)).toBe(0)
    expect(gatesPassed(TOTAL_STEPS)).toBe(2)
  })
})

describe('FR-006: deadlines and the watchdog', () => {
  it('carries the per-job budgets, longest to shortest', () => {
    expect(DEADLINES_MIN.fv).toBe(90)
    expect(DEADLINES_MIN.medusa).toBe(90)
    expect(DEADLINES_MIN.slither).toBe(20)
    expect(DEADLINES_MIN.builder).toBe(15)
    expect(Math.max(...Object.values(DEADLINES_MIN))).toBe(90)
  })
})

describe('FR-006: stepper mechanics', () => {
  it('reports done / running / pending around the current step', () => {
    expect(stepStatus(0, 1)).toBe('done')
    expect(stepStatus(1, 1)).toBe('running')
    expect(stepStatus(2, 1)).toBe('pending')
  })

  it('advances, clamps at the end, and resets', () => {
    expect(advance(0)).toBe(1)
    expect(advance(TOTAL_STEPS)).toBe(TOTAL_STEPS)
    expect(reset()).toBe(0)
    expect(isComplete(TOTAL_STEPS - 1)).toBe(false)
    expect(isComplete(TOTAL_STEPS)).toBe(true)
  })

  it('stepDetail carries the phase, the lane and the gate body', () => {
    const killIdx = KTHULHU_STEPS.findIndex((s) => s.id === 'kill-gate-vote')
    const d = stepDetail(killIdx)
    expect(d).toMatchObject({ id: 'kill-gate-vote', phase: 'ensemble', lane: LANES.CLOUD })
    expect(d.gateDetail.label).toBe('Kill gate')
    expect(stepDetail(999)).toBeNull()
    expect(stepDetail(0).gateDetail).toBeNull()
  })

  it('phaseProgress tracks position within a phase', () => {
    expect(phaseProgress('triage', 0)).toEqual({ done: 0, total: 2, active: true })
    expect(phaseProgress('triage', TOTAL_STEPS)).toEqual({ done: 2, total: 2, active: false })
    expect(phaseProgress('nope', 0)).toBeNull()
  })
})
