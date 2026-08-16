/*
 * jw3b.dev v2 — Tx-explain route `/tx-explain` (P2-16 · FR-010)  ·  full-stack-integrator
 * Streams a plain-language explanation of a Base transaction from the client's DETERMINISTIC
 * decoded summary (txDecode.js runs client-side, so the decode shows even when this Worker is
 * down — that is the floor). The model here only enriches that summary: Workers AI Llama → KV
 * recorded run → a graceful note. It never asserts what the tx did beyond the summary. Same
 * SSE tag contract. `body.txHash` is validated by the router (^0x[0-9a-fA-F]{64}$).
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from '../tagProtocol.js'
import { workersAiDelta } from './concierge.js'
import { pumpInto, recordedFrames } from './audit.js'

export const TX_LLAMA_MODEL = '@cf/meta/llama-3.1-70b-instruct'
export const TX_REPLAY_KEY = 'tx-intro'

const TX_SYSTEM =
  'You explain an Ethereum/Base transaction in plain language for a non-expert, given a ' +
  'deterministic decoded summary. Explain what it does and any risk worth noting, ' +
  'conservatively. Do NOT invent details beyond the summary you are given.'

function txMessages(summary, txHash) {
  return [{ role: 'user', content: `Transaction ${txHash}\nDecoded summary: ${summary || '(no calldata decode available)'}\n\nExplain in plain language what this transaction does.` }]
}

async function tryLlamaNarrative(env, summary, txHash) {
  if (!env || !env.AI) return null
  try {
    const stream = await env.AI.run(env.TX_LLAMA_MODEL || TX_LLAMA_MODEL, {
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
      const llama = await tryLlamaNarrative(env, summary, txHash)
      if (llama) {
        controller.enqueue(encoder.encode(sseFrame('— Explanation —\n')))
        await pumpInto(controller, llama, workersAiDelta, encoder)
        narrated = true
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
