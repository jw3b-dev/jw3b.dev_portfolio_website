import { describe, it, expect } from 'vitest'
import {
  STT_ENGINE,
  pickSttEngine,
  isEndOfSpeech,
  ENDPOINT_SILENCE_MS,
  VOICE_STATE,
  initialVoiceState,
  voiceSessionReducer,
} from '../voiceSession.js'

describe('pickSttEngine — free, Brave-first degrade chain', () => {
  it('prefers on-device Whisper-WebGPU when WebGPU + WASM are present', () => {
    expect(pickSttEngine({ webgpu: true, wasm: true, webSpeech: true })).toBe(STT_ENGINE.WHISPER_WEBGPU)
  })
  it('falls to Whisper-WASM when there is no WebGPU', () => {
    expect(pickSttEngine({ webgpu: false, wasm: true })).toBe(STT_ENGINE.WHISPER_WASM)
  })
  it('uses Web Speech only when on-device is unavailable but the browser supports it', () => {
    expect(pickSttEngine({ wasm: false, webSpeech: true })).toBe(STT_ENGINE.WEB_SPEECH)
  })
  it('falls to the Workers-AI batch floor when nothing else is available (incl. no args)', () => {
    expect(pickSttEngine({})).toBe(STT_ENGINE.WORKER_BATCH)
    expect(pickSttEngine()).toBe(STT_ENGINE.WORKER_BATCH)
  })
})

describe('isEndOfSpeech', () => {
  it('endpoints once the silence gap meets the threshold', () => {
    expect(isEndOfSpeech(ENDPOINT_SILENCE_MS)).toBe(true)
    expect(isEndOfSpeech(ENDPOINT_SILENCE_MS - 1)).toBe(false)
  })
  it('honors a custom threshold and rejects non-numbers', () => {
    expect(isEndOfSpeech(500, 400)).toBe(true)
    expect(isEndOfSpeech('nope')).toBe(false)
  })
})

describe('voiceSessionReducer — the hands-free call loop', () => {
  const at = (state, extra = {}) => ({ ...initialVoiceState(), state, ...extra })

  it('starts idle', () => {
    expect(initialVoiceState()).toMatchObject({ state: VOICE_STATE.IDLE, transcript: '', reply: '' })
  })

  it('START → LOADING (carrying the chosen engine)', () => {
    const s = voiceSessionReducer(initialVoiceState(), { type: 'START', engine: STT_ENGINE.WHISPER_WEBGPU })
    expect(s).toMatchObject({ state: VOICE_STATE.LOADING, engine: STT_ENGINE.WHISPER_WEBGPU })
  })

  it('MODEL_READY → LISTENING (only from LOADING)', () => {
    expect(voiceSessionReducer(at(VOICE_STATE.LOADING), { type: 'MODEL_READY' }).state).toBe(VOICE_STATE.LISTENING)
    expect(voiceSessionReducer(at(VOICE_STATE.IDLE), { type: 'MODEL_READY' }).state).toBe(VOICE_STATE.IDLE) // guard
  })

  it('PARTIAL updates the interim transcript only while LISTENING', () => {
    expect(voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'PARTIAL', text: 'hel' }).transcript).toBe('hel')
    expect(voiceSessionReducer(at(VOICE_STATE.THINKING), { type: 'PARTIAL', text: 'x' }).state).toBe(VOICE_STATE.THINKING)
  })

  it('SPEECH_FINAL → THINKING with the transcript; ignores an empty endpoint', () => {
    const s = voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'SPEECH_FINAL', text: '  what does John do?  ' })
    expect(s).toMatchObject({ state: VOICE_STATE.THINKING, transcript: 'what does John do?', reply: '' })
    const empty = voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'SPEECH_FINAL', text: '   ' })
    expect(empty.state).toBe(VOICE_STATE.LISTENING) // silence → keep listening
  })

  it('REPLY_DELTA accumulates; REPLY_DONE → SPEAKING (only while THINKING)', () => {
    let s = at(VOICE_STATE.THINKING, { reply: '' })
    s = voiceSessionReducer(s, { type: 'REPLY_DELTA', text: 'Hi ' })
    s = voiceSessionReducer(s, { type: 'REPLY_DELTA', text: 'there' })
    expect(s.reply).toBe('Hi there')
    expect(voiceSessionReducer(s, { type: 'REPLY_DONE' }).state).toBe(VOICE_STATE.SPEAKING)
    expect(voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'REPLY_DONE' }).state).toBe(VOICE_STATE.LISTENING)
  })

  it('TTS_DONE loops SPEAKING → LISTENING (cleared)', () => {
    const s = voiceSessionReducer(at(VOICE_STATE.SPEAKING, { transcript: 'x', reply: 'y' }), { type: 'TTS_DONE' })
    expect(s).toMatchObject({ state: VOICE_STATE.LISTENING, transcript: '', reply: '' })
  })

  it('BARGE_IN interrupts THINKING or SPEAKING back to LISTENING; no-op otherwise', () => {
    expect(voiceSessionReducer(at(VOICE_STATE.SPEAKING), { type: 'BARGE_IN' }).state).toBe(VOICE_STATE.LISTENING)
    expect(voiceSessionReducer(at(VOICE_STATE.THINKING), { type: 'BARGE_IN' }).state).toBe(VOICE_STATE.LISTENING)
    expect(voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'BARGE_IN' }).state).toBe(VOICE_STATE.LISTENING)
  })

  it('ERROR → ERROR with a message (default when none given); STOP → idle; unknown/null → unchanged', () => {
    expect(voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'ERROR', error: 'no mic' })).toMatchObject({
      state: VOICE_STATE.ERROR,
      error: 'no mic',
    })
    expect(voiceSessionReducer(at(VOICE_STATE.LISTENING), { type: 'ERROR' }).error).toBe('voice unavailable')
    expect(voiceSessionReducer(at(VOICE_STATE.SPEAKING), { type: 'STOP' })).toMatchObject({ state: VOICE_STATE.IDLE })
    const cur = at(VOICE_STATE.LISTENING)
    expect(voiceSessionReducer(cur, { type: 'NOPE' })).toBe(cur)
    expect(voiceSessionReducer(cur, null)).toBe(cur)
  })
})
