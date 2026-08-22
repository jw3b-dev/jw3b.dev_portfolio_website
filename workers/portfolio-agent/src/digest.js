/*
 * The funnel digest  ·  backend-specialist  (P5-02's justification, finally cashed in)
 *
 * P5-02 was reprioritised to FIRST on the argument that "the binding constraint is no longer does
 * the loop work but does anyone KNOW whether it converts". The counters then shipped, the
 * migration was never applied so they counted nothing, and once fixed they were still read by
 * nobody. A metric nobody reads is not evidence — it is a table.
 *
 * This sends a weekly summary over the rail that is already proven to reach John (the same
 * `sendTelegram` the lead alerts use). Pull requires remembering to pull; push arrives.
 *
 * HONESTY IS THE HARD PART HERE, not the SQL. A number in a message gets believed, and these
 * counters cannot support most of what a reader will assume:
 *   · they count EVENTS, not people — there is no identifier, by design (ADR-P5-01), so "12 tool
 *     runs" is twelve events and may be one person twelve times;
 *   · the hero beacon is deduped per page load, so a visitor who edits fifty times counts once;
 *   · anything a visitor does with JS disabled, or from a blocked origin, counts as nothing.
 * So the message states its own limits inline. A digest that reads as analytics would invite
 * exactly the unearned conclusions this site refuses everywhere else.
 */
import { sendTelegram, telegramConfigured } from './notify.js'

/** How many days each digest covers. */
export const DIGEST_DAYS = 7

/** PURE — group rows into `{surface: {event: count}}`, ignoring anything malformed. */
export function shapeRows(rows) {
  const out = {}
  for (const r of rows || []) {
    const surface = typeof r?.surface === 'string' ? r.surface : null
    const event = typeof r?.event === 'string' ? r.event : null
    const n = Number(r?.count)
    if (!surface || !event || !Number.isFinite(n) || n <= 0) continue
    out[surface] = out[surface] || {}
    out[surface][event] = (out[surface][event] || 0) + Math.trunc(n)
  }
  return out
}

/**
 * PURE — the message. Returns null when there is nothing to report, so a quiet week sends
 * nothing rather than a weekly "0" that trains John to ignore the channel.
 */
export function formatDigest(rows, days = DIGEST_DAYS) {
  const shaped = shapeRows(rows)
  const surfaces = Object.keys(shaped).sort()
  if (!surfaces.length) return null

  const total = surfaces.reduce(
    (sum, s) => sum + Object.values(shaped[s]).reduce((a, b) => a + b, 0),
    0,
  )

  const lines = [`<b>jw3b.dev — last ${days} days</b>`, '']
  for (const s of surfaces) {
    const events = Object.entries(shaped[s]).sort(([a], [b]) => a.localeCompare(b))
    lines.push(`<b>${s}</b> — ${events.map(([e, n]) => `${e}: ${n}`).join(' · ')}`)
  }
  lines.push('')
  lines.push(`${total} events total.`)
  // The caveat travels WITH the numbers, not in a doc nobody opens beside them.
  lines.push(
    '<i>Events, not people — there is no visitor identifier by design, so a repeat visitor counts ' +
      'each time. The hero screen counts once per page load however much it is edited.</i>',
  )
  return lines.join('\n')
}

/**
 * Read the last `days` of counters and push the digest.
 *
 * Never throws: this runs on a cron with no user waiting, and a failed digest must not become a
 * retry storm or an alarming log. Returns a small result object for tests.
 */
export async function runDigest(env, { days = DIGEST_DAYS, fetchImpl } = {}) {
  if (!env?.DB) return { sent: false, reason: 'no_db' }
  if (!telegramConfigured(env)) return { sent: false, reason: 'not_configured' }

  let rows = []
  try {
    const res = await env.DB.prepare(
      `SELECT surface, event, SUM(count) AS count
         FROM funnel_counters
        WHERE day >= date('now', ?)
        GROUP BY surface, event`,
    )
      .bind(`-${days} day`)
      .all()
    rows = res?.results || []
  } catch {
    // Table missing (an unapplied migration — it has happened) or D1 unavailable. Silence is the
    // right outcome: nobody is waiting, and a broken digest must not page anyone.
    return { sent: false, reason: 'query_failed' }
  }

  const text = formatDigest(rows, days)
  if (!text) return { sent: false, reason: 'nothing_to_report' }

  const out = await sendTelegram(env, text, fetchImpl)
  return { sent: out.sent === true, reason: out.reason }
}
