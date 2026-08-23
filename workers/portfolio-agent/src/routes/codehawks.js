/*
 * `GET /codehawks` — the LIVE competitive-audit record  ·  backend-specialist
 *
 * WHY THIS EXISTS. The record shipped as a hand-copied snapshot and rotted in public: "#124" sat on
 * the homepage for months after the real figure moved, because a number a human must remember to
 * update is a number that will eventually be wrong
 * (mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md).
 *
 * WHY IT IS A WORKER ROUTE. Not for CORS — codehawks.cyfrin.io would probably allow a browser
 * fetch. For three other reasons:
 *   1. Finding the row costs THREE upstream requests (his row is ~288th, 100 per page). Paying that
 *      on every page load, from every visitor, is rude to a third party and slow for the reader.
 *   2. KV lets one fetch serve everybody, and lets a STALE answer survive an outage.
 *   3. The browser must never be the thing that decides a claim is true.
 *
 * STALE-WHILE-ERROR IS THE POINT. When Cyfrin is unreachable this serves the last known record with
 * its age attached, and the client says how old it is. The alternative — a blank, or worse a zero —
 * is exactly the failure this whole surface exists to prevent. `user.getAppStats` already returns
 * zeros for anonymous callers; a route that could publish those would be a regression with a
 * cache in front of it.
 *
 * NOT SERVED FROM HERE: rank. "Rank" is three different numbers on Cyfrin (#152 First Flights,
 * #155 rankFor12, #288 all-time combined). `allTimePosition` is passed through LABELLED, and the
 * UI must never render it as "rank" unqualified.
 */
import { fetchLiveRecord } from '../../../../src/lib/codehawksLive.js'

const CACHE_KEY = 'codehawks:record'
/** Six hours. The underlying figures move on the order of weeks; the freshness stamp is the point,
 *  not the granularity. */
export const CACHE_TTL_SEC = 6 * 60 * 60
/** How long a stale record may still be served while upstream is failing. A week-old number with
 *  its age shown beats no number; a month-old one is just the snapshot problem again. */
export const STALE_MAX_SEC = 7 * 24 * 60 * 60

/** PURE — decide what to serve given a cache entry and a fresh attempt. */
export function decide({ cached, fresh, nowMs }) {
  if (fresh && fresh.ok) {
    return { state: 'live', record: fresh.record, fetchedAt: nowMs, ageSec: 0 }
  }
  if (cached && cached.record && typeof cached.fetchedAt === 'number') {
    const ageSec = Math.max(0, Math.round((nowMs - cached.fetchedAt) / 1000))
    if (ageSec <= STALE_MAX_SEC) {
      return {
        state: 'stale',
        record: cached.record,
        fetchedAt: cached.fetchedAt,
        ageSec,
        reason: fresh ? fresh.reason : 'no-fetch',
      }
    }
  }
  // No fresh answer and nothing recent enough to stand behind. Say so; never invent a figure.
  return { state: 'unknown', record: null, reason: fresh ? fresh.reason : 'no-fetch' }
}

/**
 * Never fails the request. An upstream outage is DATA — a 5xx here would blank a card that is only
 * trying to say how fresh a number is.
 */
export async function handleCodehawks(req, env, ctx, { fetchImpl, nowMs = Date.now() } = {}) {
  const doFetch = fetchImpl || fetch

  let cached = null
  if (env?.KV) {
    try {
      cached = await env.KV.get(CACHE_KEY, 'json')
    } catch {
      /* a cache miss is never fatal */
    }
  }

  // Serve straight from cache while it is still fresh — no upstream call at all.
  if (cached && typeof cached.fetchedAt === 'number') {
    const ageSec = Math.max(0, Math.round((nowMs - cached.fetchedAt) / 1000))
    if (ageSec <= CACHE_TTL_SEC && cached.record) {
      return { status: 200, body: { state: 'live', record: cached.record, fetchedAt: cached.fetchedAt, ageSec, cached: true } }
    }
  }

  const fresh = await fetchLiveRecord({ fetchImpl: doFetch })
  const out = decide({ cached, fresh, nowMs })

  if (out.state === 'live' && env?.KV) {
    const write = env.KV.put(CACHE_KEY, JSON.stringify({ record: out.record, fetchedAt: nowMs }))
      .catch(() => {})
    // Never block the response on the cache write.
    if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(write)
  }

  return { status: 200, body: out }
}
