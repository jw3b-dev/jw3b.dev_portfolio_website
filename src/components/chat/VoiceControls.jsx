/*
 * jw3b.dev v2 — VoiceControls (P3-05 · FR-016)  ·  full-stack-integrator
 * The concierge voice affordances, extracted from ChatWidget: a TTS speaker toggle and a
 * Whisper-STT mic button. Presentational + prop-driven (the `useVoice` hook lives in ChatWidget).
 * The mic renders nothing when the browser can't record, so it degrades to silence — never a dead
 * button — and the speaker toggle is a plain opt-in (autoplay policy + user choice). Tokens only.
 */

const MicIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="9" y="2" width="6" height="12" rx="3" />
    <path d="M5 10a7 7 0 0 0 14 0M12 17v4" strokeLinecap="round" />
  </svg>
)

const SpeakerIcon = ({ on }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 9v6h4l5 4V5L8 9H4z" />
    {on ? <path d="M16 8a5 5 0 0 1 0 8" /> : <path d="M17 9l4 6M21 9l-4 6" />}
  </svg>
)

/** TTS opt-in toggle: read completed replies aloud (FR-016). */
export function SpeakerToggle({ voiceOn, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={voiceOn ? 'Turn spoken replies off' : 'Turn spoken replies on'}
      aria-pressed={voiceOn}
      className={
        'shrink-0 rounded-md border p-1.5 motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
        (voiceOn ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-hairline text-content-muted hover:text-content-secondary')
      }
    >
      <SpeakerIcon on={voiceOn} />
    </button>
  )
}

/** Mic: record → Whisper STT → transcript. Hidden entirely when the browser can't record. */
export function MicButton({ canRecord, recording, disabled, onStart, onStop }) {
  if (!canRecord) return null
  return (
    <button
      type="button"
      onClick={() => (recording ? onStop() : onStart())}
      disabled={disabled}
      aria-label={recording ? 'Stop recording' : 'Record a voice message'}
      aria-pressed={recording}
      className={
        'shrink-0 rounded-lg border p-2 motion-safe:transition-colors disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
        (recording
          ? 'border-caution/60 bg-caution/15 text-caution motion-safe:animate-pulse'
          : 'border-hairline text-content-secondary hover:text-content-primary')
      }
    >
      <MicIcon />
    </button>
  )
}
