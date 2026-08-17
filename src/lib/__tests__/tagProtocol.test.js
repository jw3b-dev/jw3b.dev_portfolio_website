import { describe, it, expect } from 'vitest'
import * as client from '../tagProtocol.js'
import * as worker from '../../../workers/portfolio-agent/src/tagProtocol.js'

// Fixtures taken from the REAL live Worker's emitted tags (jw3b.dev_website worker).
const FIXTURES = [
  'Plain answer, no tags.',
  '[AUDIO: "John runs three engineering retainers."] Here is the breakdown.',
  'Opening it now. [TOOL_CALL: {"action": "openModal", "type": "pricing"}]',
  'See the card. [RENDER_CARD: "pricing_tier_card"]',
  'All three: text [AUDIO: "spoken"] more [RENDER_CARD: "x"] end [TOOL_CALL: {"action":"a"}]',
  'Malformed tool [TOOL_CALL: {not json}] should not throw.',
  '',
  null,
]

describe('tag-protocol drift guard (client === worker mirror)', () => {
  it('parseTags produces identical output in both modules for every fixture', () => {
    for (const f of FIXTURES) {
      expect(client.parseTags(f)).toEqual(worker.parseTags(f))
    }
  })
  it('sseFrame + SSE_DONE + SSE_HEADERS match across modules', () => {
    expect(client.sseFrame('hi')).toBe(worker.sseFrame('hi'))
    expect(client.SSE_DONE).toBe(worker.SSE_DONE)
    expect(client.SSE_HEADERS).toEqual(worker.SSE_HEADERS)
  })
})

describe('parseTags', () => {
  it('returns clean text with no tags untouched', () => {
    expect(client.parseTags('Plain answer.').text).toBe('Plain answer.')
  })
  it('extracts + strips AUDIO', () => {
    const r = client.parseTags('[AUDIO: "say this"] visible')
    expect(r.audio).toBe('say this')
    expect(r.text).toBe('visible')
  })
  it('extracts TOOL_CALL as parsed object', () => {
    const r = client.parseTags('[TOOL_CALL: {"action":"openModal","type":"pricing"}]')
    expect(r.toolCall).toEqual({ action: 'openModal', type: 'pricing' })
  })
  it('extracts RENDER_CARD name', () => {
    expect(client.parseTags('[RENDER_CARD: "pricing_tier_card"]').renderCard).toBe('pricing_tier_card')
  })
  it('handles all three tags at once + strips them all', () => {
    const r = client.parseTags('a [AUDIO: "s"] b [RENDER_CARD: "c"] d [TOOL_CALL: {"action":"x"}] e')
    expect(r.audio).toBe('s'); expect(r.renderCard).toBe('c'); expect(r.toolCall).toEqual({ action: 'x' })
    expect(r.text).toBe('a b d e')
  })
  it('EDGE: malformed TOOL_CALL JSON → toolCall null, never throws', () => {
    expect(() => client.parseTags('[TOOL_CALL: {bad}]')).not.toThrow()
    expect(client.parseTags('[TOOL_CALL: {bad}]').toolCall).toBeNull()
  })
  it('EDGE: null / empty input → empty text, null tags', () => {
    expect(client.parseTags(null)).toEqual({ text: '', audio: null, renderCard: null, toolCall: null })
    expect(client.parseTags('').text).toBe('')
  })
})

describe('SSE frames', () => {
  it('sseFrame round-trips through parseSseLine', () => {
    const frame = client.sseFrame('hello world')
    const line = frame.trim() // strip the \n\n
    expect(client.parseSseLine(line)).toEqual({ response: 'hello world' })
  })
  it('parses the [DONE] sentinel', () => {
    expect(client.parseSseLine('data: [DONE]')).toEqual({ done: true })
  })
  it('EDGE: non-data / partial-JSON lines → null (caller buffers)', () => {
    expect(client.parseSseLine(': keepalive')).toBeNull()
    expect(client.parseSseLine('data: {"response":')).toBeNull()
    expect(client.parseSseLine('')).toBeNull()
  })
})

describe('trimPartialTag (client display helper — streaming flash guard)', () => {
  it('trims a trailing unterminated AUDIO fragment (and its whitespace)', () => {
    expect(client.trimPartialTag('Reply text. [AUDIO: "I don')).toBe('Reply text.')
    expect(client.trimPartialTag('Reply. [AUD')).toBe('Reply.')
    expect(client.trimPartialTag('Reply. [')).toBe('Reply.')
  })
  it('trims trailing TOOL_CALL and RENDER_CARD fragments', () => {
    expect(client.trimPartialTag('Go. [TOOL_CALL: {"act')).toBe('Go.')
    expect(client.trimPartialTag('See. [RENDER_C')).toBe('See.')
  })
  it('leaves closed tags for parseTags, and non-tag brackets alone', () => {
    expect(client.trimPartialTag('Done [AUDIO: "x"] tail')).toBe('Done [AUDIO: "x"] tail')
    expect(client.trimPartialTag('See [GraphRAG](https://x) docs')).toBe('See [GraphRAG](https://x) docs')
    expect(client.trimPartialTag('array[0] indexing')).toBe('array[0] indexing')
  })
  it('handles empty/null and bracket-free text', () => {
    expect(client.trimPartialTag('')).toBe('')
    expect(client.trimPartialTag(null)).toBe('')
    expect(client.trimPartialTag('no brackets here')).toBe('no brackets here')
  })
})
