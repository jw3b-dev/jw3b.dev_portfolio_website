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
import { toolCallTarget } from './toolCalls.js'
import Markdown from './Markdown.jsx'
import { SpeakerToggle, MicButton } from './VoiceControls.jsx'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const { messages, streaming, send, toolCall, clearToolCall } = usePortfolioAgent()
  const { recording, voiceOn, canRecord, startRecording, stopRecording, speak, toggleVoice } = useVoice()
  const [draft, setDraft] = useState('')
  const listRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, open])

  // Voice output (FR-016): read the [AUDIO] spoken-summary of a completed assistant reply aloud
  // when voice is on. speak() dedups + no-ops when off, so this is safe to run on every change.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last && last.role === 'assistant' && !last.pending && last.audio) speak(last.audio)
  }, [messages, speak])

  // FR-019: a concierge hire-routing tool-call opens Mission Control (/hire-me). Validated
  // against the closed registry; unknown → ignored. Closes the widget so the route is visible.
  useEffect(() => {
    if (!toolCall) return
    const target = toolCallTarget(toolCall)
    clearToolCall()
    if (target) {
      setOpen(false)
      navigate(`${target.path}${target.hash}`)
    }
  }, [toolCall, clearToolCall, navigate])

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
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close concierge chat' : 'Open concierge chat'}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full border border-cyan/40 bg-panel text-cyan shadow-lg motion-safe:transition-transform motion-safe:hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        <span aria-hidden="true" className="text-xl font-semibold">
          {open ? '×' : 'AI'}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <section
          role="dialog"
          aria-label="AI concierge"
          className="fixed bottom-24 right-5 z-50 flex h-[32rem] max-h-[70vh] w-[22rem] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-hairline bg-panel/95 backdrop-blur"
        >
          <header className="flex items-start justify-between gap-2 border-b border-hairline px-4 py-3">
            <div>
              <h2 className="text-sm font-semibold text-content-primary">Concierge</h2>
              {/* FR-021 — persistent AI-disclosure indicator */}
              <p className="mt-0.5 text-xs text-content-muted">
                AI-generated · grounded to John&rsquo;s verified record
              </p>
            </div>
            {/* FR-016 — voice output toggle (spoken replies via TTS) */}
            <SpeakerToggle voiceOn={voiceOn} onToggle={toggleVoice} />
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <p className="text-sm text-content-secondary">
                Ask about John&rsquo;s shipped systems, the audit record, or how to hire him.
              </p>
            )}
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
