/*
 * livenessClient (brief 04, next-need 3).
 *
 * The rule that matters: OUR probe failing must never be reported as THEIR flagship being down.
 * Guessing "offline" from our own outage would put a false claim on someone else's product, so
 * every failure path resolves to `unknown`.
 */
import { describe, it, expect, vi } from 'vitest'
import { fetchLiveness, stateFor, livenessLabel, LIVENESS } from '../livenessClient.js'

const ok = (body) => vi.fn().mockResolvedValue({ ok: true, json: async () => body })
const BODY = { checkedAt: '2026-08-22T00:00:00.000Z', targets: { kthulhu: { state: 'reachable', status: 200 } } }

describe('fetchLiveness — degrades to unknown, never to a claim', () => {
  it('returns the verdicts', async () => {
    const out = await fetchLiveness({ fetchImpl: ok(BODY) })
    expect(out.degraded).toBe(false)
    expect(stateFor(out, 'kthulhu')).toBe(LIVENESS.REACHABLE)
  })

  it.each([
    ['a rejected fetch', vi.fn().mockRejectedValue(new Error('offline'))],
    ['a non-200', vi.fn().mockResolvedValue({ ok: false })],
    ['malformed JSON', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error('bad') } })],
    ['a body with no targets', ok({ checkedAt: 'x' })],
  ])('%s yields UNKNOWN, not "down"', async (_l, fetchImpl) => {
    const out = await fetchLiveness({ fetchImpl })
    expect(out.degraded).toBe(true)
    expect(stateFor(out, 'kthulhu')).toBe(LIVENESS.UNKNOWN)
    expect(stateFor(out, 'kthulhu')).not.toBe(LIVENESS.UNREACHABLE)
  })

  it('survives an environment with NO fetch at all', async () => {
    /*
     * `fetchImpl: null` alone does not test this: it falls through to the global, and jsdom
     * provides one — so the earlier version of this test passed by hitting the network and
     * failing, not by taking the no-transport path. Remove the global to actually reach it.
     */
    const real = globalThis.fetch
    globalThis.fetch = undefined
    try {
      const out = await fetchLiveness({ fetchImpl: null })
      expect(out).toEqual({ targets: {}, checkedAt: null, degraded: true })
    } finally {
      globalThis.fetch = real
    }
  })
})

describe('stateFor', () => {
  it('unknown for an absent or unrecognised target', () => {
    expect(stateFor({ targets: {} }, 'nope')).toBe(LIVENESS.UNKNOWN)
    expect(stateFor({ targets: { x: { state: 'banana' } } }, 'x')).toBe(LIVENESS.UNKNOWN)
    expect(stateFor(null, 'x')).toBe(LIVENESS.UNKNOWN)
  })
})

describe('livenessLabel — reachability words only', () => {
  it('never claims the product WORKS — a 200 from a homepage is not a working product', () => {
    for (const s of Object.values(LIVENESS)) {
      expect(livenessLabel(s).text).not.toMatch(/\bworking\b|\boperational\b|\bhealthy\b/i)
    }
    expect(livenessLabel(LIVENESS.REACHABLE).text).toBe('Responding')
  })
  it('distinguishes erroring from not responding from unknown', () => {
    expect(livenessLabel(LIVENESS.ERRORING).text).toMatch(/erroring/i)
    expect(livenessLabel(LIVENESS.UNREACHABLE).text).toMatch(/not responding/i)
    expect(livenessLabel('anything else').text).toMatch(/unknown/i)
  })
})
