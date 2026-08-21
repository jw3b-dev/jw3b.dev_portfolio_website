/*
 * jw3b.dev v2 — Audit console stream hook (P1-08 · FR-011)  ·  full-stack-integrator
 * Streams the Worker's /audit narrative — parsing the shared SSE protocol and stripping tags
 * before render. Client input validation mirrors the Worker (P1-04). On a Worker-unreachable
 * error the console degrades to a graceful note (never a blank error).
 *
 * The deterministic heuristics deliberately do NOT live here. They are a pure function of the
 * source, so the console DERIVES them on every edit (auditSolidity in AuditConsole) instead of
 * freezing them into state on a button press — which is exactly the bug this replaced: the
 * findings panel kept showing the screen of whatever was in the box when you last clicked, so
 * editing the contract changed nothing.
 *
 * What DOES need a button is the model narrative — it costs a request, so it can't fire per
 * keystroke. That makes it the one result that can outlive its input, so the hook reports the
 * exact source it analysed (`analysedSource`) and the UI marks the narrative stale the moment
 * the source diverges. An analysis that silently describes code no longer on screen is worse
 * than no analysis.
 */
import { useCallback, useState } from 'react'
import { AGENT_AUDIT_URL } from '../config/worker.js'
import { parseSseLine } from '../lib/tagProtocol.js'
import { displayText } from '../lib/conciergeClient.js'
import { validateAuditSource } from '../lib/auditClient.js'

export function useAuditStream() {
  const [narrative, setNarrative] = useState('')
  const [analysedSource, setAnalysedSource] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [degraded, setDegraded] = useState(false)

  const run = useCallback(async (source) => {
    const v = validateAuditSource(source)
    if (!v.ok) {
      setError(v.error)
      return
    }
    setError(null)
    setDegraded(false)
    setNarrative('')
    // Pin the exact text this narrative describes, so any later edit can be detected.
    setAnalysedSource(source)
    setRunning(true)
    try {
      const res = await fetch(AGENT_AUDIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source }),
      })
      if (!res.ok || !res.body) {
        setDegraded(true)
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
            setNarrative(displayText(acc))
          }
        }
      }
      if (!acc.trim()) setDegraded(true)
    } catch {
      setDegraded(true)
    } finally {
      setRunning(false)
    }
  }, [])

  return { narrative, analysedSource, running, error, degraded, run }
}
