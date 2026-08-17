/*
 * jw3b.dev v2 — live-voice session (P3 · hands-free real-time voice)  ·  full-stack-integrator
 *
 * PURE state machine + STT-engine selection for the real-time voice concierge. No mic, no model,
 * no I/O here — useLiveVoice.js drives the effects (on-device Whisper + Claude + Aura) and dispatches
 * these events, so the whole call loop AND the degrade chain are exhaustively unit-tested.
 *
 * $0 / no API key: STT runs ON-DEVICE (transformers.js Whisper via WebGPU→WASM), so audio never
 * leaves the browser and there is no per-minute cost — and unlike the Web Speech API it works in
 * Brave. Everything degrades to today's push-to-talk voice when unavailable.
 */

// STT engines, best → most-compatible. `pickSttEngine` chooses the first the browser supports.
export const STT_ENGINE = Object.freeze({
  WHISPER_WEBGPU: 'whisper-webgpu', // on-device Whisper, GPU-accelerated — best, real-time, private
  WHISPER_WASM: 'whisper-wasm', // on-device Whisper, CPU — slower but universal + private
  WEB_SPEECH: 'web-speech', // browser SpeechRecognition — instant but Chrome/Edge only (Brave blocks it)
  WORKER_BATCH: 'worker-batch', // Workers AI Whisper (server) — the guaranteed floor (~1–2s)
})

/**
 * Pick the STT engine from detected browser capabilities (pure). Prefers on-device (free + private +
 * works in Brave); uses Web Speech only where on-device is unavailable AND the browser supports it;
 * else the server batch floor.
 */
export function pickSttEngine(caps = {}) {
  if (caps.webgpu && caps.wasm) return STT_ENGINE.WHISPER_WEBGPU
  if (caps.wasm) return STT_ENGINE.WHISPER_WASM
  if (caps.webSpeech) return STT_ENGINE.WEB_SPEECH
  return STT_ENGINE.WORKER_BATCH
}

// Endpointing: how long a silence gap ends a spoken turn. Pure predicate.
export const ENDPOINT_SILENCE_MS = 900
export function isEndOfSpeech(silenceMs, threshold = ENDPOINT_SILENCE_MS) {
  return typeof silenceMs === 'number' && silenceMs >= threshold
}

export const VOICE_STATE = Object.freeze({
  IDLE: 'idle',
  LOADING: 'loading', // fetching/warming the on-device model
  LISTENING: 'listening', // mic open, waiting for speech
  TRANSCRIBING: 'transcribing', // a turn was captured; on-device ASR running (visible feedback —
  //                               on the WASM floor this can take seconds, and a silent
  //                               "Listening" during it reads as "not working")
  THINKING: 'thinking', // transcript sent to the concierge; awaiting/streaming the reply
  SPEAKING: 'speaking', // TTS playing the reply
  ERROR: 'error',
})

export function initialVoiceState() {
  return { state: VOICE_STATE.IDLE, engine: null, transcript: '', reply: '', error: '' }
}

/** Pure FSM for one hands-free call. Unknown/empty events return the state unchanged. */
export function voiceSessionReducer(s, e) {
  switch (e && e.type) {
    case 'START':
      // Begin by loading the model (LOADING). Engines needing no load (web-speech/batch) let the
      // hook dispatch MODEL_READY immediately.
      return { ...initialVoiceState(), state: VOICE_STATE.LOADING, engine: e.engine || null }
    case 'MODEL_READY':
      if (s.state !== VOICE_STATE.LOADING) return s
      return { ...s, state: VOICE_STATE.LISTENING, transcript: '' }
    case 'PARTIAL': // interim transcript while the user is still speaking
      if (s.state !== VOICE_STATE.LISTENING) return s
      return { ...s, transcript: String(e.text || '') }
    case 'TURN_CAPTURED': // endpoint hit — a turn is now being transcribed on-device
      if (s.state !== VOICE_STATE.LISTENING) return s
      return { ...s, state: VOICE_STATE.TRANSCRIBING }
    case 'SPEECH_FINAL': {
      if (s.state !== VOICE_STATE.LISTENING && s.state !== VOICE_STATE.TRANSCRIBING) return s
      const text = String(e.text || '').trim()
      // Nothing usable (silence endpoint / ASR heard nothing) → back to listening.
      if (!text) return { ...s, state: VOICE_STATE.LISTENING, transcript: '' }
      return { ...s, state: VOICE_STATE.THINKING, transcript: text, reply: '' }
    }
    case 'REPLY_DELTA':
      if (s.state !== VOICE_STATE.THINKING) return s
      return { ...s, reply: s.reply + String(e.text || '') }
    case 'REPLY_DONE':
      if (s.state !== VOICE_STATE.THINKING) return s
      return { ...s, state: VOICE_STATE.SPEAKING }
    case 'TTS_DONE':
      if (s.state !== VOICE_STATE.SPEAKING) return s
      return { ...s, state: VOICE_STATE.LISTENING, transcript: '', reply: '' } // loop back to listening
    case 'BARGE_IN':
      // user spoke while we were thinking/speaking → cancel and listen
      if (s.state !== VOICE_STATE.SPEAKING && s.state !== VOICE_STATE.THINKING) return s
      return { ...s, state: VOICE_STATE.LISTENING, transcript: '', reply: '' }
    case 'ERROR':
      return { ...s, state: VOICE_STATE.ERROR, error: String((e && e.error) || 'voice unavailable') }
    case 'STOP':
      return initialVoiceState()
    default:
      return s
  }
}
