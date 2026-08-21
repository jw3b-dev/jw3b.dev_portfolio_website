/*
 * jw3b.dev v2 — Lead notification (W1 · PRODUCT_AUDIT #1/#2/#3)  ·  backend-specialist
 *
 * WHY THIS FILE EXISTS. Until 2026-08-21 a visitor could complete Mission Control, submit a
 * contact, and be told "You're on John's list — John will follow up." There was no list: the row
 * went into D1 and nothing on earth read it. `engagement_requests` held ZERO rows in production,
 * and the worker had no mail, webhook, or push path of any kind. Someone could hire John and he
 * would never know. That is the single most expensive defect the v2 build shipped, and it is the
 * reason the rerun starts here.
 *
 * THE CONTRACT (in priority order — the order matters more than the code):
 *   1. The lead is PERSISTED FIRST. Notification is strictly downstream of durable capture.
 *   2. Notification NEVER blocks and NEVER fails the request. It runs in ctx.waitUntil() and
 *      swallows its own errors — Telegram being down must not cost John a conversion.
 *   3. Absent secrets = capture still works, and the caller is told the alert is not configured
 *      so the UI can stay honest rather than promising a follow-up that no channel carries.
 *
 * Visitor-supplied text (contact, wallet, free-text assessment answers) is escaped before it
 * reaches Telegram: it is untrusted input being rendered as HTML in John's client.
 */

const TELEGRAM_API = 'https://api.telegram.org'

// Telegram hard-caps a sendMessage payload at 4096 chars. We cap well under it and never let a
// single field dominate — a visitor pasting 200 chars of contact must not push the tier off the
// bottom of the alert.
const MAX_MESSAGE = 3500
const MAX_FIELD = 200

/** True only when BOTH secrets are present — a half-configured channel is not a channel. */
export function telegramConfigured(env) {
  return Boolean(env && typeof env.TELEGRAM_BOT_TOKEN === 'string' && env.TELEGRAM_BOT_TOKEN.trim() &&
    typeof env.TELEGRAM_CHAT_ID === 'string' && String(env.TELEGRAM_CHAT_ID).trim())
}

/**
 * Escape for Telegram's HTML parse mode. The visitor controls `contact` and the assessment
 * answers; unescaped `<` would break the message or inject markup into John's client.
 */
export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** Trim to a sane field width, escaped. Empty/absent → an em-dash so the line still reads. */
function field(value, max = MAX_FIELD) {
  const s = String(value == null ? '' : value).trim()
  if (!s) return '—'
  return escapeHtml(s.length > max ? `${s.slice(0, max)}…` : s)
}

/**
 * PURE — build the alert text for a lead.
 *
 * Deliberately front-loads the two things John acts on: WHO to reply to and WHAT they want. The
 * assessment answers ride at the bottom as context, never above the contact.
 *
 * @param {'engagement'|'book_a_call'} kind
 * @param {object} lead
 * @returns {string} Telegram HTML
 */
export function formatLeadMessage(kind, lead = {}) {
  const head = kind === 'book_a_call' ? '📞 <b>Book a call</b>' : '🟢 <b>New engagement request</b>'
  const lines = [head, '', `<b>Contact:</b> ${field(lead.contact)}`]

  if (lead.tier) lines.push(`<b>Tier:</b> ${field(lead.tier)}`)
  if (lead.indicative_price) lines.push(`<b>Indicative:</b> ${field(lead.indicative_price)}`)
  if (lead.objective) lines.push(`<b>Objective:</b> ${field(lead.objective)}`)
  if (lead.engagement) lines.push(`<b>Shape:</b> ${field(lead.engagement)}`)
  if (lead.route) lines.push(`<b>Route:</b> ${field(lead.route)}`)
  if (lead.wallet) lines.push(`<b>Wallet:</b> <code>${field(lead.wallet, 64)}</code>`)

  // Assessment answers are the visitor's own words about their situation — the most useful
  // context for the reply, so they travel with the alert rather than waiting in the database.
  const assessment = parseAssessment(lead.assessment_json)
  if (assessment) {
    lines.push('', '<b>Assessment:</b>')
    for (const [k, v] of Object.entries(assessment).slice(0, 8)) {
      lines.push(`• ${field(k, 40)}: ${field(v, 120)}`)
    }
  }

  if (lead.id) lines.push('', `<code>${field(lead.id, 64)}</code>`)

  const out = lines.join('\n')
  return out.length > MAX_MESSAGE ? `${out.slice(0, MAX_MESSAGE)}…` : out
}

/** Assessment arrives as a JSON string (or object). Malformed → dropped, never thrown. */
function parseAssessment(raw) {
  if (!raw) return null
  if (typeof raw === 'object') return raw
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Send one alert. Resolves to a result descriptor and NEVER throws — every caller is on a path
 * where the visitor has already been told their request was captured.
 *
 * @returns {Promise<{sent:boolean, reason?:string}>}
 */
export async function sendTelegram(env, text, fetchImpl = fetch) {
  if (!telegramConfigured(env)) return { sent: false, reason: 'not_configured' }
  try {
    const res = await fetchImpl(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    })
    return res && res.ok ? { sent: true } : { sent: false, reason: `http_${res ? res.status : 'no_response'}` }
  } catch {
    // The visitor's conversion is already durable. A Telegram outage is John's problem to notice
    // in the digest, not the visitor's problem to see as a 5xx.
    return { sent: false, reason: 'network' }
  }
}

/**
 * Fire-and-forget a lead alert. Call AFTER the row is durable.
 *
 * Returns synchronously-known truth — whether an alert channel is configured at all — so the
 * route can tell the client the honest thing. It deliberately does NOT report delivery: the send
 * outlives the response by design (ctx.waitUntil), and claiming "delivered" before the await
 * resolves would be exactly the class of lie this file exists to end.
 *
 * @returns {{alerting:boolean}}
 */
export function notifyLead(env, ctx, kind, lead, fetchImpl = fetch) {
  const alerting = telegramConfigured(env)
  if (!alerting) return { alerting: false }
  const work = sendTelegram(env, formatLeadMessage(kind, lead), fetchImpl)
  if (ctx && typeof ctx.waitUntil === 'function') ctx.waitUntil(work)
  return { alerting: true }
}
