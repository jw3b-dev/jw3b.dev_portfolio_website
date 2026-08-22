/*
 * Flagship liveness  ·  backend-specialist  (brief 04, next-need 3)
 *
 * "A flagship that is down and silent about it is worse than one that says so." No card said
 * whether its system was up.
 *
 * WHY THIS IS A WORKER ROUTE AND NOT A FETCH FROM THE PAGE. kthulhu.co and kointel.co.za send no
 * `access-control-allow-origin`, so a browser fetch is blocked; a `no-cors` fetch returns an opaque
 * response whose status cannot be read, which would let us print "up" for a 500. Server-to-server
 * has no such problem, so the probe runs here and the page reads a plain JSON verdict.
 *
 * SSRF: the target is chosen from a CLOSED allowlist by KEY. No URL from the caller is ever
 * fetched — that is the whole difference between a liveness probe and an open proxy.
 *
 * HONESTY: this reports REACHABILITY, not correctness — the same distinction `agentStatus.js`
 * already draws between READY ("the worker answers") and LIVE ("a real answer arrived"). A 200
 * from a homepage means the origin is serving, nothing more, and the client copy must not upgrade
 * that into a claim that the product works.
 */

/** The only origins this route will ever fetch. Keyed, so no caller-supplied URL is possible. */
export const LIVENESS_TARGETS = Object.freeze({
  kthulhu: 'https://kthulhu.co/',
  kointel: 'https://kointel.co.za/',
})

export const LIVENESS_KEYS = Object.freeze(Object.keys(LIVENESS_TARGETS))

/** Cache long enough that a card render costs nothing, short enough to notice an outage. */
const CACHE_TTL_SEC = 120
const PROBE_TIMEOUT_MS = 5000

/** PURE — turn a fetch outcome into the verdict the UI renders. */
export function verdictFor({ ok, status }) {
  if (ok) return { state: 'reachable', status }
  if (typeof status === 'number' && status > 0) return { state: 'erroring', status }
  return { state: 'unreachable', status: null }
}

/**
 * `GET /liveness` — probes every allow-listed flagship origin.
 *
 * Never fails the request: an unreachable target is DATA, not an error, and a 5xx here would take
 * out a card that is only trying to add a status line.
 */
export async function handleLiveness(req, env, ctx, { fetchImpl } = {}) {
  const doFetch = fetchImpl || fetch
  const cacheKey = 'liveness:flagships'

  if (env?.KV) {
    try {
      const hit = await env.KV.get(cacheKey, 'json')
      if (hit) return { status: 200, body: { ...hit, cached: true } }
    } catch {
      /* a cache miss is never fatal */
    }
  }

  const entries = await Promise.all(
    LIVENESS_KEYS.map(async (key) => {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
      try {
        // HEAD keeps the probe cheap; a target that rejects HEAD still answers with a status,
        // which is all this needs.
        const res = await doFetch(LIVENESS_TARGETS[key], {
          method: 'HEAD',
          redirect: 'follow',
          signal: controller.signal,
        })
        return [key, verdictFor({ ok: res?.ok === true, status: res?.status })]
      } catch {
        // Timeout, DNS, TLS, connection refused — all indistinguishable to a visitor, and all
        // mean the same thing: we could not reach it.
        return [key, verdictFor({ ok: false, status: null })]
      } finally {
        clearTimeout(timer)
      }
    }),
  )

  const body = { checkedAt: new Date().toISOString(), targets: Object.fromEntries(entries) }

  if (env?.KV) {
    const write = env.KV.put(cacheKey, JSON.stringify(body), { expirationTtl: CACHE_TTL_SEC })
    ctx?.waitUntil ? ctx.waitUntil(write) : await write
  }
  return { status: 200, body }
}
