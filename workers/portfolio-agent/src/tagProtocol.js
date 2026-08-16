/*
 * jw3b.dev v2 — AI TAG PROTOCOL (FR-052)  ·  Worker mirror  ·  owner: domain-engine (MAS P0-04)
 * VERBATIM mirror of src/lib/tagProtocol.js. The Worker emits tags + SSE frames with these
 * helpers; the client parses them with the mirror. A sync test fails CI if the two drift.
 * See src/lib/tagProtocol.js for the grammar documentation.
 */

export const TAG = {
  AUDIO: /\[AUDIO:\s*"([\s\S]*?)"\]/,
  TOOL_CALL: /\[TOOL_CALL:\s*(\{[\s\S]*?\})\]/,
  RENDER_CARD: /\[RENDER_CARD:\s*"([\s\S]*?)"\]/,
}

const STRIP_ALL = /\[(?:AUDIO|TOOL_CALL|RENDER_CARD):[\s\S]*?\]/g

export function parseTags(raw) {
  const text = raw == null ? '' : String(raw)
  const audioM = text.match(TAG.AUDIO)
  const cardM = text.match(TAG.RENDER_CARD)
  const toolM = text.match(TAG.TOOL_CALL)
  let toolCall = null
  if (toolM) {
    try { toolCall = JSON.parse(toolM[1]) } catch { toolCall = null }
  }
  return {
    text: text.replace(STRIP_ALL, '').replace(/[ \t]{2,}/g, ' ').trim(),
    audio: audioM ? audioM[1] : null,
    renderCard: cardM ? cardM[1] : null,
    toolCall,
  }
}

export const SSE_DONE = 'data: [DONE]\n\n'
export const SSE_HEADERS = { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store' }

export function sseFrame(response) {
  return `data: ${JSON.stringify({ response: String(response) })}\n\n`
}

export function parseSseLine(line) {
  if (typeof line !== 'string' || !line.startsWith('data: ')) return null
  const payload = line.slice(6)
  if (payload === '[DONE]') return { done: true }
  try {
    const d = JSON.parse(payload)
    return typeof d.response === 'string' ? { response: d.response } : null
  } catch {
    return null
  }
}
