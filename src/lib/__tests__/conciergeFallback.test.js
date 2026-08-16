import { describe, it, expect, vi, afterEach } from 'vitest'
import { handleConcierge } from '../../../workers/portfolio-agent/src/routes/concierge.js'

/*
 * The intermittent-degrade fix: when Claude (Haiku via the oat token) returns a 200 whose stream is
 * EMPTY or errors mid-stream, the concierge must fall back to the Workers-AI (Llama) model IN THE
 * SAME response — not stream nothing, which the client reads as empty and degrades to the recorded
 * run. If BOTH produce nothing, the empty stream lets the client show its Tier-2 floor.
 */
const enc = new TextEncoder()
const sseStream = (lines) =>
  new ReadableStream({
    start(c) {
      for (const l of lines) c.enqueue(enc.encode(l))
      c.close()
    },
  })
const erroringStream = () =>
  new ReadableStream({
    pull(c) {
      c.error(new Error('mid-stream drop'))
    },
  })
const readBody = (res) => new Response(res.body).text()
const claudeDelta = (t) => `data: {"type":"content_block_delta","delta":{"type":"text_delta","text":${JSON.stringify(t)}}}\n\n`
const llamaDelta = (t) => `data: {"response":${JSON.stringify(t)}}\n\n`

const body = { messages: [{ role: 'user', content: 'hi' }] }
// Gateway (CF_ACCOUNT_ID+AI_GATEWAY) + key make tryAnthropic reachable; AI.run is the Llama fallback.
// tryAnthropic only needs the key truthy and the fetch is stubbed. The value is a VARIABLE (never a
// quoted literal at the ANTHROPIC_API_KEY assignment) so the FR-050 secret-scan can't false-positive.
const KEY = ['test', 'only', 'value'].join('-')
const envWith = (aiRun) => ({ CF_ACCOUNT_ID: 'acct', AI_GATEWAY: 'gw', ANTHROPIC_API_KEY: KEY, AI: { run: aiRun } })

afterEach(() => vi.unstubAllGlobals())

describe('concierge in-response fallback (intermittent-degrade fix)', () => {
  it('streams Claude text when Haiku answers (no fallback)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(sseStream([claudeDelta('Hello from Claude')]), { status: 200 })))
    const aiRun = vi.fn()
    const res = await handleConcierge({}, envWith(aiRun), {}, body)
    expect(await readBody(res)).toContain('Hello from Claude')
    expect(aiRun).not.toHaveBeenCalled()
  })

  it('falls back to Llama when the Claude stream is EMPTY (200 + no text)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(sseStream([]), { status: 200 })))
    const aiRun = vi.fn(async () => sseStream([llamaDelta('Hello from Llama')]))
    const res = await handleConcierge({}, envWith(aiRun), {}, body)
    expect(await readBody(res)).toContain('Hello from Llama')
    expect(aiRun).toHaveBeenCalledTimes(1)
  })

  it('falls back to Llama when the Claude stream ERRORS mid-stream', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(erroringStream(), { status: 200 })))
    const aiRun = vi.fn(async () => sseStream([llamaDelta('Recovered via Llama')]))
    const res = await handleConcierge({}, envWith(aiRun), {}, body)
    expect(await readBody(res)).toContain('Recovered via Llama')
  })

  it('ends empty (→ client Tier-2 floor) when BOTH upstreams produce nothing', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(sseStream([]), { status: 200 })))
    const aiRun = vi.fn(async () => {
      throw new Error('llama down')
    })
    const res = await handleConcierge({}, envWith(aiRun), {}, body)
    const text = await readBody(res)
    expect(text).not.toContain('"response"') // no text frames emitted
    expect(text).toContain('[DONE]') // but the stream still closes cleanly
  })
})
