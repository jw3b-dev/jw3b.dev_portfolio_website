/*
 * The Worker's own copy of the tag protocol. The client mirror is drift-guarded from src/,
 * but the WORKER copy is what actually EMITS the frames — and it was only ever exercised
 * indirectly, at 62% coverage. If the emitter breaks, every streaming surface breaks.
 */
import { describe, it, expect } from 'vitest'
import { parseTags, sseFrame, parseSseLine, SSE_DONE, SSE_HEADERS, TAG } from '../tagProtocol.js'

describe('parseTags (worker copy)', () => {
  it('strips the side-channel tags from display text and extracts each one', () => {
    const raw = 'Here it is. [AUDIO: "spoken summary"] [RENDER_CARD: "pricing"] [TOOL_CALL: {"action":"openModal"}]'
    const r = parseTags(raw)
    expect(r.text).not.toMatch(/AUDIO|RENDER_CARD|TOOL_CALL/)
    expect(r.audio).toBe('spoken summary')
    expect(r.renderCard).toBe('pricing')
    expect(r.toolCall).toEqual({ action: 'openModal' })
  })

  it('never throws on malformed tool-call JSON — a bad tag must not kill a stream', () => {
    const r = parseTags('text [TOOL_CALL: {not json}] more')
    expect(r.toolCall).toBeNull()
    expect(r.text).not.toContain('TOOL_CALL')
  })

  it('handles empty, null and tag-free input', () => {
    expect(parseTags('').text).toBe('')
    expect(parseTags(null).text).toBe('')
    expect(parseTags('plain').text).toBe('plain')
    expect(parseTags('plain').audio).toBeNull()
  })

  it('exposes the tag grammar the client mirrors', () => {
    expect(TAG.AUDIO.test('[AUDIO: "x"]')).toBe(true)
    expect(TAG.RENDER_CARD.test('[RENDER_CARD: "x"]')).toBe(true)
    expect(TAG.TOOL_CALL.test('[TOOL_CALL: {"a":1}]')).toBe(true)
  })
})

describe('SSE framing (what the worker actually emits)', () => {
  it('emits a parseable content frame that round-trips', () => {
    const frame = sseFrame('hello "quoted" \n newline')
    expect(frame.startsWith('data: ')).toBe(true)
    expect(frame.endsWith('\n\n')).toBe(true)
    expect(parseSseLine(frame.trim()).response).toBe('hello "quoted" \n newline')
  })

  it('terminates with the DONE sentinel the client watches for', () => {
    expect(parseSseLine(SSE_DONE.trim())).toEqual({ done: true })
  })

  it('declares an event-stream content type that is never cached', () => {
    expect(SSE_HEADERS['Content-Type']).toContain('text/event-stream')
    expect(String(SSE_HEADERS['Cache-Control'])).toContain('no-store')
  })

  it('ignores keepalives, partial JSON and non-data lines rather than throwing', () => {
    for (const line of ['', ':keepalive', 'event: ping', 'data: {"partial', 'data: {"nope":1}']) {
      expect(() => parseSseLine(line)).not.toThrow()
      const r = parseSseLine(line)
      expect(r === null || typeof r === 'object').toBe(true)
    }
  })
})
