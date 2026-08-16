/*
 * jw3b.dev v2 — AI security console (P1-08 · FR-011/FR-014)  ·  full-stack-integrator
 * Operable audit console: paste Solidity → instant deterministic severity table (real, offline-
 * safe) → streamed model narrative with protocol tags stripped. Shows the AI-assisted-first-pass
 * disclaimer with every finding set (FR-014). Semantic tokens only; the heuristic pass is
 * labelled a heuristic pass — "REPRODUCED" is reserved for labelled recorded runs (radical honesty).
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuditStream } from '../../hooks/useAuditStream.js'
import { SEVERITY_META, SAMPLE_CONTRACT } from '../../lib/auditHeuristics.js'
import { AUDIT_DISCLAIMER } from '../../lib/auditClient.js'

export default function AuditConsole() {
  const [source, setSource] = useState(SAMPLE_CONTRACT)
  const { findings, narrative, running, error, degraded, run } = useAuditStream()
  const hasRun = findings.length > 0 || narrative || degraded || error

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Editor */}
      <div className="flex flex-col">
        <label htmlFor="audit-src" className="mb-2 text-sm font-medium text-content-secondary">
          Solidity source
        </label>
        <textarea
          id="audit-src"
          value={source}
          onChange={(e) => setSource(e.target.value)}
          spellCheck={false}
          className="h-80 w-full resize-y rounded-lg border border-hairline bg-void p-3 font-mono text-xs text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => run(source)}
            disabled={running}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan disabled:opacity-40 motion-safe:transition-colors"
          >
            {running ? 'Analysing…' : 'Run analysis'}
          </button>
          {error && <span className="text-sm text-failed">{error}</span>}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col rounded-lg border border-hairline bg-panel p-4">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-content-primary">Findings</h3>
          <span className="text-xs uppercase tracking-wide text-content-muted">Heuristic pass</span>
        </div>

        {!hasRun && <p className="mt-3 text-sm text-content-secondary">Run the analysis to see findings.</p>}

        <ul className="mt-3 space-y-3">
          {findings.map((f) => {
            const meta = SEVERITY_META[f.severity]
            return (
              <li key={`${f.id}-${f.line}`} className="border-l-2 border-hairline pl-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  <span className={`text-xs font-bold ${meta.tone}`}>{meta.label}</span>
                  <span className="text-xs text-content-muted">line {f.line}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-content-primary">{f.title}</p>
                <p className="mt-0.5 text-xs text-content-secondary">{f.detail}</p>
              </li>
            )
          })}
          {hasRun && findings.length === 0 && !error && (
            <li className="text-sm text-content-secondary">No common-pattern issues in this first-pass screen.</li>
          )}
        </ul>

        {narrative && (
          <div className="mt-4 border-t border-hairline pt-3">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-content-muted">Analysis</h4>
            <p className="mt-1 whitespace-pre-wrap text-sm text-content-secondary">{narrative}</p>
          </div>
        )}

        {degraded && (
          <p className="mt-4 border-t border-hairline pt-3 text-xs text-caution">
            Live narrative unavailable — the heuristic findings above are real.{' '}
            <Link to="/hire-me" className="text-cyan underline">
              Book a call
            </Link>
          </p>
        )}

        {hasRun && (
          <p className="mt-4 border-t border-hairline pt-3 text-xs text-content-muted">{AUDIT_DISCLAIMER}</p>
        )}
      </div>
    </div>
  )
}
