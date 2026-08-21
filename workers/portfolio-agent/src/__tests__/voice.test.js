/*
 * Voice routes — the MIME regression that made the concierge silent.
 *
 * `@cf/deepgram/aura-1` returns MP3 (MPEG ADTS). The route originally labelled it audio/wav,
 * so every browser rejected it with NotSupportedError and voice output simply did nothing.
 * Two rounds of debugging went into a one-word header. Nothing tested it, because the Worker
 * had no tests. These lock the content type and every fail-safe path.
 */
import { describe, it, expect } from 'vitest'
import { ttsTextFrom, handleTts, handleStt } from '../routes/voice.js'

const post = (body) => new Request('https://w.dev/text-to-speech', { method: 'POST', body: JSON.stringify(body) })
const aiReturning = (audio) => ({ AI: { run: async () => audio } })

describe('ttsTextFrom', () => {
  it('takes the text field and trims it', () => {
    expect(ttsTextFrom({ text: '  hello  ' })).toBe('hello')
  })
  it('returns empty for missing, blank or non-string input', () => {
    for (const bad of [{}, { text: '' }, { text: '   ' }, { text: 42 }, null, undefined]) {
      expect(ttsTextFrom(bad)).toBe('')
    }
  })
})

describe('handleTts content type — the silent-audio regression', () => {
  it('labels Aura output audio/mpeg, NEVER audio/wav', async () => {
    const res = await handleTts(post({ text: 'hi' }), aiReturning(new Uint8Array([0xff, 0xf3, 0x44]).buffer))
    expect(res.headers.get('Content-Type')).toBe('audio/mpeg')
    expect(res.headers.get('Content-Type')).not.toContain('wav')
  })

  it('carries CORS headers through on the audio response', async () => {
    const res = await handleTts(post({ text: 'hi' }), aiReturning(new ArrayBuffer(8)), { 'Access-Control-Allow-Origin': 'https://jw3b.dev' })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://jw3b.dev')
  })
})

describe('handleTts fail-safe paths — silence, never a crash', () => {
  it('rejects empty text with a JSON error rather than calling the model', async () => {
    let called = false
    const res = await handleTts(post({ text: '' }), { AI: { run: async () => { called = true } } })
    expect(called).toBe(false)
    expect(res.headers.get('Content-Type')).toContain('application/json')
  })

  it('returns 204 when no AI binding exists — the widget stays silent, not broken', async () => {
    const res = await handleTts(post({ text: 'hi' }), {})
    expect(res.status).toBe(204)
  })

  it('returns 204 when the model throws, and never propagates the error', async () => {
    const res = await handleTts(post({ text: 'hi' }), { AI: { run: async () => { throw new Error('model down') } } })
    expect(res.status).toBe(204)
  })

  it('survives a malformed JSON body', async () => {
    const bad = new Request('https://w.dev/text-to-speech', { method: 'POST', body: '{not json' })
    const res = await handleTts(bad, aiReturning(new ArrayBuffer(4)))
    expect([200, 204, 400]).toContain(res.status)
  })
})

describe('handleStt — transcription fail-safe', () => {
  const audioReq = () => new Request('https://w.dev/speech-to-text', { method: 'POST', body: new Uint8Array([1, 2, 3]) })

  it('returns the transcript as JSON', async () => {
    const res = await handleStt(audioReq(), { AI: { run: async () => ({ text: 'hello world' }) } })
    expect(await res.json()).toEqual({ text: 'hello world' })
  })

  it('returns an EMPTY transcript rather than an error when the model fails', async () => {
    const res = await handleStt(audioReq(), { AI: { run: async () => { throw new Error('whisper down') } } })
    expect(res.status).toBe(200)
    expect((await res.json()).text).toBe('')
  })

  it('returns an empty transcript when no AI binding exists', async () => {
    expect((await (await handleStt(audioReq(), {})).json()).text).toBe('')
  })
})
