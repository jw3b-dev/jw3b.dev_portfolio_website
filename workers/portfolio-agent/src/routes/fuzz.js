/*
 * jw3b.dev v2 — Fuzz route `/fuzz` (P2-15 · FR-009)  ·  audit-heuristics-engineer
 * Streams a Foundry fuzz HARNESS for pasted Solidity. The deterministic skeleton
 * (fuzzHarness.js — the SAME generator the client pre-renders, so no drift) is emitted BEFORE
 * any upstream await, so a real harness arrives instantly and offline-safe (BR-03). Then a model
 * pass STREAMS suggested edge cases/invariants: Claude (Opus — reserved for security, ADR-05) →
 * Workers-AI Qwen-Coder fallback → KV recorded run → a graceful note. The model only enhances the
 * scaffold; it never replaces it. Same SSE tag contract.
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from '../tagProtocol.js'
import { buildFuzzHarness } from '../../../../src/lib/fuzzHarness.js'
import { workersAiDelta, anthropicDelta, anthropicGatewayUrl, anthropicAuth, anthropicFetch } from './concierge.js'
import { pumpInto, recordedFrames, WORKERS_AI_MODEL } from './audit.js'

export const FUZZ_ANTHROPIC_MODEL = 'claude-opus-4-8' // ADR-05: strong model for security (env-overridable)
export const FUZZ_FALLBACK_MODEL = WORKERS_AI_MODEL // code-specialized Workers-AI fallback (Qwen-Coder)
export const FUZZ_REPLAY_KEY = 'fuzz-intro'

const FUZZ_SYSTEM =
  'You are a smart-contract fuzz-testing assistant. Given a Solidity contract and a generated ' +
  'Foundry fuzz skeleton, suggest concrete additional edge cases and invariants worth asserting. ' +
  'Do NOT rewrite the skeleton and do NOT invent vulnerabilities — add practical fuzzing tips only.'

function tipsMessages(source, harness) {
  return [
    {
      role: 'user',
      content: `Contract:\n\n${source}\n\nGenerated fuzz skeleton:\n${harness}\n\nSuggest 3–5 concrete edge cases and invariants worth fuzzing.`,
    },
  ]
}

/** Claude (via the AI Gateway) — primary model for the tips. Returns the SSE body or null. */
async function tryAnthropicTips(env, source, harness) {
  const url = anthropicGatewayUrl(env)
  if (!url || !env.ANTHROPIC_API_KEY) return null
  try {
    const auth = anthropicAuth(env.ANTHROPIC_API_KEY, FUZZ_SYSTEM)
    const res = await anthropicFetch(url, {
      method: 'POST',
      headers: auth.headers,
      body: JSON.stringify({
        model: env.FUZZ_MODEL || FUZZ_ANTHROPIC_MODEL,
        max_tokens: 1024,
        system: auth.system,
        messages: tipsMessages(source, harness),
        stream: true,
      }),
    })
    return res && res.ok && res.body ? res.body : null
  } catch {
    return null
  }
}

/** Workers-AI Qwen-Coder fallback when Claude is unavailable. Returns a ReadableStream or null. */
async function tryWorkersAiTips(env, source, harness) {
  if (!env || !env.AI) return null
  try {
    const stream = await env.AI.run(env.FUZZ_FALLBACK_MODEL || FUZZ_FALLBACK_MODEL, {
      messages: [{ role: 'system', content: FUZZ_SYSTEM }, ...tipsMessages(source, harness)],
      stream: true,
    })
    return stream instanceof ReadableStream ? stream : null
  } catch {
    return null
  }
}

/** `/fuzz` handler. `body.source` validated (present, ≤ cap) by the router. Never throws to client. */
export function handleFuzz(req, env, ctx, body, extraHeaders = {}) {
  const source = typeof body.source === 'string' ? body.source : ''
  const encoder = new TextEncoder()
  const harness = buildFuzzHarness(source) // deterministic, offline-safe — emitted first

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(sseFrame(harness)))

      let enhanced = false
      const anthropic = await tryAnthropicTips(env, source, harness)
      if (anthropic) {
        controller.enqueue(encoder.encode(sseFrame('\n— Suggested edge cases —\n')))
        await pumpInto(controller, anthropic, anthropicDelta, encoder)
        enhanced = true
      } else {
        const wai = await tryWorkersAiTips(env, source, harness)
        if (wai) {
          controller.enqueue(encoder.encode(sseFrame('\n— Suggested edge cases —\n')))
          await pumpInto(controller, wai, workersAiDelta, encoder)
          enhanced = true
        }
      }
      if (!enhanced) {
        const frames = await recordedFrames(env, FUZZ_REPLAY_KEY)
        if (frames) {
          for (const f of frames) controller.enqueue(encoder.encode(sseFrame(f)))
        } else {
          controller.enqueue(
            encoder.encode(sseFrame('\nAI tips are briefly unavailable — the harness above is complete and ready to run.')),
          )
        }
      }
      controller.enqueue(encoder.encode(SSE_DONE))
      controller.close()
    },
  })

  return new Response(stream, { headers: { ...SSE_HEADERS, 'X-Console': 'fuzz', ...extraHeaders } })
}
