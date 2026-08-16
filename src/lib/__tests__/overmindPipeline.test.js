import { describe, it, expect } from 'vitest'
import {
  OVERMIND_STAGES, TOTAL_STEPS, stageStatus, advance, stepBack, reset, isComplete, gatesPassed, gateCount,
} from '../overmindPipeline.js'

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
