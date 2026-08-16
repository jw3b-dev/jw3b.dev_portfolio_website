import { describe, it, expect, afterEach, vi } from 'vitest'
import {
  MOTION_BUDGET,
  fadeRise,
  fadeIn,
  verdictResolve,
  motionSafe,
  prefersReducedMotion,
  duration,
} from '../motion.js'

describe('MOTION_BUDGET (FR-007 / OBJ-06)', () => {
  it('is frozen and only permits compositor-cheap properties', () => {
    expect(Object.isFrozen(MOTION_BUDGET)).toBe(true)
    expect(MOTION_BUDGET.allowedProperties).toEqual(['opacity', 'transform'])
    expect(MOTION_BUDGET.allowedProperties).not.toContain('width')
  })

  it('caps rise distance and duration, and allows exactly one looping exception', () => {
    expect(MOTION_BUDGET.maxTranslatePx).toBeLessThanOrEqual(12)
    expect(MOTION_BUDGET.maxDurationSec).toBe(duration.slow)
    expect(MOTION_BUDGET.loopExceptions).toEqual(['liveness-pulse'])
    expect(MOTION_BUDGET.concurrentSectionEntrances).toBe(1)
  })
})

describe('presets stay within budget', () => {
  it('fadeRise rises no further than the budget and runs once', () => {
    expect(fadeRise.initial.y).toBe(MOTION_BUDGET.maxTranslatePx)
    expect(fadeRise.whileInView.y).toBe(0)
    expect(fadeRise.viewport.once).toBe(true)
    expect(fadeRise.transition.duration).toBeLessThanOrEqual(MOTION_BUDGET.maxDurationSec)
  })

  it('fadeIn animates opacity only (no transform)', () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 })
    expect(fadeIn.animate).toEqual({ opacity: 1 })
    expect(fadeIn.transition.duration).toBeLessThanOrEqual(MOTION_BUDGET.maxDurationSec)
  })

  it('verdictResolve settles within the verdict window', () => {
    expect(verdictResolve.transition.duration).toBe(duration.verdict)
  })
})

describe('motionSafe — imperative reduced-motion guard', () => {
  it('returns the preset untouched when motion is allowed', () => {
    expect(motionSafe(false, fadeRise)).toBe(fadeRise)
  })

  it('when reduced: holds the settled state, strips transforms, zeroes duration', () => {
    const guarded = motionSafe(true, fadeRise)
    expect(guarded.initial).toBe(false)
    expect(guarded.transition.duration).toBe(0)
    // settled state kept (opacity), transform (y) stripped so nothing jumps
    expect(guarded.animate).toEqual({ opacity: 1 })
    expect(guarded.animate).not.toHaveProperty('y')
  })

  it('falls back to an empty settled state when the preset has neither animate nor whileInView', () => {
    const guarded = motionSafe(true, { transition: { duration: 1 } })
    expect(guarded.animate).toEqual({})
  })

  it('strips scale as well as x/y', () => {
    const guarded = motionSafe(true, { animate: { opacity: 1, x: 5, scale: 1.1 } })
    expect(guarded.animate).toEqual({ opacity: 1 })
  })
})

describe('prefersReducedMotion — reflects matchMedia', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is true when the media query matches', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('is false when it does not match', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }))
    expect(prefersReducedMotion()).toBe(false)
  })
})
