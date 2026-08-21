import { describe, it, expect, vi } from 'vitest'
import { streamAuditNarrative } from '../auditStream.js'

/*
 * The transport's contract is that it NEVER throws. The console's floor is the deterministic
 * screen already on the page; an exception escaping here would take a working page down over an
 * optional narrative. Every failure the Worker can produce must land as `degraded: true`.
 */

const enc = new TextEncoder()
const bodyOf = (chunks) => {
  let i = 0
  return { getReader: () => ({ read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }) }) }
}
const ok = (chunks) => async () => ({ ok: true, body: bodyOf(chunks) })
const frame = (t) => `data: {"response":${JSON.stringify(t)}}\n\n`

describe('streamAuditNarrative', () => {
  it('accumulates frames and emits the full text so far on each one', async () => {
    const chunks = []
    const r = await streamAuditNarrative('contract C {}', {
      fetchImpl: ok([frame('Hello '), frame('world'), 'data: [DONE]\n\n']),
      onChunk: (t) => chunks.push(t),
    })
    expect(r).toEqual({ text: 'Hello world', degraded: false })
    // `displayText` trims, so the mid-stream emit is 'Hello', not 'Hello ' — the reader never
    // sees a dangling space while a word is still arriving.
    expect(chunks).toEqual(['Hello', 'Hello world'])
  })

  it('reassembles a frame split across chunk boundaries', async () => {
    const whole = frame('split me')
    const r = await streamAuditNarrative('c', { fetchImpl: ok([whole.slice(0, 12), whole.slice(12)]) })
    expect(r.text).toBe('split me')
    expect(r.degraded).toBe(false)
  })

  it('strips the embedded tag protocol before anything reaches a reader', async () => {
    const r = await streamAuditNarrative('c', { fetchImpl: ok([frame('Findings.[AUDIO: "spoken"]'), 'data: [DONE]\n\n']) })
    expect(r.text).toBe('Findings.')
  })

  it('stops at [DONE] and ignores anything after it', async () => {
    const r = await streamAuditNarrative('c', { fetchImpl: ok([frame('kept'), 'data: [DONE]\n\n', frame('ignored')]) })
    expect(r.text).toBe('kept')
  })

  it('ignores unparseable lines rather than failing the run', async () => {
    const r = await streamAuditNarrative('c', { fetchImpl: ok(['noise\n', 'data: {bad json}\n', frame('real'), 'data: [DONE]\n\n']) })
    expect(r.text).toBe('real')
  })

  it('degrades on a non-200, a missing body, or no response at all', async () => {
    const cases = [async () => ({ ok: false, body: bodyOf([]) }), async () => ({ ok: true, body: null }), async () => null]
    for (const fetchImpl of cases) {
      expect(await streamAuditNarrative('c', { fetchImpl })).toEqual({ text: '', degraded: true })
    }
  })

  it('degrades on a 200 that streams nothing — success clothes on a failure', async () => {
    expect(await streamAuditNarrative('c', { fetchImpl: ok(['data: [DONE]\n\n']) })).toEqual({ text: '', degraded: true })
    expect(await streamAuditNarrative('c', { fetchImpl: ok([frame('   '), 'data: [DONE]\n\n']) }).then((r) => r.degraded)).toBe(true)
  })

  it('keeps the partial text when the stream drops mid-response', async () => {
    let i = 0
    const fetchImpl = async () => ({
      ok: true,
      body: {
        getReader: () => ({
          read: async () => {
            if (i++ === 0) return { done: false, value: enc.encode(frame('half an answer')) }
            throw new Error('mid-stream drop')
          },
        }),
      },
    })
    const r = await streamAuditNarrative('c', { fetchImpl })
    expect(r.text).toBe('half an answer')
    expect(r.degraded).toBe(true) // partial is honest, but it is not a completed answer
  })

  it('degrades when the request itself throws (Worker unreachable)', async () => {
    const r = await streamAuditNarrative('c', {
      fetchImpl: async () => {
        throw new Error('offline')
      },
    })
    expect(r).toEqual({ text: '', degraded: true })
  })

  it('degrades when there is no fetch available at all', async () => {
    const saved = globalThis.fetch
    vi.stubGlobal('fetch', undefined)
    expect(await streamAuditNarrative('c', {})).toEqual({ text: '', degraded: true })
    vi.stubGlobal('fetch', saved)
  })

  it('posts the source as JSON to the audit endpoint', async () => {
    const spy = vi.fn(ok(['data: [DONE]\n\n']))
    await streamAuditNarrative('contract C {}', { fetchImpl: spy, url: 'https://example.test/audit' })
    expect(spy).toHaveBeenCalledWith(
      'https://example.test/audit',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ source: 'contract C {}' }) }),
    )
  })

  it('survives a caller that passes no onChunk', async () => {
    const r = await streamAuditNarrative('c', { fetchImpl: ok([frame('quiet'), 'data: [DONE]\n\n']) })
    expect(r.text).toBe('quiet')
  })
})
