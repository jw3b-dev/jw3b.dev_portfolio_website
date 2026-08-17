/*
 * jw3b.dev v2 — mic-turn audio math (P3 · hands-free live voice)  ·  full-stack-integrator
 *
 * PURE helpers for the live-voice mic loop: frame energy (RMS), a tiny hysteresis VAD that
 * tracks speech/silence per audio frame, linear resampling to Whisper's 16 kHz, and chunk
 * assembly. No AudioContext, no mic, no I/O — useLiveVoice.js feeds frames in and reads the
 * verdicts out, so endpointing/barge-in behavior is exhaustively unit-tested here rather than
 * only observable in a browser.
 */

// Whisper models are trained on 16 kHz mono — every captured turn is resampled to this.
export const WHISPER_SAMPLE_RATE = 16000

// VAD tuning (frame-level, RMS on Float32 samples in [-1, 1]). Start/keep form a hysteresis
// pair so a turn doesn't flicker off between words; bargeIn is deliberately LOUDER than start
// because during TTS playback the mic can pick up our own speaker output — echoCancellation
// suppresses most of it, but the higher bar keeps the assistant from barging in on itself.
export const VAD_DEFAULTS = Object.freeze({
  startRms: 0.015, // frame energy that counts as speech onset from silence
  keepRms: 0.008, // once speaking, quieter frames still count (hysteresis)
  bargeInRms: 0.05, // onset bar while the assistant is SPEAKING/THINKING (echo guard)
  minSpeechMs: 240, // captured turns shorter than this are noise → discarded
  maxTurnMs: 15000, // hard per-utterance cap so a monologue can't grow unbounded
})

/** Root-mean-square energy of one audio frame. Empty/invalid input → 0. */
export function computeRms(samples) {
  if (!samples || !samples.length) return 0
  let sum = 0
  for (let i = 0; i < samples.length; i++) sum += samples[i] * samples[i]
  return Math.sqrt(sum / samples.length)
}

/** Fresh VAD tracker: not speaking, no accumulated speech or silence. */
export function initialVad() {
  return { speaking: false, speechMs: 0, silenceMs: 0 }
}

/**
 * Advance the VAD by one frame (pure). While silent, stays zeroed; on onset, starts
 * accumulating speechMs; in-turn quiet frames accumulate silenceMs (speechMs holds), which
 * `isEndOfSpeech` (voiceSession.js) turns into the end-of-turn verdict.
 */
export function updateVad(v, rms, frameMs, cfg = VAD_DEFAULTS) {
  const threshold = v.speaking ? cfg.keepRms : cfg.startRms
  if (rms >= threshold) return { speaking: true, speechMs: v.speechMs + frameMs, silenceMs: 0 }
  if (!v.speaking) return v // idle noise floor — nothing accumulates
  return { ...v, silenceMs: v.silenceMs + frameMs } // in-turn gap grows toward the endpoint
}

/** True when a captured turn is too short to be speech (breath, keyboard, door slam). */
export function isNoiseTurn(vad, cfg = VAD_DEFAULTS) {
  return !vad || !vad.speaking || vad.speechMs < cfg.minSpeechMs
}

/** True when a turn hit the hard length cap and must be force-endpointed. */
export function isMaxedTurn(vad, cfg = VAD_DEFAULTS) {
  return !!vad && vad.speaking && vad.speechMs >= cfg.maxTurnMs
}

/** Concatenate captured Float32Array frames into one contiguous buffer. */
export function mergeChunks(chunks) {
  const list = (chunks || []).filter((c) => c && c.length)
  const total = list.reduce((n, c) => n + c.length, 0)
  const out = new Float32Array(total)
  let off = 0
  for (const c of list) {
    out.set(c, off)
    off += c.length
  }
  return out
}

/**
 * Linear-interpolation resample (mono Float32) — e.g. the mic's native 48 kHz → Whisper's
 * 16 kHz. Same-rate input is returned as-is. Linear is plenty for downsampling speech to an
 * ASR model; this is not a hi-fi path.
 */
export function resampleLinear(input, fromRate, toRate = WHISPER_SAMPLE_RATE) {
  if (!input || !input.length || !fromRate || !toRate) return new Float32Array(0)
  if (fromRate === toRate) return input
  const ratio = fromRate / toRate
  const outLen = Math.max(1, Math.round(input.length / ratio))
  const out = new Float32Array(outLen)
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio
    const i0 = Math.floor(pos)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const frac = pos - i0
    out[i] = input[i0] * (1 - frac) + input[i1] * frac
  }
  return out
}

/**
 * What the assistant should SAY for a completed reply: the [AUDIO:"…"] spoken summary when the
 * model provided one, else the stripped display text. Pure — parsed pieces come from
 * tagProtocol/conciergeClient at the call site.
 */
export function speakableReply(audioTag, strippedText) {
  const a = String(audioTag || '').trim()
  if (a) return a
  return String(strippedText || '').trim()
}
