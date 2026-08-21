/*
 * jw3b.dev v2 — useTxExplain (P2-16 · FR-010)  ·  full-stack-integrator
 * Fetches a Base transaction via the wagmi public client and decodes it CLIENT-SIDE
 * (txDecode.js) — so the decoded summary shows even when the Worker is down (the floor). Then
 * it streams a plain-language narrative from /tx-explain, parsing the shared SSE tag contract.
 * Three endings: decoded+narrated (happy), decoded-only (Worker down → the decode still
 * stands), and a clear error only when neither the RPC decode nor the narrative is available.
 */
import { useCallback, useState } from 'react'
import { usePublicClient } from 'wagmi'
import { AGENT_TX_URL } from '../config/worker.js'
import { parseSseLine } from '../lib/tagProtocol.js'
import { displayText } from '../lib/conciergeClient.js'
import { decodeTx, isValidTxHash } from '../lib/txDecode.js'

export function useTxExplain() {
  const client = usePublicClient()
  const [decoded, setDecoded] = useState(null)
  const [narrative, setNarrative] = useState('')
  const [explainedHash, setExplainedHash] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)

  const explain = useCallback(
    async (txHash) => {
      setError(null)
      setNarrative('')
      setDecoded(null)
      if (!isValidTxHash(txHash)) {
        setError('Enter a valid transaction hash (0x… 64 hex).')
        return
      }
      // Pin the hash these results belong to: a decode shown under a DIFFERENT hash in the
      // box is a result describing something the reader is no longer looking at.
      setExplainedHash(txHash)
      setRunning(true)

      // 1) Client-side decode via the public RPC — the offline-safe floor (no Worker needed).
      let d = null
      try {
        const tx = await client.getTransaction({ hash: txHash })
        d = decodeTx(tx)
        setDecoded(d)
      } catch {
        // RPC unavailable — the decode floor is missing; the narrative may still run.
      }

      // 2) Worker narrative (streams). Degrades to a note; the decode above stands regardless.
      try {
        const res = await fetch(AGENT_TX_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash, summary: d?.summary || '' }),
        })
        if (!res.ok || !res.body) throw new Error('tx narrative unavailable')
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
      } catch {
        if (!d) setError('Could not decode or explain that transaction right now.')
      } finally {
        setRunning(false)
      }
    },
    [client],
  )

  return { decoded, narrative, explainedHash, running, error, explain }
}
