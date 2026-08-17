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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import { voiceSessionReducer, initialVoiceState, pickSttEngine, isEndOfSpeech, STT_ENGINE, VOICE_STATE } from '../lib/voiceSession.js'
import { VAD_DEFAULTS, calibrateVad, computeRms, encodeWavPcm16, initialVad, updateVad, isNoiseTurn, isMaxedTurn, mergeChunks, resampleLinear, speakableReply } from '../lib/micTurn.js'
import { loadTranscriber } from '../lib/loadTranscriber.js'
import { buildOutgoing, shouldDegrade, displayText } from '../lib/conciergeClient.js'
import { parseSseLine, parseTags, trimPartialTag } from '../lib/tagProtocol.js'
import { AGENT_CHAT_URL, AGENT_STT_URL, AGENT_TTS_URL } from '../config/worker.js'

// Abuse/cost guard: a hands-free session auto-ends after this long (each turn spends Worker
// AI + Anthropic tokens). The visitor can just tap Live again.
export const MAX_SESSION_MS = 4 * 60 * 1000

// Barge-in needs this much accumulated loud speech before it interrupts the assistant —
// a cough or a speaker transient shouldn't cut the reply off.
const BARGE_IN_MIN_MS = 160

// Frames of pre-roll kept while idle so the first syllable isn't clipped off the turn.
const PREROLL_FRAMES = 3

// VAD calibration window: this many idle frames (~0.7 s) are measured for the room's noise
// floor before the gate goes live — a FIXED threshold hears one mic and not another (real
// mics behind AGC/noise-suppression differ by an order of magnitude; browser-verified).
const CALIBRATION_FRAMES = 8

// Mic-level meter refresh (throttled setState — the meter is feedback, not a scope).
const LEVEL_EMIT_MS = 150

// On-device inference watchdogs. A software-emulated GPU or a pathological CPU path can make
// one utterance take MINUTES (owner-observed: ~20 min on a llvmpipe adapter) — past these, the
// session degrades rather than sitting on "transcribing" forever. Warm-up runs during LOADING
// so a stall surfaces before the call starts, not mid-conversation.
const WARMUP_TIMEOUT_MS = 20000
const TRANSCRIBE_TIMEOUT_MS = 20000

/** Race a promise against a timeout (the loser is ignored — callers gen-check anyway). */
function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('on-device transcription timed out')), ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

/**
 * True when a WebGPU adapter is real hardware. Linux Chromium/Brave will happily hand back a
 * SOFTWARE adapter (Mesa llvmpipe / SwiftShader) that "works" at 100–1000× slowdown — the
 * owner's 20-minute transcription. Software GPU is strictly worse than the WASM path.
 */
async function hasHardwareWebGpu(gpu) {
  try {
    const adapter = await gpu.requestAdapter()
    if (!adapter) return false
    if (adapter.isFallbackAdapter || adapter.info?.isFallbackAdapter) return false
    const desc = [adapter.info?.vendor, adapter.info?.architecture, adapter.info?.device, adapter.info?.description]
      .join(' ')
      .toLowerCase()
    return !/llvmpipe|swiftshader|software|lavapipe/.test(desc)
  } catch {
    return false
  }
}

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
  const [loadPct, setLoadPct] = useState(0) // model-download % (LOADING feedback)
  const [micLevel, setMicLevel] = useState(0) // 0–1 level vs the speech gate (meter feedback)
  const [sttModeState, setSttModeState] = useState('device') // 'device' | 'server' — UI disclosure
  // Completed voice turns, mirrored into the chat thread ({role, content} — same shape as the
  // text chat) so the conversation is durable and readable, not trapped in the status strip.
  const [turns, setTurns] = useState([])

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
  const cfgRef = useRef(VAD_DEFAULTS) // VAD gates — replaced by calibrateVad after the window
  const calSamplesRef = useRef([]) // idle RMS frames collected for calibration
  const levelAtRef = useRef(0) // last mic-level emit (throttle)
  const sttModeRef = useRef('device') // audio-callback view of the STT mode (ref = no stale closure)
  const setSttMode = useCallback((m) => {
    sttModeRef.current = m
    setSttModeState(m)
  }, [])

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
    cfgRef.current = VAD_DEFAULTS
    calSamplesRef.current = []
    sttModeRef.current = 'device'
    setSttModeState('device')
    setLoadPct(0)
    setMicLevel(0)
  }, [])

  /** Hard-fail the session: close the mic, surface the error, leave text chat untouched. */
  const fail = useCallback(
    (message) => {
      teardown()
      dispatch({ type: 'ERROR', error: message })
    },
    [teardown],
  )

  /**
   * Server-STT floor: the captured 16 kHz turn, WAV-encoded, through the Worker's Whisper —
   * the same endpoint the push-to-talk mic uses. Slower than healthy on-device (~1–2 s/turn)
   * but bounded — and disclosed in the strip, because audio leaving the browser is a privacy
   * change the visitor must see.
   */
  const serverTranscribe = useCallback(async (audio16k) => {
    try {
      const res = await fetch(AGENT_STT_URL, {
        method: 'POST',
        body: new Blob([encodeWavPcm16(audio16k)], { type: 'audio/wav' }),
      })
      if (!res.ok) return ''
      const data = await res.json().catch(() => null)
      return data && data.text ? String(data.text).trim() : ''
    } catch {
      return '' // fail-safe: nothing usable → the turn resets to listening
    }
  }, [])

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
      setTurns((t) => [...t, { role: 'user', content: transcript }]) // what the mic heard → chat
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
      // Mirror the completed reply into the chat thread (markdown renders properly there;
      // the voice deliberately speaks the SHORT [AUDIO] summary, not this full text).
      setTurns((t) => [...t, { role: 'assistant', content: parsed.text || acc }])
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

      // Live level meter (throttled): scaled against the speech gate so "the bar fills when I
      // talk" is literally "the gate is being crossed" — makes a dead mic diagnosable at sight.
      const now = Date.now()
      if (now - levelAtRef.current >= LEVEL_EMIT_MS) {
        levelAtRef.current = now
        setMicLevel(Math.min(1, rms / (cfgRef.current.startRms * 2)))
      }

      // Calibrate the VAD against this room+mic before gating anything: fixed thresholds hear
      // one mic and not another (the "it's not listening" failure). ~0.7 s of idle frames.
      if (listening && calSamplesRef.current.length < CALIBRATION_FRAMES) {
        calSamplesRef.current.push(rms)
        if (calSamplesRef.current.length === CALIBRATION_FRAMES) {
          cfgRef.current = calibrateVad(calSamplesRef.current)
        }
        return
      }

      // While the assistant is talking, only a LOUDER onset counts (echo guard).
      const cfg = interruptible ? { ...cfgRef.current, startRms: cfgRef.current.bargeInRms } : cfgRef.current
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
      if (!isEndOfSpeech(vad.silenceMs) && !isMaxedTurn(vad, cfgRef.current)) return
      const turnVad = vad
      vadRef.current = initialVad()
      const captured = chunksRef.current
      chunksRef.current = []
      if (isNoiseTurn(turnVad, cfgRef.current)) return // breath/keyboard — drop silently, keep listening

      busyRef.current = true
      dispatch({ type: 'TURN_CAPTURED' }) // visible "heard you — transcribing" feedback
      ;(async () => {
        try {
          const ctx = ctxRef.current
          const audio = resampleLinear(mergeChunks(captured), ctx ? ctx.sampleRate : 48000)
          let text = ''
          let mode = sttModeRef.current
          if (mode === 'device' && transcriberRef.current) {
            try {
              const out = await withTimeout(transcriberRef.current(audio), TRANSCRIBE_TIMEOUT_MS)
              text = String(out && out.text ? out.text : '').trim()
            } catch {
              if (gen !== genRef.current) return
              // Stalled/failed on-device → one-way switch to the server floor for this
              // session, and the SAME captured turn is retried there — never lost.
              mode = 'server'
              setSttMode('server')
            }
          } else {
            mode = 'server'
          }
          if (gen !== genRef.current) return
          if (mode === 'server' && !text) text = await serverTranscribe(audio)
          if (gen !== genRef.current) return
          busyRef.current = false
          // Empty → SPEECH_FINAL('') resets TRANSCRIBING → LISTENING; else the turn runs.
          if (!text) return dispatch({ type: 'SPEECH_FINAL', text: '' })
          await runTurn(gen, text)
        } catch {
          if (gen === genRef.current) fail('Transcription failed — the text chat still works.')
        } finally {
          busyRef.current = false
        }
      })()
    },
    [fail, runTurn, serverTranscribe, setSttMode],
  )

  const start = useCallback(async () => {
    if (stateRef.current.state !== VOICE_STATE.IDLE && stateRef.current.state !== VOICE_STATE.ERROR) return
    teardown() // fresh generation
    setTurns([]) // new call = new visible conversation (the old one stays readable until now)
    const gen = genRef.current
    const caps = detectVoiceCaps()

    // navigator.gpu existing does NOT guarantee a usable adapter (Linux/VM/driver gaps — and a
    // failed WebGPU pipeline load can't simply be retried on WASM: the library caches the
    // rejected session per model id, verified in-browser). So pre-flight the REAL adapter —
    // and reject SOFTWARE adapters (llvmpipe/SwiftShader), which "work" 100–1000× too slow.
    let webgpuUsable = false
    if (caps.webgpu) webgpuUsable = await hasHardwareWebGpu(navigator.gpu)
    if (gen !== genRef.current) return
    const engine = pickSttEngine({ ...caps, webgpu: webgpuUsable })
    dispatch({ type: 'START', engine })

    // This cut ships the on-device engines only — without WASM there is no free real-time
    // path worth pretending at, so degrade honestly to the push-to-talk mic + text chat.
    if (engine !== STT_ENGINE.WHISPER_WEBGPU && engine !== STT_ENGINE.WHISPER_WASM) {
      return fail('Live voice needs a modern browser — the mic button + text chat still work.')
    }

    try {
      // 1) On-device Whisper (lazy; cached by the browser after the first load). Progress is
      // surfaced as a % — a multi-minute silent first download reads as broken. Each candidate
      // is WARMED with a real (silent) inference under a watchdog, so a stalling path is
      // caught HERE during "Loading" — never twenty minutes into a conversation. Chain:
      // webgpu-base → wasm-tiny → server Whisper (different model ids, so the library's
      // cached-rejection problem doesn't apply across steps).
      const warmup = async (device) => {
        const t = await loadTranscriber({
          device,
          onProgress: (pct) => {
            if (gen === genRef.current) setLoadPct(pct)
          },
        })
        if (gen !== genRef.current) return null
        await withTimeout(t(new Float32Array(8000)), WARMUP_TIMEOUT_MS) // 0.5s of silence
        return t
      }
      const candidates = engine === STT_ENGINE.WHISPER_WEBGPU ? ['webgpu', 'wasm'] : ['wasm']
      transcriberRef.current = null
      for (const device of candidates) {
        try {
          transcriberRef.current = await warmup(device)
        } catch {
          /* stalled or failed → next candidate */
        }
        if (gen !== genRef.current) return
        if (transcriberRef.current) break
      }
      if (!transcriberRef.current) setSttMode('server') // on-device unusable → server Whisper floor

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
  }, [teardown, fail, onFrame, setSttMode])

  const stop = useCallback(() => {
    teardown()
    dispatch({ type: 'STOP' })
  }, [teardown])

  // Unmount safety: release the mic/context if the widget goes away mid-call.
  useEffect(() => teardown, [teardown])

  return {
    ...state,
    // Streaming preview text: closed tags stripped + a trailing half-arrived tag trimmed, so
    // the strip never flashes raw `[AUDIO: "…` fragments mid-stream.
    displayReply: displayText(trimPartialTag(state.reply)),
    turns,
    loadPct,
    micLevel,
    sttMode: sttModeState,
    caps: detectVoiceCaps(),
    start,
    stop,
  }
}
