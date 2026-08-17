/*
 * jw3b.dev v2 — AI TAG PROTOCOL (FR-052)  ·  owner: domain-engine (MAS P0-04)
 * The wire contract between the portfolio-agent Worker (EMITS) and the client (PARSES + STRIPS).
 * Server-owned, single grammar — MIRRORED verbatim in workers/portfolio-agent/src/tagProtocol.js;
 * a sync test (src/lib/__tests__/tagProtocol.test.js) fails CI if the two drift.
 *
 * Grammar (faithful to the live Worker, jw3b.dev_website/workers/portfolio-agent/src/index.js):
 *   [AUDIO: "spoken summary for TTS"]
 *   [TOOL_CALL: {"action":"openModal","type":"pricing"}]
 *   [RENDER_CARD: "pricing_tier_card"]
 * SSE frames (Cloudflare text/event-stream):
 *   content : data: {"response":"..."}\n\n     terminator: data: [DONE]\n\n
 */

export const TAG = {
  AUDIO: /\[AUDIO:\s*"([\s\S]*?)"\]/,
  TOOL_CALL: /\[TOOL_CALL:\s*(\{[\s\S]*?\})\]/,
  RENDER_CARD: /\[RENDER_CARD:\s*"([\s\S]*?)"\]/,
}

// Strips ANY protocol tag (well-formed or recognizable) from display text.
const STRIP_ALL = /\[(?:AUDIO|TOOL_CALL|RENDER_CARD):[\s\S]*?\]/g

/**
 * Pure parse: split streamed assistant text into display text + the side-channel tags.
 * @returns {{text:string, audio:string|null, renderCard:string|null, toolCall:object|null}}
 */
export function parseTags(raw) {
  const text = raw == null ? '' : String(raw)
  const audioM = text.match(TAG.AUDIO)
  const cardM = text.match(TAG.RENDER_CARD)
  const toolM = text.match(TAG.TOOL_CALL)
  let toolCall = null
  if (toolM) {
    try { toolCall = JSON.parse(toolM[1]) } catch { toolCall = null } // malformed JSON → no action, never throw
  }
  return {
    text: text.replace(STRIP_ALL, '').replace(/[ \t]{2,}/g, ' ').trim(),
    audio: audioM ? audioM[1] : null,
    renderCard: cardM ? cardM[1] : null,
    toolCall,
  }
}

/**
 * CLIENT-ONLY display helper (not part of the wire grammar — the Worker never trims):
 * while a reply STREAMS, a tag can arrive split across chunks, so the visible text briefly
 * ends in a raw fragment like `[AUDIO: "…`. Trim a trailing UNTERMINATED tag-start so the
 * flash never renders. Closed tags are untouched (parseTags strips those), and non-tag
 * brackets (markdown links, plain text) pass through unchanged.
 */
export function trimPartialTag(text) {
  const s = text == null ? '' : String(text)
  const i = s.lastIndexOf('[')
  if (i === -1) return s
  const tail = s.slice(i + 1)
  if (tail.includes(']')) return s // bracket is closed → nothing partial here
  const isPartial = ['AUDIO:', 'TOOL_CALL:', 'RENDER_CARD:'].some(
    (n) => tail.startsWith(n) || n.startsWith(tail.slice(0, n.length)),
  )
  return isPartial ? s.slice(0, i).replace(/[ \t]+$/, '') : s
}

// ── SSE frame contract ───────────────────────────────────────────────────────────────────
export const SSE_DONE = 'data: [DONE]\n\n'
export const SSE_HEADERS = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }

/** Build one content frame. */
export function sseFrame(response) {
  return `data: ${JSON.stringify({ response: String(response) })}\n\n`
}

/**
 * Parse one SSE line → a chunk, the done sentinel, or null (ignored partial/keepalive).
 * @returns {{response:string}|{done:true}|null}
 */
export function parseSseLine(line) {
  if (typeof line !== 'string' || !line.startsWith('data: ')) return null
  const payload = line.slice(6)
  if (payload === '[DONE]') return { done: true }
  try {
    const d = JSON.parse(payload)
    return typeof d.response === 'string' ? { response: d.response } : null
  } catch {
    return null // partial JSON across a chunk boundary — caller buffers and retries
  }
}
