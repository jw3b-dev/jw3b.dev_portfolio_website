/*
 * jw3b.dev v2 — useLiveVoice (P3 · hands-free real-time voice)  ·  full-stack-integrator
 * The effect side of the live-voice concierge, driving the pure FSM in ../lib/voiceSession.js.
 * $0/no key: STT runs ON-DEVICE (transformers.js Whisper via WebGPU→WASM, lazy-imported) so audio
 * never leaves the browser — and unlike the Web Speech API it works in Brave. Brain = the existing
 * Claude concierge; TTS = Aura. Everything fails safe and degrades to today's push-to-talk voice.
 *
 * NOTE: this first cut loads the model + wires the FSM/capabilities; the mic VAD loop + concierge
 * turn + barge-in land next (tracked in the ledger). The whole thing is gated behind `voiceLive`.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { voiceSessionReducer, initialVoiceState, pickSttEngine, STT_ENGINE } from '../lib/voiceSession.js'
import { loadTranscriber } from '../lib/loadTranscriber.js'

/** Detect the free STT capabilities available in this browser (SSR/jsdom-safe). */
export function detectVoiceCaps() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return {}
  return {
    webgpu: !!navigator.gpu,
    wasm: typeof WebAssembly !== 'undefined',
    webSpeech: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
  }
}

export function useLiveVoice() {
  const [state, dispatch] = useReducer(voiceSessionReducer, undefined, initialVoiceState)
  const transcriberRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const start = useCallback(async () => {
    const caps = detectVoiceCaps()
    const engine = pickSttEngine(caps)
    dispatch({ type: 'START', engine })
    try {
      // On-device engines load a model first; server/web-speech engines are ready immediately.
      if (engine === STT_ENGINE.WHISPER_WEBGPU || engine === STT_ENGINE.WHISPER_WASM) {
        transcriberRef.current = await loadTranscriber({ device: caps.webgpu ? 'webgpu' : 'wasm' })
        if (!mountedRef.current) return
      }
      dispatch({ type: 'MODEL_READY' })
      // TODO(next commit): open mic + AnalyserNode VAD → transcribe turn → concierge SSE → Aura TTS
      //                    → loop, with barge-in. Tracked in mas/ROLE_LEDGER.md.
    } catch (e) {
      if (mountedRef.current) dispatch({ type: 'ERROR', error: e?.message || 'voice model failed to load' })
    }
  }, [])

  const stop = useCallback(() => dispatch({ type: 'STOP' }), [])

  return { ...state, caps: detectVoiceCaps(), start, stop }
}
