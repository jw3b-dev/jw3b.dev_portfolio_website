/*
 * Report a funnel event  ·  full-stack-integrator  (brief 01, next-need 1)
 *
 * The funnel only ever counted what reached the Worker, so the hero's instant screen — the one
 * surface whose entire claim is "a visitor runs a real screen in under ten seconds" — was the
 * single thing it could not see. The measurement gap sat precisely on the claim being measured.
 *
 * ADR-P5-01 IS PRESERVED, and this is the part worth being careful about on a site that makes a
 * point of not tracking people:
 *   · The body is two enum values. No identifier, no cookie, no storage, no free text.
 *   · Deduped IN MEMORY, per page load — a module-level Set, not sessionStorage. Nothing is
 *     written to the visitor's device, so nothing can correlate two visits. It also stops a
 *     keystroke-driven surface from reporting hundreds of times.
 *   · Fire-and-forget, and never awaited by a caller. The screen it measures still runs offline
 *     and still runs if this fails; measurement must never become a dependency of the thing.
 *   · Origin-gated. The Worker's CORS allowlist rejects localhost and preview hosts, and the
 *     BROWSER logs that rejection before any catch can see it — which would put a console error
 *     on every local build. The console-error budget caught exactly that on the liveness badge;
 *     this is the same guard, applied before shipping the mistake twice.
 */
import { AGENT_FUNNEL_URL } from '../config/worker.js'
import { workerOriginAllowed } from '../config/embeds.js'

// Re-exported from the config so `worker.js` stays the ONE place a route path is written —
// the reachability gate reads that file, and a URL assembled here is invisible to it.
export const FUNNEL_URL = AGENT_FUNNEL_URL

/** Mirrors the Worker's closed vocabularies. A value not on these lists is dropped here too. */
export const BEACON_EVENTS = Object.freeze(['surface_view', 'tool_run', 'cta_click', 'request_submit'])
export const BEACON_SURFACES = Object.freeze([
  'home', 'work', 'audit', 'ctf', 'hire-me', 'messages', 'privacy', 'thesis', 'concierge',
])

/** In-memory, per page load. Deliberately NOT storage — see the header. */
const sent = new Set()

/** Exposed so tests can start from a clean slate; never called by application code. */
export function resetBeacon() {
  sent.clear()
}

/** PURE — is this a reportable pair, and has it already gone this page load? */
export function shouldSend(surface, event, seen = sent) {
  if (!BEACON_SURFACES.includes(surface) || !BEACON_EVENTS.includes(event)) return false
  return !seen.has(`${surface}:${event}`)
}

/**
 * Report one event, at most once per page load. Returns a promise for tests only — application
 * code must not await it, and nothing may branch on the result.
 */
export function reportFunnel(surface, event, { fetchImpl, url = FUNNEL_URL, originAllowed = workerOriginAllowed } = {}) {
  if (!shouldSend(surface, event)) return Promise.resolve(false)
  if (!originAllowed()) return Promise.resolve(false)

  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return Promise.resolve(false)

  sent.add(`${surface}:${event}`)
  return doFetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ surface, event }),
    keepalive: true, // survives the page being closed mid-flight
  })
    .then(() => true)
    .catch(() => false) // an uncounted event is not the visitor's problem
}
