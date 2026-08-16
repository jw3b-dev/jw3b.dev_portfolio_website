import { describe, it, expect, vi } from 'vitest'
import { handleTxExplain } from '../../../workers/portfolio-agent/src/routes/txExplain.js'

const readSse = (res) => new Response(res.body).text()

describe('handleTxExplain — narrate with graceful fallback', () => {
  it('degrades to a note when no AI/KV (decode floor stands client-side)', async () => {
    const res = handleTxExplain({}, {}, {}, { txHash: '0x' + 'b'.repeat(64), summary: 'Calls transfer(...)' })
    const body = await readSse(res)
    expect(body).toMatch(/briefly unavailable/i)
    expect(res.headers.get('X-Console')).toBe('tx-explain')
  })
  it('streams the explanation when Llama is available', async () => {
    const enc = new TextEncoder()
    const AI = { run: vi.fn(() => Promise.resolve(new ReadableStream({ start(c) { c.enqueue(enc.encode('data: {"response":"it moves tokens"}\n')); c.close() } }))) }
    const body = await readSse(handleTxExplain({}, { AI }, {}, { txHash: '0x' + 'b'.repeat(64), summary: 's' }))
    expect(body).toMatch(/Explanation/)
  })
})
