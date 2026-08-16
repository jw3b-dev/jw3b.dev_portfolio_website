/*
 * jw3b.dev v2 — Concierge route `/` (P1-02 · FR-015/FR-052 · ADR-03/ADR-05)  ·  backend-specialist
 * SSE concierge chat with a 3-tier, independent-failure-domain fallback (BR-03/NFR-02):
 *   Tier-0 live  → Haiku via the Cloudflare AI Gateway (Anthropic)   [ADR-05 concierge tier]
 *                → Workers AI Llama                                   [same-request fallback]
 *   Tier-1 KV    → a labelled recorded run (replay.js)               [Worker-side store]
 *   Tier-2 SPA   → the client loads its bundled run when we 503 with X-Replay-Fallthrough.
 * The wire is the shared tag protocol (`data:{response}` … `[DONE]`). Tags are STRIPPED
 * before the D1 analytics append (PII-minimized: conversation id + text only, ADR-03).
 * Secrets come from env only; the Anthropic key never leaves the Worker (FR-050).
 */
import { sseFrame, SSE_DONE, SSE_HEADERS, parseTags } from '../tagProtocol.js'
import { serveRecordedRun } from '../replay.js'
import { conciergeSystemPrompt } from '../knowledge.js'

export const CONCIERGE_MODEL = 'claude-haiku-4-5-20251001' // ADR-05 concierge tier (env-overridable)
export const LLAMA_FALLBACK_MODEL = '@cf/meta/llama-3.1-70b-instruct'
export const REPLAY_KEY = 'concierge-intro' // Tier-1 KV key for the concierge surface
const MAX_TURNS = 20 // cap forwarded context — cost + prompt-injection surface
const MAX_CHARS = 4000 // per-message clamp

// Grounding = the register-generated KB (P1-03). This tiny fallback only guards the case
// where the generated prompt is somehow empty; it carries NO stats/claims by design.
export const CONCIERGE_SYSTEM_FALLBACK =
  "You are the concierge for John Wellard's (JW3B) engineering portfolio. Be concise and " +
  'factual. Never invent numbers, credentials, or claims — if you do not know, say so and ' +
  'point the visitor to the audit console, the shipped systems, or the hire flow.'

// ── Pure helpers (unit-tested) ────────────────────────────────────────────────────────────

/** Accept a client-supplied conversation id if it looks like an id, else use the minted one. */
export function safeConversationId(id, mint) {
  return typeof id === 'string' && /^[0-9a-f-]{8,64}$/i.test(id) ? id : mint
}

/** Map our [{role, content}] turns to Anthropic messages — filtered, clamped, tail-capped. */
export function toAnthropicMessages(messages) {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }))
}

/** The most recent user turn's text (for the D1 analytics append). */
export function lastUserText(messages) {
  const list = Array.isArray(messages) ? messages : []
  for (let i = list.length - 1; i >= 0; i--) {
    const m = list[i]
    if (m && m.role === 'user' && typeof m.content === 'string') return m.content.slice(0, MAX_CHARS)
  }
  return ''
}

/** Anthropic SSE: text from one `data:` payload (`''` for non-text events / [DONE]). */
export function anthropicDelta(payload) {
  if (!payload || payload === '[DONE]') return ''
  try {
    const d = JSON.parse(payload)
    if (d.type === 'content_block_delta' && d.delta && d.delta.type === 'text_delta')
      return String(d.delta.text || '')
    return ''
  } catch {
    return ''
  }
}

/** Workers AI SSE: text from one `data:` payload (already `{response}`-shaped). */
export function workersAiDelta(payload) {
  if (!payload || payload === '[DONE]') return ''
  try {
    const d = JSON.parse(payload)
    return typeof d.response === 'string' ? d.response : ''
  } catch {
    return ''
  }
}

/** Build the Anthropic-via-AI-Gateway Messages URL, or null when not configured (local dev). */
export function anthropicGatewayUrl(env) {
  const account = env && env.CF_ACCOUNT_ID
  const gateway = env && env.AI_GATEWAY
  if (!account || !gateway) return null
  return `https://gateway.ai.cloudflare.com/v1/${account}/${gateway}/anthropic/v1/messages`
}

// ── Streaming bridge ──────────────────────────────────────────────────────────────────────

/**
 * Bridge an upstream token stream to OUR SSE frames while accumulating the full text.
 * `deltaFn` maps one upstream `data:` payload to a text delta; `onComplete(fullText)` runs
 * once at end-of-stream (schedule the D1 append there via ctx.waitUntil).
 */
function bridgeStream(upstream, deltaFn, onComplete) {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const reader = upstream.getReader()
  let buffer = ''
  let full = ''
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        if (buffer.startsWith('data:')) {
          const t = deltaFn(buffer.slice(5).trim())
          if (t) {
            full += t
            controller.enqueue(encoder.encode(sseFrame(t)))
          }
        }
        controller.enqueue(encoder.encode(SSE_DONE))
        controller.close()
        onComplete(full)
        return
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() // retain the trailing partial line
      for (const line of lines) {
        if (!line.startsWith('data:')) continue
        const text = deltaFn(line.slice(5).trim())
        if (text) {
          full += text
          controller.enqueue(encoder.encode(sseFrame(text)))
        }
      }
    },
    cancel(reason) {
      reader.cancel(reason)
    },
  })
}

// ── Live upstreams (I/O) ────────────────────────────────────────────────────────────────────

async function tryAnthropic(env, messages, system) {
  const url = anthropicGatewayUrl(env)
  if (!url || !env.ANTHROPIC_API_KEY) return null
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: env.CONCIERGE_MODEL || CONCIERGE_MODEL,
        max_tokens: 1024,
        system,
        messages,
        stream: true,
      }),
    })
    return res.ok && res.body ? res.body : null
  } catch {
    return null
  }
}

async function tryLlama(env, messages, system) {
  if (!env || !env.AI) return null
  try {
    const stream = await env.AI.run(env.LLAMA_MODEL || LLAMA_FALLBACK_MODEL, {
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    })
    return stream instanceof ReadableStream ? stream : null
  } catch {
    return null
  }
}

// ── D1 append (parameterized, best-effort) ──────────────────────────────────────────────────

async function appendMessage(env, conversationId, role, content, source, hadAudio) {
  if (!env || !env.DB || !content) return
  try {
    await env.DB.prepare(
      'INSERT INTO conversations (id) VALUES (?1) ON CONFLICT(id) DO UPDATE SET updated_at = CURRENT_TIMESTAMP',
    )
      .bind(conversationId)
      .run()
    await env.DB.prepare(
      'INSERT INTO messages (conversation_id, role, content, had_audio, source) VALUES (?1, ?2, ?3, ?4, ?5)',
    )
      .bind(conversationId, role, content, hadAudio ? 1 : 0, source)
      .run()
  } catch {
    // Analytics is best-effort — a D1 blip must never break the visitor's chat.
  }
}

// ── Handler ─────────────────────────────────────────────────────────────────────────────────

function sseResponse(stream, conversationId, source, extraHeaders) {
  return new Response(stream, {
    headers: {
      ...SSE_HEADERS,
      'X-Conversation-Id': conversationId,
      'X-Replay-Tier': '0',
      'X-Replay-Source': source,
      ...extraHeaders,
    },
  })
}

/**
 * `/` concierge handler. `body` is the already-validated request body (messages[] present).
 * `extraHeaders` carries CORS from the router. Returns an SSE Response; never throws to the
 * client. On total upstream loss with no KV run, replies 503 + X-Replay-Fallthrough so the
 * client drops to its bundled Tier-2 run (P1-07 honors this header).
 */
export async function handleConcierge(req, env, ctx, body, extraHeaders = {}) {
  const messages = toAnthropicMessages(body.messages)
  const conversationId = safeConversationId(body.conversationId, crypto.randomUUID())
  const system = conciergeSystemPrompt || CONCIERGE_SYSTEM_FALLBACK // register-generated KB (P1-03)

  const waitUntil = (p) => ctx && typeof ctx.waitUntil === 'function' && ctx.waitUntil(p)

  // Record the user turn up front (analytics; PII-minimized — id + text only).
  const userText = lastUserText(body.messages)
  if (userText) waitUntil(appendMessage(env, conversationId, 'user', userText, 'live', 0))

  const persist = (source) => (full) => {
    const parsed = parseTags(full)
    if (parsed.text) waitUntil(appendMessage(env, conversationId, 'assistant', parsed.text, source, parsed.audio ? 1 : 0))
  }

  // Tier-0 live: Anthropic (Haiku) → Workers AI (Llama).
  if (messages.length > 0) {
    const anthropic = await tryAnthropic(env, messages, system)
    if (anthropic) return sseResponse(bridgeStream(anthropic, anthropicDelta, persist('live')), conversationId, 'live', extraHeaders)
    const llama = await tryLlama(env, messages, system)
    if (llama) return sseResponse(bridgeStream(llama, workersAiDelta, persist('live')), conversationId, 'live', extraHeaders)
  }

  // Tier-1: labelled KV recorded run (independent failure domain).
  const replay = await serveRecordedRun(env, REPLAY_KEY, { 'X-Conversation-Id': conversationId, ...extraHeaders })
  if (replay) return replay

  // Tier-2 handoff: no KV run — tell the client to load its bundled run.
  return new Response(sseFrame('[replay-fallthrough]') + SSE_DONE, {
    status: 503,
    headers: {
      ...SSE_HEADERS,
      'X-Conversation-Id': conversationId,
      'X-Replay-Tier': '2',
      'X-Replay-Fallthrough': 'tier-2',
      'Retry-After': '30',
      ...extraHeaders,
    },
  })
}
