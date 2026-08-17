/*
 * jw3b.dev v2 — useLiveVoice (P3 · hands-free real-time voice)  ·  full-stack-integrator
 * The effect side of the live-voice concierge, driving the pure FSM in ../lib/voiceSession.js
 * with the pure audio math in ../lib/micTurn.js. $0/no key: STT runs ON-DEVICE (transformers.js
 * Whisper via WebGPU→WASM, lazy-imported) so audio never leaves the browser — and unlike the Web
 * Speech API it works in Brave. Brain = the existing Claude concierge (same SSE tag protocol);
 * voice = Aura TTS decoded via WebAudio. Everything is gated behind `voiceLive` and fails safe:
 * any hard failure lands in ERROR with the mic closed and the text chat untouched.
 *
 * Loop: mic frames → VAD (hysteresis + 900ms endpoint) → resample 16k → Whisper on-device →
 * SPEECH_FINAL → concierge SSE (REPLY_DELTA…REPLY_DONE) → Aura TTS (SPEAKING) → TTS_DONE →
 * back to LISTENING. Speaking over the assistant (louder bar, echo guard) = BARGE_IN: the
 * in-flight fetch aborts, playback stops, and the interrupting speech starts the next turn.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { voiceSessionReducer, initialVoiceState, pickSttEngine, isEndOfSpeech, STT_ENGINE, VOICE_STATE } from '../lib/voiceSession.js'
import { VAD_DEFAULTS, computeRms, initialVad, updateVad, isNoiseTurn, isMaxedTurn, mergeChunks, resampleLinear, speakableReply } from '../lib/micTurn.js'
import { loadTranscriber } from '../lib/loadTranscriber.js'
import { buildOutgoing, shouldDegrade, displayText } from '../lib/conciergeClient.js'
import { parseSseLine, parseTags } from '../lib/tagProtocol.js'
import { AGENT_CHAT_URL, AGENT_TTS_URL } from '../config/worker.js'

// Abuse/cost guard: a hands-free session auto-ends after this long (each turn spends Worker
// AI + Anthropic tokens). The visitor can just tap Live again.
export const MAX_SESSION_MS = 4 * 60 * 1000

// Barge-in needs this much accumulated loud speech before it interrupts the assistant —
// a cough or a speaker transient shouldn't cut the reply off.
const BARGE_IN_MIN_MS = 160

// Frames of pre-roll kept while idle so the first syllable isn't clipped off the turn.
const PREROLL_FRAMES = 3

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

  // Mirror the FSM state for the audio callback (fires outside React's render cycle).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Session plumbing. `gen` is a generation counter: every start()/stop() bumps it, and every
  // async continuation checks it — a stale turn from a torn-down session must do nothing.
  const genRef = useRef(0)
  const ctxRef = useRef(null) // one AudioContext: mic capture + TTS playback
  const streamRef = useRef(null)
  const nodesRef = useRef(null) // {source, proc}
  const transcriberRef = useRef(null)
  const abortRef = useRef(null) // in-flight concierge fetch
  const ttsSourceRef = useRef(null) // playing AudioBufferSourceNode
  const timerRef = useRef(null) // session time-cap
  const turnsRef = useRef([]) // conversation history for the concierge
  const vadRef = useRef(initialVad())
  const chunksRef = useRef([]) // captured Float32 frames of the current turn
  const prerollRef = useRef([]) // rolling pre-onset frames
  const busyRef = useRef(false) // transcription in flight — pause capture
  const bargeRef = useRef(false) // the current turn was interrupted — drop its reply/TTS

  /** Tear down all live resources. Does NOT dispatch — callers pick the closing event. */
  const teardown = useCallback(() => {
    genRef.current++
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    try {
      abortRef.current?.abort()
    } catch {
      /* not in flight */
    }
    abortRef.current = null
    try {
      ttsSourceRef.current?.stop()
    } catch {
      /* already stopped */
    }
    ttsSourceRef.current = null
    try {
      nodesRef.current?.proc?.disconnect()
      nodesRef.current?.source?.disconnect()
    } catch {
      /* already disconnected */
    }
    nodesRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    ctxRef.current?.close().catch(() => {})
    ctxRef.current = null
    vadRef.current = initialVad()
    chunksRef.current = []
    prerollRef.current = []
    busyRef.current = false
    turnsRef.current = []
  }, [])

  /** Hard-fail the session: close the mic, surface the error, leave text chat untouched. */
  const fail = useCallback(
    (message) => {
      teardown()
      dispatch({ type: 'ERROR', error: message })
    },
    [teardown],
  )

  /** Speak the reply via Aura TTS (WebAudio decode — Aura returns a raw MP3 stream). */
  const speakReply = useCallback(async (gen, text) => {
    const ctx = ctxRef.current
    const t = String(text || '').trim()
    if (!ctx || !t) return // nothing to say → caller falls through to TTS_DONE
    try {
      const res = await fetch(AGENT_TTS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      })
      if (gen !== genRef.current) return
      if (!res.ok || res.status === 204) return // TTS degraded → reply stays visible as text
      const bytes = await res.arrayBuffer()
      if (gen !== genRef.current || !bytes.byteLength) return
      const buf = await ctx.decodeAudioData(bytes)
      if (gen !== genRef.current) return
      await new Promise((resolve) => {
        const src = ctx.createBufferSource()
        src.buffer = buf
        src.connect(ctx.destination)
        src.onended = resolve // fires on natural end AND on barge-in stop()
        ttsSourceRef.current = src
        src.start(0)
      })
      ttsSourceRef.current = null
    } catch {
      /* fail-safe: silent reply, text remains */
    }
  }, [])

  /** One full turn: transcript → concierge SSE → TTS → back to LISTENING. */
  const runTurn = useCallback(
    async (gen, transcript) => {
      bargeRef.current = false
      dispatch({ type: 'SPEECH_FINAL', text: transcript })
      const controller = new AbortController()
      abortRef.current = controller
      let acc = ''
      try {
        const res = await fetch(AGENT_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: buildOutgoing(turnsRef.current, transcript) }),
          signal: controller.signal,
        })
        if (gen !== genRef.current) return
        if (shouldDegrade(res)) return fail('The live agent is unreachable — the text chat still works.')
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let stop = false
        while (!stop) {
          const { done, value } = await reader.read()
          if (gen !== genRef.current) return
          if (done) break
          buf += dec.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop()
          for (const line of lines) {
            const p = parseSseLine(line)
            if (!p) continue
            if (p.done) {
              stop = true
              break
            }
            if (p.response) {
              acc += p.response
              dispatch({ type: 'REPLY_DELTA', text: p.response })
            }
          }
        }
      } catch {
        // Stopped, or barged-in (fetch aborted) — both already handled; only a REAL drop fails.
        if (gen !== genRef.current || bargeRef.current || controller.signal.aborted) return
        return fail('The live agent dropped — the text chat still works.')
      }
      if (gen !== genRef.current || bargeRef.current) return // interrupted → next turn owns the mic
      if (!acc.trim()) return fail('The live agent is unreachable — the text chat still works.')
      abortRef.current = null

      const parsed = parseTags(acc)
      turnsRef.current = [
        ...turnsRef.current,
        { role: 'user', content: transcript },
        { role: 'assistant', content: parsed.text || acc },
      ]
      dispatch({ type: 'REPLY_DONE' })
      await speakReply(gen, speakableReply(parsed.audio, parsed.text))
      if (gen !== genRef.current || bargeRef.current) return // barge-in mid-playback → already LISTENING
      dispatch({ type: 'TTS_DONE' })
    },
    [fail, speakReply],
  )

  /** Handle one captured mic frame — the heart of the loop. Pure math; effects only at edges. */
  const onFrame = useCallback(
    (gen, samples, frameMs) => {
      if (gen !== genRef.current || busyRef.current) return
      const s = stateRef.current.state
      const listening = s === VOICE_STATE.LISTENING
      const interruptible = s === VOICE_STATE.THINKING || s === VOICE_STATE.SPEAKING
      if (!listening && !interruptible) return

      const rms = computeRms(samples)
      // While the assistant is talking, only a LOUDER onset counts (echo guard).
      const cfg = interruptible ? { ...VAD_DEFAULTS, startRms: VAD_DEFAULTS.bargeInRms } : VAD_DEFAULTS
      const prev = vadRef.current
      const vad = updateVad(prev, rms, frameMs, cfg)
      vadRef.current = vad

      if (!vad.speaking) {
        // Idle: keep a short pre-roll so the turn's first syllable isn't clipped.
        prerollRef.current.push(samples)
        if (prerollRef.current.length > PREROLL_FRAMES) prerollRef.current.shift()
        return
      }

      // Speech is accumulating — capture the frame (onset pulls in the pre-roll).
      if (!prev.speaking) {
        chunksRef.current = [...prerollRef.current]
        prerollRef.current = []
      }
      chunksRef.current.push(samples)

      if (interruptible) {
        if (vad.speechMs >= BARGE_IN_MIN_MS) {
          // Real interruption: kill the in-flight reply/playback; captured frames become
          // the start of the next turn and the FSM goes back to LISTENING.
          bargeRef.current = true
          try {
            abortRef.current?.abort()
          } catch {
            /* not in flight */
          }
          abortRef.current = null
          try {
            ttsSourceRef.current?.stop()
          } catch {
            /* already stopped */
          }
          ttsSourceRef.current = null
          dispatch({ type: 'BARGE_IN' })
        }
        return
      }

      // LISTENING: endpoint on 900ms of in-turn silence, or force-endpoint a maxed turn.
      if (!isEndOfSpeech(vad.silenceMs) && !isMaxedTurn(vad)) return
      const turnVad = vad
      vadRef.current = initialVad()
      const captured = chunksRef.current
      chunksRef.current = []
      if (isNoiseTurn(turnVad)) return // breath/keyboard — drop silently, keep listening

      busyRef.current = true
      ;(async () => {
        try {
          const ctx = ctxRef.current
          const audio = resampleLinear(mergeChunks(captured), ctx ? ctx.sampleRate : 48000)
          const out = await transcriberRef.current(audio)
          if (gen !== genRef.current) return
          const text = String(out && out.text ? out.text : '').trim()
          busyRef.current = false
          if (!text) return // Whisper heard nothing usable — keep listening
          await runTurn(gen, text)
        } catch {
          if (gen === genRef.current) fail('Transcription failed — the text chat still works.')
        } finally {
          busyRef.current = false
        }
      })()
    },
    [fail, runTurn],
  )

  const start = useCallback(async () => {
    if (stateRef.current.state !== VOICE_STATE.IDLE && stateRef.current.state !== VOICE_STATE.ERROR) return
    teardown() // fresh generation
    const gen = genRef.current
    const caps = detectVoiceCaps()

    // navigator.gpu existing does NOT guarantee a usable adapter (Linux/VM/driver gaps — and a
    // failed WebGPU pipeline load can't simply be retried on WASM: the library caches the
    // rejected session per model id, verified in-browser). So pre-flight the REAL adapter and
    // only pick the WebGPU engine when the hardware actually answers.
    let webgpuUsable = false
    if (caps.webgpu) {
      try {
        webgpuUsable = !!(await navigator.gpu.requestAdapter())
      } catch {
        webgpuUsable = false
      }
    }
    if (gen !== genRef.current) return
    const engine = pickSttEngine({ ...caps, webgpu: webgpuUsable })
    dispatch({ type: 'START', engine })

    // This cut ships the on-device engines only — without WASM there is no free real-time
    // path worth pretending at, so degrade honestly to the push-to-talk mic + text chat.
    if (engine !== STT_ENGINE.WHISPER_WEBGPU && engine !== STT_ENGINE.WHISPER_WASM) {
      return fail('Live voice needs a modern browser — the mic button + text chat still work.')
    }

    try {
      // 1) On-device Whisper (lazy ~tens-of-MB, cached by the browser after first load).
      transcriberRef.current = await loadTranscriber({
        device: engine === STT_ENGINE.WHISPER_WEBGPU ? 'webgpu' : 'wasm',
      })
      if (gen !== genRef.current) return

      // 2) Mic + AudioContext (resumed inside this user gesture — autoplay policy).
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      if (gen !== genRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream
      const AC = window.AudioContext || window.webkitAudioContext
      const ctx = new AC()
      ctxRef.current = ctx
      if (ctx.state === 'suspended') await ctx.resume().catch(() => {})

      // 3) Frame capture. ScriptProcessorNode is deprecated-but-universal and keeps the whole
      // loop on the main thread (no worklet module → no extra CSP surface); at 4096 samples
      // (~85ms frames at 48k) it is far below any perceptibility threshold for VAD use.
      const source = ctx.createMediaStreamSource(stream)
      const proc = ctx.createScriptProcessor(4096, 1, 1)
      nodesRef.current = { source, proc }
      proc.onaudioprocess = (e) => {
        const input = e.inputBuffer.getChannelData(0)
        onFrame(gen, new Float32Array(input), (input.length / ctx.sampleRate) * 1000)
      }
      source.connect(proc)
      proc.connect(ctx.destination) // required for the processor to run; output stays silent

      // 4) Session time-cap (cost guard) + go.
      timerRef.current = setTimeout(() => {
        teardown()
        dispatch({ type: 'STOP' })
      }, MAX_SESSION_MS)
      dispatch({ type: 'MODEL_READY' })
    } catch (e) {
      if (gen === genRef.current)
        fail(e?.name === 'NotAllowedError' ? 'Mic permission denied — the text chat still works.' : e?.message || 'Live voice failed to start.')
    }
  }, [teardown, fail, onFrame])

  const stop = useCallback(() => {
    teardown()
    dispatch({ type: 'STOP' })
  }, [teardown])

  // Unmount safety: release the mic/context if the widget goes away mid-call.
  useEffect(() => teardown, [teardown])

  return { ...state, displayReply: displayText(state.reply), caps: detectVoiceCaps(), start, stop }
}
