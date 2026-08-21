import { describe, it, expect } from 'vitest'
import {
  OVERMIND_STAGES, TOTAL_STEPS, stageStatus, advance, stepBack, reset, isComplete, gatesPassed, gateCount, stageDetail, rejectAt } from '../overmindPipeline.js'

describe('overmindPipeline — steppable validated pipeline (FR-006)', () => {
  it('models 13 stages with zero-trust gates (consistent with the 13-phase claim)', () => {
    expect(OVERMIND_STAGES).toHaveLength(13)
    expect(TOTAL_STEPS).toBe(13)
    expect(gateCount()).toBeGreaterThan(0)
  })

  it('stageStatus: past = passed, current = validating, ahead = pending', () => {
    expect(stageStatus(0, 1)).toBe('passed')
    expect(stageStatus(1, 1)).toBe('validating')
    expect(stageStatus(2, 1)).toBe('pending')
  })

  it('advance/stepBack/reset are clamped', () => {
    expect(advance(0)).toBe(1)
    expect(advance(TOTAL_STEPS)).toBe(TOTAL_STEPS) // clamps at the end
    expect(stepBack(0)).toBe(0) // clamps at the start
    expect(stepBack(3)).toBe(2)
    expect(reset()).toBe(0)
  })

  it('isComplete only when every stage has passed', () => {
    expect(isComplete(0)).toBe(false)
    expect(isComplete(TOTAL_STEPS)).toBe(true)
  })

  it('gatesPassed grows monotonically and equals gateCount at the end', () => {
    expect(gatesPassed(0)).toBe(0)
    expect(gatesPassed(TOTAL_STEPS)).toBe(gateCount())
    expect(gatesPassed(5)).toBeLessThanOrEqual(gatesPassed(6))
  })
})

/*
 * W4 — a gate that cannot be seen rejecting is decoration (PRODUCT_AUDIT #21).
 *
 * The stepper advanced thirteen labels, which demonstrates that a pipeline has stages — something
 * nobody doubted. The claim worth showing is the zero-trust one: work gets REFUSED at gates. That
 * needs the detail behind each stage and a real rejection path.
 */
describe('stageDetail — what a stage emits and what its gate asks', () => {
  it('describes every stage, with a check on every gate and none on the others', () => {
    OVERMIND_STAGES.forEach((stage, i) => {
      const d = stageDetail(i)
      expect(d.emits, `${stage.id} emits nothing`).toBeTruthy()
      if (stage.gate) expect(d.check, `gate ${stage.id} checks nothing`).toBeTruthy()
      else expect(d.check, `non-gate ${stage.id} should not pose a check`).toBeNull()
    })
  })

  it('returns null out of range rather than throwing', () => {
    expect(stageDetail(-1)).toBeNull()
    expect(stageDetail(OVERMIND_STAGES.length)).toBeNull()
  })
})

describe('rejectAt — rework goes where the doubt is, not to the start', () => {
  const gateIndexes = OVERMIND_STAGES.map((s, i) => (s.gate ? i : -1)).filter((i) => i >= 0)

  it('only gates can reject — a stage that checks nothing cannot refuse', () => {
    OVERMIND_STAGES.forEach((stage, i) => {
      if (!stage.gate) expect(rejectAt(i), `${stage.id} is not a gate but rejected`).toBeNull()
    })
    expect(gateIndexes.length).toBeGreaterThan(3)
  })

  it('always returns the run to an EARLIER stage', () => {
    for (const i of gateIndexes) {
      const r = rejectAt(i)
      expect(r.returnedTo, `${OVERMIND_STAGES[i].id} did not go backwards`).toBeLessThan(i)
      expect(r.rejectedAt).toBe(i)
      expect(r.step).toBe(r.returnedTo)
    }
  })

  it('sends the work to the stage whose OUTPUT is in doubt, not to stage zero', () => {
    // critique failing means the DRAFT was wrong; validate failing means the citations were.
    const idx = (id) => OVERMIND_STAGES.findIndex((s) => s.id === id)
    expect(rejectAt(idx('critique')).returnedTo).toBe(idx('draft'))
    expect(rejectAt(idx('validate')).returnedTo).toBe(idx('revise'))
    expect(rejectAt(idx('govern')).returnedTo).toBe(idx('plan'))
    // Only the first gate legitimately returns to the beginning.
    expect(rejectAt(idx('classify')).returnedTo).toBe(idx('ingest'))
  })

  /*
   * A rejection must never INCREASE trust, and rework that crosses earlier gates must give their
   * progress back. It does not follow that every rejection loses a gate: critique returning to
   * draft crosses none, and classify/plan were never the thing in doubt — retaining them is
   * correct. My first version of this test asserted the stronger claim and was simply wrong about
   * the domain.
   */
  it('never increases gate progress, and gives back the gates the rework invalidates', () => {
    for (const i of gateIndexes) {
      const r = rejectAt(i)
      expect(gatesPassed(r.step), `${OVERMIND_STAGES[i].id} gained trust by being rejected`).toBeLessThanOrEqual(
        gatesPassed(i),
      )
    }
    // govern sends the run back to plan, which is behind three cleared gates — those are re-earned.
    const govern = OVERMIND_STAGES.findIndex((s) => s.id === 'govern')
    expect(gatesPassed(rejectAt(govern).step)).toBeLessThan(gatesPassed(govern))
  })
})
