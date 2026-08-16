/*
 * jw3b.dev v2 — Tx-explain route `/tx-explain` (P2-16 · FR-010)  ·  full-stack-integrator
 * Streams a plain-language explanation of a Base transaction from the client's DETERMINISTIC
 * decoded summary (txDecode.js runs client-side, so the decode shows even when this Worker is
 * down — that is the floor). The model only enriches that summary: Claude (Opus — reserved for
 * security, ADR-05) → Workers-AI Qwen-Coder fallback → KV recorded run → a graceful note. It never
 * asserts what the tx did beyond the summary. Same SSE tag contract. `body.txHash` validated by the
 * router (^0x[0-9a-fA-F]{64}$).
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from '../tagProtocol.js'
import { workersAiDelta, anthropicDelta, anthropicGatewayUrl, anthropicAuth } from './concierge.js'
import { pumpInto, recordedFrames, WORKERS_AI_MODEL } from './audit.js'

export const TX_ANTHROPIC_MODEL = 'claude-opus-4-8' // ADR-05: strong model for security (env-overridable)
export const TX_FALLBACK_MODEL = WORKERS_AI_MODEL // code-specialized Workers-AI fallback (Qwen-Coder)
export const TX_REPLAY_KEY = 'tx-intro'

const TX_SYSTEM =
  'You explain an Ethereum/Base transaction in plain language for a non-expert, given a ' +
  'deterministic decoded summary. Explain what it does and any risk worth noting, ' +
  'conservatively. Do NOT invent details beyond the summary you are given.'

function txMessages(summary, txHash) {
  return [{ role: 'user', content: `Transaction ${txHash}\nDecoded summary: ${summary || '(no calldata decode available)'}\n\nExplain in plain language what this transaction does.` }]
}

/** Claude (via the AI Gateway) — primary model for the explanation. Returns the SSE body or null. */
async function tryAnthropicNarrative(env, summary, txHash) {
  const url = anthropicGatewayUrl(env)
  if (!url || !env.ANTHROPIC_API_KEY) return null
  try {
    const auth = anthropicAuth(env.ANTHROPIC_API_KEY, TX_SYSTEM)
    const res = await fetch(url, {
      method: 'POST',
      headers: auth.headers,
      body: JSON.stringify({
        model: env.TX_MODEL || TX_ANTHROPIC_MODEL,
        max_tokens: 900,
        system: auth.system,
        messages: txMessages(summary, txHash),
        stream: true,
      }),
    })
    return res.ok && res.body ? res.body : null
  } catch {
    return null
  }
}

/** Workers-AI Qwen-Coder fallback when Claude is unavailable. Returns a ReadableStream or null. */
async function tryWorkersAiNarrative(env, summary, txHash) {
  if (!env || !env.AI) return null
  try {
    const stream = await env.AI.run(env.TX_FALLBACK_MODEL || TX_FALLBACK_MODEL, {
      messages: [{ role: 'system', content: TX_SYSTEM }, ...txMessages(summary, txHash)],
      stream: true,
    })
    return stream instanceof ReadableStream ? stream : null
  } catch {
    return null
  }
}

/** `/tx-explain` handler. Streams the AI explanation; never throws to the client. */
export function handleTxExplain(req, env, ctx, body, extraHeaders = {}) {
  const txHash = typeof body.txHash === 'string' ? body.txHash : ''
  const summary = typeof body.summary === 'string' ? body.summary : ''
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      let narrated = false
      const anthropic = await tryAnthropicNarrative(env, summary, txHash)
      if (anthropic) {
        controller.enqueue(encoder.encode(sseFrame('— Explanation —\n')))
        await pumpInto(controller, anthropic, anthropicDelta, encoder)
        narrated = true
      } else {
        const wai = await tryWorkersAiNarrative(env, summary, txHash)
        if (wai) {
          controller.enqueue(encoder.encode(sseFrame('— Explanation —\n')))
          await pumpInto(controller, wai, workersAiDelta, encoder)
          narrated = true
        }
      }
      if (!narrated) {
        const frames = await recordedFrames(env, TX_REPLAY_KEY)
        if (frames) {
          for (const f of frames) controller.enqueue(encoder.encode(sseFrame(f)))
        } else {
          controller.enqueue(
            encoder.encode(sseFrame('A plain-language explanation is briefly unavailable — the decoded summary above is accurate.')),
          )
        }
      }
      controller.enqueue(encoder.encode(SSE_DONE))
      controller.close()
    },
  })

  return new Response(stream, { headers: { ...SSE_HEADERS, 'X-Console': 'tx-explain', ...extraHeaders } })
}
