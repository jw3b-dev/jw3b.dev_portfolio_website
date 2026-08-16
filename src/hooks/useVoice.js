/*
 * jw3b.dev v2 — concierge voice hook (STT + TTS)  ·  ported from v1 · full-stack-integrator
 * Mic capture → Whisper STT (/speech-to-text) → transcript; and speak(text) → Aura TTS
 * (/text-to-speech) → playback. Everything FAILS SAFE: no mic permission, no MediaRecorder, or a
 * worker error → the widget silently stays text-only, never a thrown error. Guards browser APIs so
 * it's inert (never crashes) under SSR / jsdom.
 */
import { useCallback, useRef, useState } from 'react'
import { AGENT_STT_URL, AGENT_TTS_URL } from '../config/worker.js'

// True only in a browser that can actually record.
export const canRecord = () =>
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices &&
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined'

export function useVoice() {
  const [recording, setRecording] = useState(false)
  const [voiceOn, setVoiceOn] = useState(false) // TTS opt-in (autoplay policy + user choice)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const audioRef = useRef(null)
  const spokenRef = useRef(new Set())

  const stopRecording = useCallback(() => {
    const r = recorderRef.current
    if (r && r.state !== 'inactive') r.stop()
  }, [])

  /** Start mic capture; on stop, transcribe and hand the text to `onTranscript`. Fail-safe. */
  const startRecording = useCallback(
    (onTranscript) => {
      if (!canRecord() || recording) return
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const recorder = new window.MediaRecorder(stream)
          recorderRef.current = recorder
          chunksRef.current = []
          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
          }
          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop()) // release the mic
            setRecording(false)
            if (!chunksRef.current.length) return
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
            try {
              const res = await fetch(AGENT_STT_URL, { method: 'POST', body: blob })
              const data = await res.json()
              const text = (data && data.text ? String(data.text) : '').trim()
              if (text && typeof onTranscript === 'function') onTranscript(text)
            } catch {
              /* fail-safe: no transcript, stay on text */
            }
          }
          recorder.start()
          setRecording(true)
        })
        .catch(() => setRecording(false)) // mic denied → silently stay on text
    },
    [recording],
  )

  /** Speak `text` once via TTS (dedup). No-op when voice is off, text is empty, or on any error. */
  const speak = useCallback(
    async (text, { force = false } = {}) => {
      // `force` speaks even if `voiceOn` reads false this tick — used when the user just clicked the
      // speaker ON (setVoiceOn hasn't committed yet), so enabling voice plays the last reply at once.
      const t = String(text || '').trim()
      if ((!voiceOn && !force) || !t || spokenRef.current.has(t)) return
      spokenRef.current.add(t)
      try {
        const res = await fetch(AGENT_TTS_URL, {
          method: 'POST',
          body: JSON.stringify({ text: t }),
          headers: { 'Content-Type': 'application/json' },
        })
        if (!res.ok || res.status === 204) return // worker degraded → silent
        const blob = await res.blob()
        if (!blob || !blob.size) return
        if (audioRef.current) audioRef.current.pause()
        const audio = new Audio(URL.createObjectURL(blob))
        audioRef.current = audio
        audio.play().catch(() => {}) // autoplay blocked → ignore
      } catch {
        /* fail-safe */
      }
    },
    [voiceOn],
  )

  const toggleVoice = useCallback(() => {
    setVoiceOn((v) => {
      if (v && audioRef.current) audioRef.current.pause() // turning off → stop current playback
      return !v
    })
  }, [])

  return { recording, voiceOn, canRecord: canRecord(), startRecording, stopRecording, speak, toggleVoice }
}
