import { describe, it, expect } from 'vitest'
import { handleStt, handleTts, ttsTextFrom, STT_MODEL, TTS_MODEL } from '../../../workers/portfolio-agent/src/routes/voice.js'

/*
 * Voice routes (ported from v1): Whisper STT + Aura TTS. The load-bearing property is FAIL-SAFE —
 * a missing AI binding or an upstream error must degrade (empty transcript / no audio), never a 5xx
 * that crashes the widget. Live Workers-AI calls aren't exercised here (I/O); the guards are.
 */
describe('ttsTextFrom — clamp/validate TTS input', () => {
  it('takes a string, trims, and caps length', () => {
    expect(ttsTextFrom({ text: '  hi  ' })).toBe('hi')
    expect(ttsTextFrom({ text: 'x'.repeat(5000) }).length).toBe(1200)
    expect(ttsTextFrom({})).toBe('')
    expect(ttsTextFrom(null)).toBe('')
  })
})

describe('handleStt — fail-safe', () => {
  it('models are the ported Workers-AI ones', () => {
    expect(STT_MODEL).toBe('@cf/openai/whisper')
    expect(TTS_MODEL).toBe('@cf/deepgram/aura-1')
  })

  it('no AI binding → { text: "" } (never throws)', async () => {
    const res = await handleStt({ arrayBuffer: async () => new ArrayBuffer(0) }, {})
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: '' })
  })

  it('AI error → { text: "" } (fail-safe, not a 5xx)', async () => {
    const env = { AI: { run: async () => { throw new Error('down') } } }
    const res = await handleStt({ arrayBuffer: async () => new ArrayBuffer(2) }, env)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ text: '' })
  })

  it('AI success → the transcript text', async () => {
    const env = { AI: { run: async () => ({ text: 'hello world' }) } }
    const res = await handleStt({ arrayBuffer: async () => new ArrayBuffer(2) }, env)
    expect(await res.json()).toEqual({ text: 'hello world' })
  })
})

describe('handleTts — validation + fail-safe', () => {
  it('missing text → 400', async () => {
    const res = await handleTts({ json: async () => ({}) }, { AI: {} })
    expect(res.status).toBe(400)
  })

  it('no AI binding → 204 (widget stays silent, no crash)', async () => {
    const res = await handleTts({ json: async () => ({ text: 'hi' }) }, {})
    expect(res.status).toBe(204)
  })

  it('AI error → 204 (fail-safe)', async () => {
    const env = { AI: { run: async () => { throw new Error('down') } } }
    const res = await handleTts({ json: async () => ({ text: 'hi' }) }, env)
    expect(res.status).toBe(204)
  })

  it('AI success → audio/mpeg (Aura returns MP3)', async () => {
    const env = { AI: { run: async () => new Uint8Array([1, 2, 3]) } }
    const res = await handleTts({ json: async () => ({ text: 'hi' }) }, env)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
  })
})
