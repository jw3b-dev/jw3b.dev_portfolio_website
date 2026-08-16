/*
 * jw3b.dev v2 — Audit route `/audit` (P1-04 · FR-013/FR-008 · ADR-05)  ·  backend-specialist
 * Heuristics-FIRST stream: the deterministic severity table (auditHeuristics.js, the domain
 * owner's engine) is emitted before any upstream await, so real findings arrive < 300ms even
 * when the model/Worker upstream is offline (BR-03). Then a stronger-model narrative streams:
 * Anthropic (Opus via AI Gateway) → Workers AI Llama → KV recorded run → a graceful note —
 * the heuristics stay real through every fallback. D1 keeps only a SHA-256 of the source (no
 * raw contract retained). Secrets from env only; the Anthropic key never leaves the Worker.
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from '../tagProtocol.js'
import { runKvKey } from '../replay.js'
import { auditSolidity, formatFindingsText, AUDIT_DISCLAIMER } from '../auditHeuristics.js'
import { anthropicDelta, workersAiDelta, anthropicGatewayUrl } from './concierge.js'

export const AUDIT_MODEL = 'claude-opus-4-8' // ADR-05: reserve the stronger model for security (env-overridable)
export const AUDIT_LLAMA_MODEL = '@cf/meta/llama-3.1-70b-instruct'
export const AUDIT_REPLAY_KEY = 'audit-intro'

const AUDIT_SYSTEM =
  'You are a smart-contract security assistant. You are given a Solidity source and a ' +
  'deterministic heuristic finding set. Explain the real risks and concrete fixes precisely ' +
  'and conservatively. Do NOT invent vulnerabilities or overstate severity. This is an ' +
  'automated first-pass screen, not a full manual audit.'

function narrativeMessages(source, findingsText) {
  return [
    {
      role: 'user',
      content: `Contract:\n\n${source}\n\nHeuristic first-pass findings:\n${findingsText}\n\nExplain the risks and the concrete fixes.`,
    },
  ]
}

async function tryAnthropicNarrative(env, source, findingsText) {
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
        model: env.AUDIT_MODEL || AUDIT_MODEL,
        max_tokens: 1500,
        system: AUDIT_SYSTEM,
        messages: narrativeMessages(source, findingsText),
        stream: true,
      }),
    })
    return res.ok && res.body ? res.body : null
  } catch {
    return null
  }
}

async function tryLlamaNarrative(env, source, findingsText) {
  if (!env || !env.AI) return null
  try {
    const stream = await env.AI.run(env.AUDIT_LLAMA_MODEL || AUDIT_LLAMA_MODEL, {
      messages: [{ role: 'system', content: AUDIT_SYSTEM }, ...narrativeMessages(source, findingsText)],
      stream: true,
    })
    return stream instanceof ReadableStream ? stream : null
  } catch {
    return null
  }
}

/** Read a KV recorded run and return its labelled frame strings (or null). */
export async function recordedFrames(env, key) {
  if (!env || !env.KV) return null
  const raw = await env.KV.get(runKvKey(key))
  if (!raw) return null
  try {
    const run = JSON.parse(raw)
    if (!Array.isArray(run.frames)) return null
    const dated = run.capturedAt ? ` · captured ${run.capturedAt}` : ''
    const header = `[${run.label || 'Recorded run'}${dated}] `
    const frames = run.frames.map((f) => (typeof f?.response === 'string' ? f.response : '')).filter(Boolean)
    if (frames.length === 0) return null
    return [header + frames[0], ...frames.slice(1)]
  } catch {
    return null
  }
}

/** SHA-256 hex of the source — the only thing about the contract we retain (privacy). */
export async function sha256Hex(s) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(String(s || '')))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function persistAudit(env, inputHash, durationMs, source) {
  if (!env || !env.DB) return
  try {
    await env.DB.prepare(
      'INSERT INTO audit_runs (id, tool, input_hash, duration_ms, source) VALUES (?1, ?2, ?3, ?4, ?5)',
    )
      .bind(crypto.randomUUID(), 'auditor', inputHash, durationMs, source)
      .run()
  } catch {
    // best-effort analytics — never fail the audit on a D1 blip
  }
}

async function pumpInto(controller, upstream, deltaFn, encoder) {
  const decoder = new TextDecoder()
  const reader = upstream.getReader()
  let buffer = ''
  const flush = (line) => {
    if (!line.startsWith('data:')) return
    const t = deltaFn(line.slice(5).trim())
    if (t) controller.enqueue(encoder.encode(sseFrame(t)))
  }
  for (;;) {
    const { done, value } = await reader.read()
    if (done) {
      if (buffer) flush(buffer)
      return
    }
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) flush(line)
  }
}

/**
 * `/audit` handler. `body.source` is validated (present, non-empty, ≤ cap) by the router.
 * Streams heuristics first, then a model/recorded narrative. Never throws to the client.
 */
export function handleAudit(req, env, ctx, body, extraHeaders = {}) {
  const source = typeof body.source === 'string' ? body.source : ''
  const started = Date.now()
  const result = auditSolidity(source)
  const findingsText = formatFindingsText(result)
  const encoder = new TextEncoder()
  const inputHashP = sha256Hex(source)
  const waitUntil = (p) => ctx && typeof ctx.waitUntil === 'function' && ctx.waitUntil(p)

  const stream = new ReadableStream({
    async start(controller) {
      // 1) heuristic severity table — enqueued BEFORE any await (real, < 300ms).
      controller.enqueue(encoder.encode(sseFrame(findingsText)))
      // 2) AI-assisted-first-pass disclaimer (BR-10).
      controller.enqueue(encoder.encode(sseFrame(AUDIT_DISCLAIMER)))

      // 3) stronger-model narrative: Anthropic (Opus) → Llama → KV recorded → graceful note.
      let source_tier = 'live'
      let narrated = false
      const anthropic = await tryAnthropicNarrative(env, source, findingsText)
      if (anthropic) {
        controller.enqueue(encoder.encode(sseFrame('\n— Analysis —\n')))
        await pumpInto(controller, anthropic, anthropicDelta, encoder)
        narrated = true
      }
      if (!narrated) {
        const llama = await tryLlamaNarrative(env, source, findingsText)
        if (llama) {
          controller.enqueue(encoder.encode(sseFrame('\n— Analysis —\n')))
          await pumpInto(controller, llama, workersAiDelta, encoder)
          narrated = true
        }
      }
      if (!narrated) {
        const frames = await recordedFrames(env, AUDIT_REPLAY_KEY)
        if (frames) {
          source_tier = 'cached_replay'
          for (const f of frames) controller.enqueue(encoder.encode(sseFrame(f)))
        } else {
          controller.enqueue(
            encoder.encode(
              sseFrame(
                'Live narrative is briefly unavailable — the heuristic findings above are real. Book a call or try again shortly.',
              ),
            ),
          )
        }
      }
      controller.enqueue(encoder.encode(SSE_DONE))
      controller.close()
      waitUntil(inputHashP.then((hash) => persistAudit(env, hash, Date.now() - started, source_tier)))
    },
  })

  return new Response(stream, {
    headers: { ...SSE_HEADERS, 'X-Console': 'audit', ...extraHeaders },
  })
}
