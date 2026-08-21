/*
 * jw3b.dev v2 — /audit narrative transport (ADR-P5-02 · W-4)  ·  full-stack-integrator
 *
 * The SSE read loop, lifted out of the hook so more than one run can use it and so it can be
 * tested against a fake fetch without a DOM. It parses the SHARED tag protocol via
 * `parseSseLine` (tagProtocol.js is the one source of truth — never re-implement the frame shape
 * here) and strips the embedded tags with `displayText` before anything reaches a reader.
 *
 * It NEVER throws. Every failure the Worker can hand us — unreachable, non-200, no body, a
 * stream that drops mid-response, a 200 with nothing in it — resolves to `degraded: true` with
 * whatever text did arrive. The console's floor is the deterministic heuristic screen, which is
 * already on the page and does not depend on this call at all; a thrown error here would take a
 * working page down over an optional narrative.
 */
import { AGENT_AUDIT_URL } from '../config/worker.js'
import { parseSseLine } from './tagProtocol.js'
import { displayText } from './conciergeClient.js'

/**
 * Stream one audit narrative.
 *
 * @param {string} source                     the contract to analyse
 * @param {object} opts
 * @param {(text:string)=>void} opts.onChunk  called with the FULL display text so far, per frame
 * @param {typeof fetch} [opts.fetchImpl]     injectable for tests
 * @param {string} [opts.url]
 * @param {AbortSignal} [opts.signal]
 * @returns {Promise<{text:string, degraded:boolean}>}
 */
export async function streamAuditNarrative(source, { onChunk, fetchImpl, url = AGENT_AUDIT_URL, signal } = {}) {
  const emit = typeof onChunk === 'function' ? onChunk : () => {}
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  if (!doFetch) return { text: '', degraded: true }

  let acc = ''
  try {
    const res = await doFetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source }),
      signal,
    })
    if (!res || !res.ok || !res.body) return { text: '', degraded: true }

    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let stop = false
    while (!stop) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const lines = buf.split('\n')
      buf = lines.pop() // keep the partial frame for the next chunk
      for (const line of lines) {
        const p = parseSseLine(line)
        if (!p) continue
        if (p.done) {
          stop = true
          break
        }
        if (p.response) {
          acc += p.response
          emit(displayText(acc))
        }
      }
    }
    // A 200 that streamed nothing is a failure wearing a success's clothes — say so, so the run
    // tab shows the recorded/degraded label instead of an empty "Analysis" heading.
    return { text: displayText(acc), degraded: !acc.trim() }
  } catch {
    return { text: displayText(acc), degraded: true }
  }
}
