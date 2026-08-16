/*
 * jw3b.dev v2 — Concierge SSE hook (P1-07 · FR-015/FR-017/FR-020)  ·  full-stack-integrator
 * Streams the concierge from the Worker root (POST /), parsing the shared SSE tag protocol and
 * stripping [AUDIO]/[TOOL_CALL]/[RENDER_CARD] before render. On a Worker-unreachable / 503
 * fallthrough / empty stream it degrades to the labelled Tier-2 bundled run + a book-a-call
 * offer — never a blank error (FR-020). Streaming state drives the typing indicator + input lock.
 */
import { useCallback, useRef, useState } from 'react'
import { AGENT_CHAT_URL } from '../config/worker.js'
import { parseSseLine } from '../lib/tagProtocol.js'
import { buildOutgoing, shouldDegrade, degradedMessage, displayText } from '../lib/conciergeClient.js'
import { parseTags } from '../lib/tagProtocol.js'

export function usePortfolioAgent() {
  const [messages, setMessages] = useState([])
  const [streaming, setStreaming] = useState(false)
  const [toolCall, setToolCall] = useState(null)
  const historyRef = useRef([])

  const commit = useCallback((updater) => {
    setMessages((m) => {
      const next = updater(m)
      historyRef.current = next
      return next
    })
  }, [])

  const patchLast = useCallback(
    (patch) =>
      commit((m) => {
        if (!m.length) return m
        const c = [...m]
        c[c.length - 1] = { ...c[c.length - 1], ...patch }
        return c
      }),
    [commit],
  )

  const send = useCallback(
    async (raw) => {
      const text = String(raw || '').trim()
      if (!text || streaming) return
      const outgoing = buildOutgoing(historyRef.current, text)
      commit((m) => [...m, { role: 'user', content: text }, { role: 'assistant', content: '', pending: true }])
      setStreaming(true)
      try {
        const res = await fetch(AGENT_CHAT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: outgoing }),
        })
        if (shouldDegrade(res)) {
          patchLast(degradedMessage())
          return
        }
        const reader = res.body.getReader()
        const dec = new TextDecoder()
        let buf = ''
        let acc = ''
        let stop = false
        while (!stop) {
          const { done, value } = await reader.read()
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
              patchLast({ content: displayText(acc), pending: true })
            }
          }
        }
        if (!acc.trim()) patchLast(degradedMessage())
        else {
          // `audio` = the [AUDIO:"…"] spoken summary (stripped from display) so the widget can
          // read it aloud (TTS); toolCall surfaces the hire-routing tool-call (FR-019).
          const parsed = parseTags(acc)
          patchLast({ pending: false, audio: parsed.audio || null })
          if (parsed.toolCall) setToolCall(parsed.toolCall)
        }
      } catch {
        patchLast(degradedMessage())
      } finally {
        setStreaming(false)
      }
    },
    [streaming, commit, patchLast],
  )

  return { messages, streaming, send, toolCall, clearToolCall: () => setToolCall(null) }
}
