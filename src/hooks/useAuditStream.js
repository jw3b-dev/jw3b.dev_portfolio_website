/*
 * jw3b.dev v2 — Audit console stream hook (P1-08 · FR-011)  ·  full-stack-integrator
 * Runs the deterministic client heuristics instantly (real findings < 300ms, offline-safe),
 * then streams the Worker's /audit narrative — parsing the shared SSE protocol and stripping
 * tags before render. Client input validation mirrors the Worker (P1-04). On a Worker-unreachable
 * error the heuristics still stand and the console shows a graceful note (never a blank error).
 */
import { useCallback, useState } from 'react'
import { AGENT_AUDIT_URL } from '../config/worker.js'
import { parseSseLine } from '../lib/tagProtocol.js'
import { displayText } from '../lib/conciergeClient.js'
import { auditSolidity } from '../lib/auditHeuristics.js'
import { validateAuditSource } from '../lib/auditClient.js'

export function useAuditStream() {
  const [findings, setFindings] = useState([])
  const [narrative, setNarrative] = useState('')
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
    // 1) instant, real heuristic findings (offline-safe).
    setFindings(auditSolidity(source).findings)
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

  return { findings, narrative, running, error, degraded, run }
}
