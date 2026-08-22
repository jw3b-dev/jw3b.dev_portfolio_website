/*
 * Flagship liveness (brief 04, next-need 3).
 *
 * Two properties carry the whole design: it can only ever fetch allow-listed origins (anything
 * else is an open proxy wearing a probe's name), and an unreachable target is DATA rather than an
 * error, because a 5xx here would break a card that is only trying to add a status line.
 */
import { describe, it, expect, vi } from 'vitest'
import { handleLiveness, verdictFor, LIVENESS_TARGETS, LIVENESS_KEYS } from '../routes/liveness.js'

const okFetch = () => vi.fn().mockResolvedValue({ ok: true, status: 200 })

describe('verdictFor — reachability, never correctness', () => {
  it('a 200 is reachable', () => expect(verdictFor({ ok: true, status: 200 })).toEqual({ state: 'reachable', status: 200 }))
  it('a 500 is erroring, and keeps the status', () => expect(verdictFor({ ok: false, status: 500 })).toEqual({ state: 'erroring', status: 500 }))
  it('no status at all is unreachable', () => expect(verdictFor({ ok: false, status: null })).toEqual({ state: 'unreachable', status: null }))
})

describe('handleLiveness', () => {
  it('probes every allow-listed target and only those', async () => {
    const fetchImpl = okFetch()
    const out = await handleLiveness({}, {}, {}, { fetchImpl })
    expect(out.status).toBe(200)
    expect(Object.keys(out.body.targets).sort()).toEqual([...LIVENESS_KEYS].sort())

    const fetched = fetchImpl.mock.calls.map((c) => c[0])
    for (const u of fetched) expect(Object.values(LIVENESS_TARGETS)).toContain(u)
  })

  it('NEVER fetches a caller-supplied URL — the allowlist is by key, not by parameter', async () => {
    const fetchImpl = okFetch()
    // Any shape of caller input must be ignored; there is no parameter that can reach fetch.
    await handleLiveness({ url: 'https://evil.example/?target=http://169.254.169.254/' }, {}, {}, { fetchImpl })
    for (const [u] of fetchImpl.mock.calls) expect(u).not.toMatch(/evil|169\.254/)
  })

  it('reports an unreachable target as DATA, still HTTP 200', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))
    const out = await handleLiveness({}, {}, {}, { fetchImpl })
    expect(out.status).toBe(200)
    for (const k of LIVENESS_KEYS) expect(out.body.targets[k].state).toBe('unreachable')
  })

  it('distinguishes erroring from unreachable', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 })
    const out = await handleLiveness({}, {}, {}, { fetchImpl })
    expect(out.body.targets[LIVENESS_KEYS[0]]).toEqual({ state: 'erroring', status: 503 })
  })

  it('serves a cached verdict without probing again', async () => {
    const fetchImpl = okFetch()
    const env = { KV: { get: vi.fn().mockResolvedValue({ checkedAt: 'x', targets: {} }), put: vi.fn() } }
    const out = await handleLiveness({}, env, {}, { fetchImpl })
    expect(out.body.cached).toBe(true)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('still probes when the cache read throws', async () => {
    const fetchImpl = okFetch()
    const env = { KV: { get: vi.fn().mockRejectedValue(new Error('kv down')), put: vi.fn() } }
    const out = await handleLiveness({}, env, { waitUntil: () => {} }, { fetchImpl })
    expect(fetchImpl).toHaveBeenCalled()
    expect(out.status).toBe(200)
  })

  it('stamps when it checked, so a stale card can say how old the verdict is', async () => {
    const out = await handleLiveness({}, {}, {}, { fetchImpl: okFetch() })
    expect(new Date(out.body.checkedAt).toString()).not.toBe('Invalid Date')
  })
})
