import { describe, it, expect } from 'vitest'
import {
  WHISPER_SAMPLE_RATE,
  VAD_DEFAULTS,
  computeRms,
  initialVad,
  updateVad,
  isNoiseTurn,
  isMaxedTurn,
  mergeChunks,
  resampleLinear,
  speakableReply,
} from '../micTurn.js'

const FRAME = 85 // ~4096 samples at 48kHz ≈ 85ms

describe('computeRms', () => {
  it('returns 0 for empty/missing input', () => {
    expect(computeRms(null)).toBe(0)
    expect(computeRms(new Float32Array(0))).toBe(0)
  })
  it('computes RMS of a constant frame exactly', () => {
    expect(computeRms(new Float32Array([0.5, 0.5, 0.5, 0.5]))).toBeCloseTo(0.5, 6)
  })
  it('is amplitude-sensitive (louder frame → higher RMS)', () => {
    const quiet = computeRms(new Float32Array([0.01, -0.01, 0.01, -0.01]))
    const loud = computeRms(new Float32Array([0.5, -0.5, 0.5, -0.5]))
    expect(loud).toBeGreaterThan(quiet)
  })
})

describe('updateVad (hysteresis)', () => {
  it('stays zeroed on idle noise-floor frames', () => {
    const v = updateVad(initialVad(), 0.001, FRAME)
    expect(v).toEqual({ speaking: false, speechMs: 0, silenceMs: 0 })
  })
  it('starts a turn at startRms and accumulates speechMs', () => {
    let v = updateVad(initialVad(), VAD_DEFAULTS.startRms, FRAME)
    expect(v.speaking).toBe(true)
    v = updateVad(v, 0.5, FRAME)
    expect(v.speechMs).toBe(2 * FRAME)
    expect(v.silenceMs).toBe(0)
  })
  it('keeps a started turn alive at keepRms (below startRms)', () => {
    let v = updateVad(initialVad(), 0.5, FRAME)
    v = updateVad(v, VAD_DEFAULTS.keepRms, FRAME) // would NOT start a turn, but keeps one
    expect(v.speaking).toBe(true)
    expect(v.speechMs).toBe(2 * FRAME)
  })
  it('does not start a turn at keepRms from silence', () => {
    const v = updateVad(initialVad(), VAD_DEFAULTS.keepRms, FRAME)
    expect(v.speaking).toBe(false)
  })
  it('accumulates in-turn silence (speechMs holds) and resets it on resumed speech', () => {
    let v = updateVad(initialVad(), 0.5, FRAME)
    v = updateVad(v, 0.001, FRAME)
    v = updateVad(v, 0.001, FRAME)
    expect(v).toEqual({ speaking: true, speechMs: FRAME, silenceMs: 2 * FRAME })
    v = updateVad(v, 0.5, FRAME) // resumed → silence gap forgiven
    expect(v.silenceMs).toBe(0)
    expect(v.speechMs).toBe(2 * FRAME)
  })
  it('honors a custom config threshold', () => {
    const cfg = { ...VAD_DEFAULTS, startRms: 0.4 }
    expect(updateVad(initialVad(), 0.3, FRAME, cfg).speaking).toBe(false)
    expect(updateVad(initialVad(), 0.4, FRAME, cfg).speaking).toBe(true)
  })
})

describe('turn classification', () => {
  it('isNoiseTurn: true for missing/not-speaking/too-short turns', () => {
    expect(isNoiseTurn(null)).toBe(true)
    expect(isNoiseTurn(initialVad())).toBe(true)
    expect(isNoiseTurn({ speaking: true, speechMs: VAD_DEFAULTS.minSpeechMs - 1, silenceMs: 0 })).toBe(true)
  })
  it('isNoiseTurn: false at/after minSpeechMs', () => {
    expect(isNoiseTurn({ speaking: true, speechMs: VAD_DEFAULTS.minSpeechMs, silenceMs: 0 })).toBe(false)
  })
  it('isMaxedTurn: only a speaking turn at/over maxTurnMs', () => {
    expect(isMaxedTurn(null)).toBe(false)
    expect(isMaxedTurn({ speaking: false, speechMs: VAD_DEFAULTS.maxTurnMs, silenceMs: 0 })).toBe(false)
    expect(isMaxedTurn({ speaking: true, speechMs: VAD_DEFAULTS.maxTurnMs - 1, silenceMs: 0 })).toBe(false)
    expect(isMaxedTurn({ speaking: true, speechMs: VAD_DEFAULTS.maxTurnMs, silenceMs: 0 })).toBe(true)
  })
})

describe('mergeChunks', () => {
  it('concatenates frames in order', () => {
    const out = mergeChunks([new Float32Array([1, 2]), new Float32Array([3]), new Float32Array([4, 5])])
    expect(Array.from(out)).toEqual([1, 2, 3, 4, 5])
  })
  it('skips empty/missing frames and handles no input', () => {
    expect(Array.from(mergeChunks([new Float32Array(0), null, new Float32Array([7])]))).toEqual([7])
    expect(mergeChunks(undefined).length).toBe(0)
  })
})

describe('resampleLinear', () => {
  it('returns input untouched at same rate', () => {
    const input = new Float32Array([1, 2, 3])
    expect(resampleLinear(input, 16000, 16000)).toBe(input)
  })
  it('returns empty for missing input or rates', () => {
    expect(resampleLinear(null, 48000).length).toBe(0)
    expect(resampleLinear(new Float32Array([1]), 0, 16000).length).toBe(0)
    expect(resampleLinear(new Float32Array([1]), 48000, 0).length).toBe(0)
  })
  it('downsamples 48k→16k to one third the length', () => {
    const input = new Float32Array(4800).fill(0.25)
    const out = resampleLinear(input, 48000, WHISPER_SAMPLE_RATE)
    expect(out.length).toBe(1600)
    expect(out[0]).toBeCloseTo(0.25, 6)
    expect(out[out.length - 1]).toBeCloseTo(0.25, 6)
  })
  it('interpolates between neighboring samples', () => {
    // 4 samples at 32k → 2 samples at 16k: out[1] sits at input position 2.0 → exactly input[2]
    const out = resampleLinear(new Float32Array([0, 1, 2, 3]), 32000, 16000)
    expect(out.length).toBe(2)
    expect(out[0]).toBeCloseTo(0, 6)
    expect(out[1]).toBeCloseTo(2, 6)
  })
})

describe('speakableReply', () => {
  it('prefers the [AUDIO] spoken summary', () => {
    expect(speakableReply('Short spoken take.', 'Long display text')).toBe('Short spoken take.')
  })
  it('falls back to the stripped text when no audio tag', () => {
    expect(speakableReply('', 'Display text')).toBe('Display text')
    expect(speakableReply(null, ' padded ')).toBe('padded')
  })
  it('returns empty when both are empty', () => {
    expect(speakableReply('', '')).toBe('')
  })
})
