/*
 * jw3b.dev v2 — cookieless funnel counters (P5-02, implements ADR-P5-01) · backend-specialist
 *
 * The site could not answer "does this convert?" for any loop. FR-062 asserts a lead reaches John
 * and nothing counted how many visitors reached the form and left. This is the smallest thing that
 * answers it without changing the compliance story.
 *
 * THE RULE, ENFORCED BY SHAPE RATHER THAN BY DISCIPLINE:
 * the only fact stored is a count keyed by (day, surface, event). There is no field for a visitor
 * identifier, so no future edit can quietly add one without a migration that would be obvious in
 * review. No cookie, no device storage, no IP, no user agent, no sub-day timestamp.
 *
 * FAILS OPEN, ALWAYS. Instrumentation that can break a request is worse than no instrumentation:
 * the funnel exists to improve conversion, so a counter must never cost a conversion. Every path
 * here swallows its own errors and returns, exactly like `checkRateLimit`.
 */

/**
 * The four events, closed set. Anything else is dropped rather than stored — an open vocabulary
 * becomes a place to smuggle detail, and detail is what turns aggregates into tracking.
 */
export const FUNNEL_EVENTS = Object.freeze(['surface_view', 'tool_run', 'cta_click', 'request_submit'])

/** Surfaces are also a closed set, for the same reason: a free-text surface is a free-text field. */
export const FUNNEL_SURFACES = Object.freeze([
  'home', 'work', 'audit', 'ctf', 'hire-me', 'messages', 'privacy', 'thesis', 'concierge',
])

/** UTC day key, 'YYYY-MM-DD'. Day granularity is an ADR-P5-01 constraint, not a convenience. */
export function dayKey(nowMs) {
  return new Date(nowMs).toISOString().slice(0, 10)
}

/**
 * PURE validation. Returns the normalised record or null — null means "drop it", never "throw".
 * Exported so the whole decision surface is testable without a database.
 * @returns {{day:string, surface:string, event:string}|null}
 */
export function normalizeEvent({ surface, event } = {}, nowMs = Date.now()) {
  if (typeof surface !== 'string' || typeof event !== 'string') return null
  const s = surface.trim().toLowerCase()
  const e = event.trim().toLowerCase()
  if (!FUNNEL_SURFACES.includes(s)) return null
  if (!FUNNEL_EVENTS.includes(e)) return null
  return { day: dayKey(nowMs), surface: s, event: e }
}

/**
 * Increment one counter. Never throws, never awaits into the caller's critical path when the
 * caller passes `ctx` — the caller decides whether to wait, and no caller should.
 *
 * @returns {Promise<boolean>} whether a write was attempted (false = dropped or no DB).
 */
export async function recordEvent(env, input, nowMs = Date.now()) {
  const rec = normalizeEvent(input, nowMs)
  if (!rec) return false
  if (!env || !env.DB) return false // local dev without D1 — silently inert, never a 500
  try {
    await env.DB.prepare(
      `INSERT INTO funnel_counters (day, surface, event, count) VALUES (?1, ?2, ?3, 1)
       ON CONFLICT(day, surface, event) DO UPDATE SET count = count + 1`,
    )
      .bind(rec.day, rec.surface, rec.event)
      .run()
    return true
  } catch {
    // A counter must never cost a conversion. Swallow and move on.
    return false
  }
}

/**
 * Fire-and-forget from a request handler. Uses `ctx.waitUntil` so the response is not delayed by
 * the write, mirroring how lead alerts are dispatched in notify.js.
 */
export function track(env, ctx, input, nowMs = Date.now()) {
  const p = recordEvent(env, input, nowMs).catch(() => false)
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(p)
  return p
}
