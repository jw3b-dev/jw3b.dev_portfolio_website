/*
 * jw3b.dev v2 — Concierge client logic (P1-07 · FR-017/FR-020)  ·  full-stack-integrator
 * PURE helpers for the concierge SSE client: build the outgoing turn list, decide when to drop
 * to the Tier-2 bundled recorded run (independent failure domain), and shape the degraded
 * message. Keeping this out of the React hook makes the never-blank guarantee (FR-020) unit
 * testable without a DOM. Tag stripping reuses the shared parser (FR-017, synced via P0-04).
 */
import { loadReplay } from './replay.js'
import { parseTags } from './tagProtocol.js'

export const CONCIERGE_REPLAY_KEY = 'concierge-intro'
export const BOOK_A_CALL_FALLBACK =
  "I can't reach the live agent right now — but you can still book a call and John will follow up personally."

/** Build the outgoing messages array from prior turns + the new user text (drops degraded/empty). */
export function buildOutgoing(history, text) {
  const prior = (Array.isArray(history) ? history : [])
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() &&
        !m.degraded,
    )
    .map((m) => ({ role: m.role, content: m.content }))
  return [...prior, { role: 'user', content: String(text || '') }]
}

/** Decide whether a fetch Response means "drop to the Tier-2 bundled run" (never blank, FR-020). */
export function shouldDegrade(res) {
  if (!res) return true
  if (res.status === 503) return true
  if (res.headers && typeof res.headers.get === 'function' && res.headers.get('X-Replay-Fallthrough') === 'tier-2')
    return true
  if (!res.body) return true
  return false
}

/** The assistant message shown when we drop to Tier-2: a labelled recorded run, else book-a-call. */
export function degradedMessage(key = CONCIERGE_REPLAY_KEY) {
  const run = loadReplay(key)
  const frames = run ? run.frames.map((f) => f.response).filter(Boolean) : []
  if (frames.length) {
    return { role: 'assistant', content: `[${run.label}] ${frames.join(' ')}`, degraded: true, offerCall: true }
  }
  return { role: 'assistant', content: BOOK_A_CALL_FALLBACK, degraded: true, offerCall: true }
}

/** Strip protocol tags for display (thin wrapper over the shared parser). */
export function displayText(raw) {
  return parseTags(raw).text
}
