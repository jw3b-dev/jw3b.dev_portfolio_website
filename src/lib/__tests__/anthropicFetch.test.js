import { describe, it, expect, vi } from 'vitest'
import { anthropicFetch, anthropicBackoffMs } from '../../../workers/portfolio-agent/src/routes/concierge.js'

/*
 * GAP-02 (v1→v2 parity): the Anthropic upstream must survive a transient 429/529 with a BOUNDED
 * retry (honoring Retry-After) BEFORE demoting the request to the weaker Workers-AI fallback —
 * mirroring the v1 worker's llm.js. Without it, a briefly-busy shared OAuth-token pool silently
 * serves the fallback model. Tests inject fetch + sleep, so no real timers run.
 */

const resp = (status, retryAfter) => ({
  status,
  ok: status >= 200 && status < 300,
  body: status >= 200 && status < 300 ? {} : null,
  headers: { get: (k) => (k.toLowerCase() === 'retry-after' && retryAfter != null ? String(retryAfter) : null) },
})

describe('anthropicBackoffMs', () => {
  it('is exponential (400·2^attempt) with no Retry-After, capped at capMs', () => {
    expect(anthropicBackoffMs(null, 0, 3000)).toBe(400)
    expect(anthropicBackoffMs(null, 1, 3000)).toBe(800)
    expect(anthropicBackoffMs(null, 2, 3000)).toBe(1600)
    expect(anthropicBackoffMs(null, 3, 3000)).toBe(3000) // 3200 → capped
  })
  it('honors a Retry-After header (seconds→ms) when larger than the exponential', () => {
    expect(anthropicBackoffMs(resp(429, 2), 0, 3000)).toBe(2000) // max(2000, 400)
  })
  it('caps the Retry-After at capMs', () => {
    expect(anthropicBackoffMs(resp(429, 10), 0, 3000)).toBe(3000) // 10000 → capped
  })
  it('ignores a non-numeric Retry-After and falls back to the exponential', () => {
    expect(anthropicBackoffMs(resp(429, 'soon'), 1, 3000)).toBe(800)
  })
  it('tolerates a response with no usable headers.get', () => {
    expect(anthropicBackoffMs({}, 0, 3000)).toBe(400)
  })
})

describe('anthropicFetch — bounded retry before fallback (GAP-02)', () => {
  it('returns a 200 on the first try without sleeping', async () => {
    const fetchFn = vi.fn().mockResolvedValue(resp(200))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { sleepFn })
    expect(res.status).toBe(200)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(sleepFn).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('retries a 429 then succeeds, sleeping for the Retry-After interval', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(resp(429, 1)).mockResolvedValueOnce(resp(200))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { sleepFn })
    expect(res.status).toBe(200)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(sleepFn).toHaveBeenCalledTimes(1)
    expect(sleepFn).toHaveBeenCalledWith(1000) // Retry-After: 1s
    vi.unstubAllGlobals()
  })

  it('retries a 529 (overloaded) then succeeds', async () => {
    const fetchFn = vi.fn().mockResolvedValueOnce(resp(529)).mockResolvedValueOnce(resp(200))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { sleepFn })
    expect(res.status).toBe(200)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('gives up after `retries` on a persistent 429 and returns it (caller falls back)', async () => {
    const fetchFn = vi.fn().mockResolvedValue(resp(429))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { retries: 2, sleepFn })
    expect(res.status).toBe(429)
    expect(fetchFn).toHaveBeenCalledTimes(3) // attempts 0,1,2
    expect(sleepFn).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })

  it('does NOT retry a non-transient status (500) — returns immediately', async () => {
    const fetchFn = vi.fn().mockResolvedValue(resp(500))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { sleepFn })
    expect(res.status).toBe(500)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(sleepFn).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('retries a network error then succeeds', async () => {
    const fetchFn = vi.fn().mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce(resp(200))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { sleepFn })
    expect(res.status).toBe(200)
    expect(fetchFn).toHaveBeenCalledTimes(2)
    expect(sleepFn).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })

  it('returns null when the network keeps throwing past the retry budget', async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error('down'))
    const sleepFn = vi.fn().mockResolvedValue()
    vi.stubGlobal('fetch', fetchFn)
    const res = await anthropicFetch('u', {}, { retries: 2, sleepFn })
    expect(res).toBeNull()
    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(sleepFn).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})
