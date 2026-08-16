import { describe, it, expect, vi } from 'vitest'
import { handleTts, ttsR2Key } from '../../../workers/portfolio-agent/src/routes/voice.js'

/*
 * P3-05 · FR-016 — the R2 recorded-audio fallback: when live Aura TTS is unavailable, /text-to-speech
 * serves a pre-recorded clip for the exact spoken line if the recorded-run seeding stored one in R2
 * (keyed by the text hash); otherwise it stays silent (204). Never a passed-through 5xx.
 */
const req = (text) => ({ json: async () => ({ text }) })

describe('ttsR2Key', () => {
  it('is a deterministic voice/<sha256>.wav key', async () => {
    const k1 = await ttsR2Key('hello')
    expect(k1).toMatch(/^voice\/[0-9a-f]{64}\.mp3$/)
    expect(await ttsR2Key('hello')).toBe(k1)
    expect(await ttsR2Key('other')).not.toBe(k1)
  })
})

describe('handleTts — R2 recorded-audio fallback (FR-016)', () => {
  it('serves the pre-recorded clip from R2 when there is no AI binding', async () => {
    const R2 = { get: vi.fn(async () => ({ body: 'AUDIOBYTES' })) }
    const res = await handleTts(req('hi there'), { R2 })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(res.headers.get('x-voice-tier')).toBe('recorded')
    expect(R2.get).toHaveBeenCalledWith(await ttsR2Key('hi there'))
  })

  it('serves the R2 clip when live Aura throws', async () => {
    const AI = { run: vi.fn(async () => { throw new Error('aura down') }) }
    const R2 = { get: vi.fn(async () => ({ body: 'BYTES' })) }
    const res = await handleTts(req('spoken line'), { AI, R2 })
    expect(res.status).toBe(200)
    expect(res.headers.get('x-voice-tier')).toBe('recorded')
  })

  it('falls through to a silent 204 when R2 has no clip', async () => {
    const res = await handleTts(req('nope'), { R2: { get: vi.fn(async () => null) } })
    expect(res.status).toBe(204)
  })

  it('204 when there is no R2 binding at all', async () => {
    const res = await handleTts(req('nothing'), {})
    expect(res.status).toBe(204)
  })

  it('still validates: empty text is 400 before any fallback', async () => {
    const res = await handleTts(req(''), { R2: { get: vi.fn() } })
    expect(res.status).toBe(400)
  })
})
