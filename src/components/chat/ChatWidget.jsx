/*
 * jw3b.dev v2 — Global concierge ChatWidget (P1-07 · FR-015/FR-020/FR-021)  ·  full-stack-integrator
 * Floating, always-available concierge mounted in the app shell. Streams via usePortfolioAgent
 * (tags stripped before render). Carries a persistent AI-disclosure indicator (FR-021) and, when
 * the live agent is unreachable, shows the labelled recorded run + a one-tap book-a-call (FR-020)
 * — never a blank error. Semantic design tokens only (no raw hex); motion gated on motion-safe.
 */
import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePortfolioAgent } from '../../hooks/usePortfolioAgent.js'
import { useVoice } from '../../hooks/useVoice.js'
import { offerFromToolCall } from './toolCalls.js'
import { framingOriginAllowed } from '../../config/embeds.js'
import Markdown from './Markdown.jsx'
import { SpeakerToggle, MicButton } from './VoiceControls.jsx'
import { useLiveVoice } from '../../hooks/useLiveVoice.js'
import { isEnabled } from '../../config/features.js'
import { statusLabel, answerProvenance } from '../../lib/agentStatus.js'
import { stripMarkdown } from '../../lib/micTurn.js'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, streaming, status, checkStatus, send, toolCall, clearToolCall } = usePortfolioAgent()
  const { recording, voiceOn, canRecord, startRecording, stopRecording, speak, toggleVoice, unlockAudio } = useVoice()
  const live = useLiveVoice() // P3 live-voice (flag-gated; on-device Whisper + Claude + Aura)
  const [draft, setDraft] = useState('')
  // A pending, visitor-consented route offer from a tool-call — never an automatic navigation.
  const [offer, setOffer] = useState(null)
  const listRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, live.turns, open])

  // Voice output (FR-016): read the [AUDIO] spoken-summary of a completed assistant reply aloud
  // when voice is on. speak() dedups + no-ops when off, so this is safe to run on every change.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && !last.pending && last.audio) speak(last.audio)
  }, [messages, speak])

  /*
   * FR-019 — a hire-routing tool-call OFFERS Mission Control; it never takes the visitor there.
   *
   * This used to navigate the instant the tag arrived, closing the widget with it. Asking the
   * live concierge "How do I use the audit page?" therefore ejected the visitor to /hire-me
   * mid-answer, and the reply they asked for was never seen — one over-eager tag from a small
   * model silently became a navigation event. Now a validated call becomes a card the visitor
   * can accept, and the answer stays on screen either way.
   */
  useEffect(() => {
    if (!toolCall) return
    // Both must agree: the model proposed it AND the visitor actually asked about hiring.
    const lastVisitor = [...messages].reverse().find((m) => m.role === 'user')?.content
    const target = offerFromToolCall(toolCall, lastVisitor)
    clearToolCall()
    if (target) setOffer(target)
  }, [toolCall, clearToolCall, messages])

  const acceptOffer = () => {
    if (!offer) return
    const { path, hash } = offer
    setOffer(null)
    setOpen(false)
    navigate(`${path}${hash}`)
  }

  /*
   * Probe once on mount so the launcher shows a real status on every route — it previously read
   * "Agent status unknown" until you hovered or opened it, announcing ignorance to every visitor
   * who never touched it.
   *
   * ONLY from the deployed origin. The Worker's CORS allowlist is production-only (the dev origin
   * rides a DEV_ORIGIN secret that is absent everywhere else), so an unprompted ping from
   * localhost or a preview host is blocked by the browser and logged as a console error the page
   * cannot catch — the first CI run of this change failed the console-error budget for exactly
   * that reason. Same guard the flagship embeds use (src/config/embeds.js): attempt the
   * cross-origin thing only where it is actually permitted. Hover/focus still probe everywhere,
   * so local development keeps the signal on demand.
   */
  useEffect(() => {
    if (framingOriginAllowed()) checkStatus()
  }, [checkStatus])

  const submit = (e) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || streaming) return
    setDraft('')
    send(text)
  }

  return (
    <>
      {/* Launcher */}
      <button
        type="button"
        onClick={() => {
          const next = !open
          if (next) checkStatus() // probe only when the panel is actually opened
          setOpen(next)
        }}
        aria-expanded={open}
        onMouseEnter={checkStatus}
        onFocus={checkStatus}
        aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
        className="fixed bottom-5 right-5 z-overlay flex h-14 w-14 items-center justify-center rounded-full border border-cyan/40 bg-panel text-cyan shadow-lg motion-safe:transition-transform motion-safe:hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        <span aria-hidden="true" className="text-xl font-semibold">
          {open ? '×' : 'AI'}
        </span>
        {/* The status lived only inside the OPEN panel, so you had to start a conversation to
            learn whether the agent was up. The launcher is on every route, so the signal
            belongs here too — a proven-live agent pulses, a degraded one shows caution. */}
        {!open && status !== 'unknown' && (
          <span
            aria-hidden="true"
            className={
              'absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-panel ' +
              (statusLabel(status).tone === 'verified'
                ? 'bg-verified' + (statusLabel(status).proven ? ' motion-safe:animate-pulse' : '')
                : statusLabel(status).tone === 'caution'
                  ? 'bg-caution'
                  : 'bg-content-muted')
            }
          />
        )}
        <span className="sr-only">{statusLabel(status).text}</span>
      </button>

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label="AI concierge"
          className="fixed bottom-24 right-5 z-overlay flex h-[32rem] max-h-[70vh] w-[22rem] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-hairline bg-panel/95 backdrop-blur"
        >
          <header className="flex items-start justify-between gap-2 border-b border-hairline px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">Concierge</h2>
              {/* FR-021 — persistent AI-disclosure indicator */}
              <p className="mt-0.5 text-xs text-content-muted">
                AI-generated · grounded to John&rsquo;s verified record
              </p>
              {/* Live/offline status. Before this the site only spoke up when something BROKE —
                  a visitor could not tell whether the agent was up, or whether the reply they
                  just read was real. `proven` distinguishes "reachable" from "actually answered". */}
              {(() => {
                const s = statusLabel(status)
                const dot =
                  s.tone === 'verified' ? 'bg-verified' : s.tone === 'caution' ? 'bg-caution' : 'bg-content-muted'
                const text =
                  s.tone === 'verified' ? 'text-verified' : s.tone === 'caution' ? 'text-caution' : 'text-content-muted'
                return (
                  <p className="mt-1 flex items-center gap-1.5" aria-live="polite">
                    <span
                      aria-hidden="true"
                      className={`inline-block h-1.5 w-1.5 rounded-full ${dot} ${s.proven ? 'motion-safe:animate-pulse' : ''}`}
                    />
                    <span className={`font-mono text-[10px] uppercase tracking-label ${text}`}>{s.text}</span>
                  </p>
                )
              })()}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {/* P3 live-voice entry (flag-gated; hands-free on-device voice). Full call UI is WIP. */}
              {isEnabled('voiceLive') && (
                <button
                  type="button"
                  onClick={live.state === 'idle' ? live.start : live.stop}
                  aria-pressed={live.state !== 'idle'}
                  aria-label={live.state === 'idle' ? 'Start live voice' : 'Stop live voice'}
                  title="Hands-free voice (beta)"
                  className={
                    'rounded-md border px-1.5 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
                    (live.state !== 'idle' ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-hairline text-content-muted hover:text-content-secondary')
                  }
                >
                  {live.state === 'idle' ? 'Live' : live.state === 'loading' ? '…' : '◉'}
                </button>
              )}
              {/* FR-016 — voice output toggle (spoken replies via TTS). Enabling it speaks the last
                  reply immediately (within the click gesture) so voice is discoverable + audibly confirmed. */}
              <SpeakerToggle
                voiceOn={voiceOn}
                onToggle={() => {
                  const turningOn = !voiceOn
                  if (turningOn) unlockAudio() // resume the AudioContext within the click gesture
                  toggleVoice()
                  if (turningOn) {
                    const last = [...messages].reverse().find((m) => m.role === 'assistant' && !m.pending && m.audio)
                    if (last) speak(last.audio, { force: true })
                  }
                }}
              />
            </div>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && live.turns.length === 0 && (
              <p className="text-sm text-content-secondary">
                Ask about John&rsquo;s shipped systems, the audit record, or how to hire him.
              </p>
            )}
            {/* Live-voice turns, mirrored into the thread as real messages (FR-021 disclosure
                covers both modes): what the mic heard + the full reply, markdown rendered —
                so the spoken SUMMARY and the written detail are visibly two views of one turn. */}
            {live.turns.map((m, i) => (
              <div key={`v${i}`} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    'inline-block max-w-[85%] rounded-xl px-3 py-2 text-left text-sm ' +
                    (m.role === 'user'
                      ? 'whitespace-pre-wrap bg-cyan/15 text-content-primary'
                      : 'bg-raised text-content-secondary')
                  }
                >
                  {m.role === 'assistant' ? <Markdown source={m.content} /> : `🎙 ${m.content}`}
                </div>
              </div>
            ))}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                <div
                  className={
                    'inline-block max-w-[85%] rounded-xl px-3 py-2 text-left text-sm ' +
                    (m.role === 'user'
                      ? 'whitespace-pre-wrap bg-cyan/15 text-content-primary'
                      : 'bg-raised text-content-secondary')
                  }
                >
                  {m.role === 'assistant' ? (
                    m.content ? <Markdown source={m.content} /> : m.pending ? '…' : ''
                  ) : (
                    m.content || (m.pending ? '…' : '')
                  )}
                </div>
                {/* Provenance on EVERY completed answer — "live" is as important to state as
                    "recorded", or the absence of a label is the only thing carrying meaning. */}
                {(() => {
                  const p = answerProvenance(m)
                  if (!p) return null
                  return (
                    <div
                      title={p.title}
                      className={`mt-1 font-mono text-[10px] uppercase tracking-label ${
                        p.tone === 'verified' ? 'text-verified' : 'text-caution'
                      }`}
                    >
                      {p.text}
                    </div>
                  )
                })()}
                {m.degraded && (
                  <div className="mt-1 text-xs text-caution">
                    Recorded run — live agent unavailable.{' '}
                    <Link to="/hire-me" className="text-cyan underline" onClick={() => setOpen(false)}>
                      Book a call
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* P3 live-voice call strip: the hands-free session's state + current turn, rendered
              inside the panel so the visitor always sees what the mic is doing. Error is honest
              and names the working fallback (text chat / push-to-talk stay available below). */}
          {isEnabled('voiceLive') && live.state !== 'idle' && (
            <div className="border-t border-hairline bg-raised/60 px-4 py-2 text-xs" aria-live="polite">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={
                    'inline-block h-2 w-2 rounded-full ' +
                    (live.state === 'listening'
                      ? 'bg-cyan motion-safe:animate-pulse'
                      : live.state === 'error'
                        ? 'bg-caution'
                        : 'bg-content-muted')
                  }
                />
                <span className="font-mono uppercase tracking-label text-content-muted">
                  {live.state === 'loading' &&
                    (live.loadPct > 0 ? `Downloading voice model… ${live.loadPct}%` : 'Loading voice model…')}
                  {live.state === 'listening' && 'Listening — just talk'}
                  {live.state === 'transcribing' && 'Heard you — transcribing…'}
                  {live.state === 'thinking' && 'Thinking…'}
                  {live.state === 'speaking' && 'Speaking — talk to interrupt'}
                  {live.state === 'error' && 'Live voice ended'}
                </span>
                {/* Mic-level meter: fills as speech crosses the (room-calibrated) gate, so a
                    dead/quiet mic is visible at a glance instead of a silent "not listening". */}
                {(live.state === 'listening' || live.state === 'thinking' || live.state === 'speaking') && (
                  <span
                    aria-hidden="true"
                    className="ml-auto inline-block h-1.5 w-16 overflow-hidden rounded-full bg-hairline"
                  >
                    <span
                      className="block h-full rounded-full bg-cyan motion-safe:transition-[width] motion-safe:duration-150"
                      style={{ width: `${Math.round(live.micLevel * 100)}%` }}
                    />
                  </span>
                )}
              </div>
              {live.state === 'loading' && (
                <p className="mt-1 text-content-muted">
                  First call downloads the on-device speech model (cached after that) — your audio never
                  leaves the browser.
                </p>
              )}
              {/* Privacy disclosure: if on-device ASR stalls, the session degrades to server
                  transcription — audio now leaves the browser, so the visitor must see it. */}
              {live.sttMode === 'server' && live.state !== 'error' && live.state !== 'loading' && (
                <p className="mt-1 text-content-muted">
                  On-device transcription isn&rsquo;t responsive on this device — using server
                  transcription for this call.
                </p>
              )}
              {live.state === 'error' && live.error && <p className="mt-1 text-caution">{live.error}</p>}
              {live.transcript && live.state !== 'error' && (
                <p className="mt-1 truncate text-content-secondary">“{live.transcript}”</p>
              )}
              {/* Streaming preview is PLAIN text (markdown stripped — no raw asterisks in the
                  ticker); the completed reply lands in the thread above, properly rendered. */}
              {live.displayReply && (live.state === 'thinking' || live.state === 'speaking') && (
                <p className="mt-1 max-h-16 overflow-y-auto whitespace-pre-wrap text-content-secondary">
                  {stripMarkdown(live.displayReply)}
                </p>
              )}
            </div>
          )}

          {/* The consented route offer. The concierge proposes; the visitor decides. */}
          {offer && (
            <div className="border-t border-cyan/25 bg-raised p-3">
              <p className="text-xs text-content-secondary">
                {offer.hash === '#pricing'
                  ? 'Want the packages and indicative pricing?'
                  : 'Want to start a booking?'}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={acceptOffer}
                  className="rounded-md border border-cyan/40 px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-cyan motion-safe:transition-colors hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                >
                  Open Mission Control →
                </button>
                <button
                  type="button"
                  onClick={() => setOffer(null)}
                  className="font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="border-t border-hairline p-3">
            <label htmlFor="concierge-input" className="sr-only">
              Message the concierge
            </label>
            <div className="flex items-center gap-2">
              {/* FR-016 — mic: record → Whisper STT → send the transcript */}
              <MicButton
                canRecord={canRecord}
                recording={recording}
                disabled={streaming}
                onStart={() => startRecording((t) => send(t))}
                onStop={stopRecording}
              />
              <input
                id="concierge-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={streaming ? 'Streaming…' : recording ? 'Listening…' : 'Ask a question…'}
                disabled={streaming}
                className="flex-1 rounded-lg border border-hairline bg-void px-3 py-2 text-sm text-content-primary placeholder:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
              />
              <button
                type="submit"
                disabled={streaming || !draft.trim()}
                className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-2 text-sm font-medium text-cyan disabled:opacity-40 motion-safe:transition-colors"
              >
                Send
              </button>
            </div>
          </form>
        </section>
      )}
    </>
  )
}
