/*
 * jw3b.dev v2 — AI security console (P1-08 · FR-011/FR-014)  ·  full-stack-integrator
 * Operable audit console: edit Solidity → the deterministic severity table re-screens AS YOU
 * TYPE (real, offline-safe) → a streamed model narrative with protocol tags stripped. Shows the
 * AI-assisted-first-pass disclaimer with every finding set (FR-014). Semantic tokens only; the
 * heuristic pass is labelled a heuristic pass — "REPRODUCED" is reserved for labelled recorded
 * runs (radical honesty).
 *
 * The findings are DERIVED from the source, never stored. Before, `auditSolidity` ran inside the
 * click handler and its output was frozen into state, so the panel kept describing whatever was
 * in the box when you last pressed the button — the page promised an instant in-browser screen
 * and then ignored every edit. A pure function of the source belongs in a `useMemo`, not in
 * `useState`; that single change is the fix.
 *
 * The model narrative still needs the button (it costs a request), which makes it the one result
 * that can outlive its input — so it is explicitly marked stale when the source moves on.
 */
import { useMemo, useState } from 'react'
import ResultTabs from './ResultTabs.jsx'
import { Link } from 'react-router-dom'
import { useAuditStream } from '../../hooks/useAuditStream.js'
import { SEVERITY_META, SAMPLE_CONTRACT, auditSolidity } from '../../lib/auditHeuristics.js'
import { AUDIT_DISCLAIMER, SOURCE_CAP } from '../../lib/auditClient.js'

export default function AuditConsole({ initialSource } = {}) {
  const [source, setSource] = useState(initialSource || SAMPLE_CONTRACT)
  const { narrative, analysedSource, running, error, degraded, run } = useAuditStream()

  // The live heuristic pass. Pure + sub-millisecond on a contract-sized string, so it runs on
  // every keystroke with no debounce — a timer here would only add lag and test flakiness.
  // Past the cap we skip it rather than re-scanning a huge paste per keystroke; the run gate
  // rejects that source anyway, and the note below says so instead of silently showing nothing.
  const overCap = source.length > SOURCE_CAP
  const screen = useMemo(() => (overCap ? null : auditSolidity(source)), [source, overCap])
  const findings = screen?.findings ?? []

  // The narrative describes `analysedSource`; once the editor diverges it is a stale artifact.
  const narrativeStale = Boolean(narrative) && analysedSource !== null && analysedSource !== source

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
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => run(source)}
            disabled={running}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan disabled:opacity-40 motion-safe:transition-colors"
          >
            {running ? 'Analysing…' : narrativeStale ? 'Re-run AI analysis' : 'Run AI analysis'}
          </button>
          <span className="text-xs text-content-muted">Heuristics re-run as you type — no request needed.</span>
          {error && <span className="text-sm text-failed">{error}</span>}
        </div>
      </div>

      {/* Results */}
      <div className="flex flex-col rounded-lg border border-hairline bg-panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-content-primary">Findings</h3>
          <span className="text-xs uppercase tracking-wide text-content-muted">Heuristic pass · live</span>
        </div>

        {overCap && (
          <p className="mt-3 text-sm text-caution">
            Source exceeds {SOURCE_CAP.toLocaleString()} characters — trim it to screen it here.
          </p>
        )}
        {/* Deliberately not the run gate's wording ("Paste a Solidity contract to analyse."):
            two near-identical sentences on one screen read as a stutter, and the reader can't
            tell which one is the error. This states what the panel knows; that one states why
            the request was refused. */}
        {screen?.empty && <p className="mt-3 text-sm text-content-secondary">Nothing to screen — the editor is empty.</p>}

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
          {screen && !screen.empty && findings.length === 0 && (
            <li className="text-sm text-content-secondary">No common-pattern issues in this first-pass screen.</li>
          )}
        </ul>

        {narrative && (
          <div className="mt-4 border-t border-hairline pt-3">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-content-muted">Analysis</h4>
              {/* Same rule as the concierge: say whether THIS output came from the live model
                  or the bundled fallback. Labelling only the failure case teaches nothing
                  about the rest, and leaves the reader guessing on every good run. */}
              <span
                title={
                  degraded
                    ? 'Bundled fallback — the live model was unavailable'
                    : 'Generated by the live model just now'
                }
                className={
                  'font-mono text-[10px] uppercase tracking-label ' +
                  (degraded ? 'text-caution' : 'text-verified')
                }
              >
                {running ? 'streaming…' : degraded ? 'recorded' : 'live'}
              </span>
              {narrativeStale && (
                <span
                  title="The contract has been edited since this analysis ran"
                  className="font-mono text-[10px] uppercase tracking-label text-caution"
                >
                  stale
                </span>
              )}
            </div>
            {narrativeStale && (
              <p className="mt-2 rounded-md border border-caution/40 bg-caution/5 p-2 text-xs text-caution">
                You&rsquo;ve edited the contract since this ran — it describes the earlier version. The
                findings above are live; re-run to update this.
              </p>
            )}
            {/* Was a single preformatted block: the model's markdown rendered RAW (literal ##
                and backticks) and streamed down the page, so finding "the fix" meant scrolling
                past everything. ResultTabs splits it on its own headings and renders each part
                properly, following the newest section while it streams. */}
            <div className={'mt-2 ' + (narrativeStale ? 'opacity-60' : '')}>
              <ResultTabs source={narrative} streaming={running} label="Analysis sections" />
            </div>
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

        {(findings.length > 0 || narrative) && (
          <p className="mt-4 border-t border-hairline pt-3 text-xs text-content-muted">{AUDIT_DISCLAIMER}</p>
        )}
      </div>
    </div>
  )
}
