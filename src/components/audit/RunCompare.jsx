/*
 * Compare two runs  ·  app-ui-engineer  (brief 05, next-need 1)
 *
 * Runs already pin the exact source they analysed — the hard part was done — but there was no
 * side-by-side, which is the thing an auditor actually wants after applying a fix: not "what does
 * run 3 say" but "what changed between 2 and 3".
 *
 * Two deltas, because they answer different questions:
 *   · the FINDING delta (`findingsDelta`) — which detectors stopped or started firing, by count;
 *   · the SOURCE delta (`diffLines`) — the edit that caused it.
 * Rendering only the second invites the reader to infer the first by eye, which is how a fix
 * that introduced a new pattern gets read as an improvement.
 */
import { useMemo } from 'react'
import { findingsDelta } from '../../lib/auditFixes.js'
import { diffLines, collapseUnchanged, DIFF_TYPE } from '../../lib/lineDiff.js'

const ROW_CLASS = {
  [DIFF_TYPE.ADD]: 'bg-verified/10 text-verified',
  [DIFF_TYPE.DEL]: 'bg-failed/10 text-failed',
  [DIFF_TYPE.CTX]: 'text-content-muted',
}
const SIGIL = { [DIFF_TYPE.ADD]: '+', [DIFF_TYPE.DEL]: '−', [DIFF_TYPE.CTX]: ' ' }

export default function RunCompare({ base, other }) {
  const delta = useMemo(() => (base && other ? findingsDelta(base.source, other.source) : null), [base, other])
  const diff = useMemo(() => (base && other ? diffLines(base.source, other.source) : null), [base, other])
  const rows = useMemo(() => (diff && !diff.truncated ? collapseUnchanged(diff.rows) : []), [diff])

  if (!base || !other) return null
  if (base.id === other.id) return null

  const same = base.source === other.source
  const { resolved, introduced, unchanged } = delta

  return (
    <section aria-labelledby="run-compare-title" className="mt-3 rounded-md border border-hairline bg-void/60 p-3">
      <p id="run-compare-title" className="font-mono text-[10px] uppercase tracking-label text-content-muted">
        Run {base.seq} → Run {other.seq}
      </p>

      {same ? (
        <p className="mt-1 text-xs text-content-secondary">
          Both runs analysed identical source — any difference in their narratives is the model, not the contract.
        </p>
      ) : (
        <>
          {/* Findings first. This is the line that must not be inferred. */}
          <p className="mt-1 font-mono text-[10px] uppercase tracking-label">
            {resolved.length > 0 && <span className="text-verified">resolved: {resolved.join(', ')}</span>}
            {resolved.length > 0 && (introduced.length > 0 || unchanged.length > 0) && <span className="text-content-muted"> · </span>}
            {introduced.length > 0 && <span className="text-failed">introduced: {introduced.join(', ')}</span>}
            {introduced.length > 0 && unchanged.length > 0 && <span className="text-content-muted"> · </span>}
            {unchanged.length > 0 && <span className="text-content-muted">unchanged: {unchanged.join(', ')}</span>}
            {resolved.length + introduced.length + unchanged.length === 0 && (
              <span className="text-content-muted">no findings in either run</span>
            )}
          </p>

          {diff.truncated ? (
            <p className="mt-2 text-xs text-content-muted">Source diff skipped — over the line cap for an in-browser diff.</p>
          ) : (
            <pre className="mt-2 max-h-64 overflow-auto rounded border border-hairline bg-void p-2 font-mono text-[11px] leading-relaxed">
              {rows.map((r, i) =>
                r.type === 'gap' ? (
                  <div key={i} className="text-content-muted">  …</div>
                ) : (
                  <div key={i} className={ROW_CLASS[r.type]}>
                    {SIGIL[r.type]} {r.text}
                  </div>
                ),
              )}
            </pre>
          )}
        </>
      )}
    </section>
  )
}
