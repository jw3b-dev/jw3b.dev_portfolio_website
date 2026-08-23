import { describe, it, expect, vi } from 'vitest'
import { decide, handleCodehawks, CACHE_TTL_SEC, STALE_MAX_SEC } from '../routes/codehawks.js'

/*
 * The live record route. Its whole contract is what happens when Cyfrin is DOWN — because the
 * alternative failure modes are both worse than "no number": a blank where a credential was, or
 * the zeros Cyfrin's own anonymous stats endpoint hands out to unauthenticated callers.
 */
const RECORD = { xp: 1430.8, high: 8, medium: 5, low: 4, validSubmissions: 17, allTimePosition: 288 }
const NOW = 1_800_000_000_000

const kv = (initial = null) => {
  let store = initial === null ? null : JSON.stringify(initial)
  return {
    get: vi.fn(async () => (store === null ? null : JSON.parse(store))),
    put: vi.fn(async (_k, v) => { store = v }),
  }
}
const upstream = (record) => async () => ({
  ok: true,
  status: 200,
  json: async () => [{ result: { data: { leaderboard: [{
    position: 88, highCount: record.high, mediumCount: record.medium, lowCount: record.low,
    xp: record.xp, user: { profilesId: 'cm2e9us23000nr9xxufv4v9jq', username: null },
  }] } } }],
})
const ctx = () => ({ waitUntil: vi.fn() })

describe('decide — pure', () => {
  it('prefers a fresh answer', () => {
    expect(decide({ cached: null, fresh: { ok: true, record: RECORD }, nowMs: NOW }))
      .toMatchObject({ state: 'live', record: RECORD, ageSec: 0 })
  })

  it('falls back to a STALE cached record with its age when upstream fails', () => {
    expect(decide({
      cached: { record: RECORD, fetchedAt: NOW - 3600_000 },
      fresh: { ok: false, reason: 'unreachable' },
      nowMs: NOW,
    })).toMatchObject({ state: 'stale', record: RECORD, ageSec: 3600, reason: 'unreachable' })
  })

  it('refuses a cached record older than the stale window rather than showing an ancient number', () => {
    expect(decide({
      cached: { record: RECORD, fetchedAt: NOW - (STALE_MAX_SEC + 60) * 1000 },
      fresh: { ok: false, reason: 'unreachable' },
      nowMs: NOW,
    })).toMatchObject({ state: 'unknown', record: null })
  })

  it('returns unknown — never a zero — with nothing to stand behind', () => {
    const out = decide({ cached: null, fresh: { ok: false, reason: 'http-503' }, nowMs: NOW })
    expect(out).toEqual({ state: 'unknown', record: null, reason: 'http-503' })
  })

  it('ignores a malformed cache entry', () => {
    for (const cached of [{}, { record: RECORD }, { fetchedAt: NOW }, { record: null, fetchedAt: NOW }]) {
      expect(decide({ cached, fresh: { ok: false, reason: 'x' }, nowMs: NOW }).state).toBe('unknown')
    }
  })

  it('reports no-fetch when there was no attempt at all', () => {
    expect(decide({ cached: null, fresh: null, nowMs: NOW }).reason).toBe('no-fetch')
    expect(decide({ cached: { record: RECORD, fetchedAt: NOW - 1000 }, fresh: null, nowMs: NOW }).reason).toBe('no-fetch')
  })
})

describe('handleCodehawks', () => {
  it('serves a fresh cache without touching upstream at all', async () => {
    const KV = kv({ record: RECORD, fetchedAt: NOW - 60_000 })
    const fetchImpl = vi.fn()
    const out = await handleCodehawks({}, { KV }, ctx(), { fetchImpl, nowMs: NOW })
    expect(out.body).toMatchObject({ state: 'live', cached: true, ageSec: 60 })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('refetches once the cache is past its TTL', async () => {
    const KV = kv({ record: RECORD, fetchedAt: NOW - (CACHE_TTL_SEC + 60) * 1000 })
    const fetchImpl = vi.fn(upstream(RECORD))
    const out = await handleCodehawks({}, { KV }, ctx(), { fetchImpl, nowMs: NOW })
    expect(fetchImpl).toHaveBeenCalled()
    // Assert the figures, not allTimePosition: the stub serves the row on PAGE 1, so the absolute
    // position is 88 there, while the real board has him at 288 on page 3. Position is a function
    // of where the row was found, which is exactly why it is derived rather than trusted.
    expect(out.body.state).toBe('live')
    expect(out.body.record).toMatchObject({ xp: RECORD.xp, high: 8, medium: 5, low: 4, validSubmissions: 17 })
    expect(out.body.record.allTimePosition).toBe(88)
  })

  it('caches a fresh record via waitUntil, never blocking the response', async () => {
    const KV = kv()
    const c = ctx()
    await handleCodehawks({}, { KV }, c, { fetchImpl: upstream(RECORD), nowMs: NOW })
    expect(c.waitUntil).toHaveBeenCalled()
    await c.waitUntil.mock.calls[0][0]
    expect(KV.put).toHaveBeenCalled()
  })

  it('serves STALE with its age when upstream is down', async () => {
    const KV = kv({ record: RECORD, fetchedAt: NOW - (CACHE_TTL_SEC + 1000) * 1000 })
    const out = await handleCodehawks({}, { KV }, ctx(), {
      fetchImpl: async () => { throw new Error('down') }, nowMs: NOW,
    })
    expect(out.body).toMatchObject({ state: 'stale', record: RECORD, reason: 'unreachable' })
    expect(out.body.ageSec).toBeGreaterThan(CACHE_TTL_SEC)
  })

  it('returns unknown, status 200, with no KV at all', async () => {
    const out = await handleCodehawks({}, {}, ctx(), {
      fetchImpl: async () => ({ ok: false, status: 503 }), nowMs: NOW,
    })
    expect(out.status).toBe(200)
    expect(out.body).toMatchObject({ state: 'unknown', record: null })
  })

  it('survives a KV that throws on read', async () => {
    const KV = { get: async () => { throw new Error('kv down') }, put: async () => {} }
    const out = await handleCodehawks({}, { KV }, ctx(), { fetchImpl: upstream(RECORD), nowMs: NOW })
    expect(out.body.state).toBe('live')
  })

  it('never fails the request, whatever upstream does', async () => {
    for (const f of [
      async () => { throw new Error('x') },
      async () => ({ ok: false, status: 500 }),
      async () => ({ ok: true, status: 200, json: async () => ({ garbage: true }) }),
    ]) {
      expect((await handleCodehawks({}, {}, ctx(), { fetchImpl: f, nowMs: NOW })).status).toBe(200)
    }
  })

  it('works without a ctx (no waitUntil available)', async () => {
    const KV = kv()
    const out = await handleCodehawks({}, { KV }, null, { fetchImpl: upstream(RECORD), nowMs: NOW })
    expect(out.body.state).toBe('live')
  })
})
