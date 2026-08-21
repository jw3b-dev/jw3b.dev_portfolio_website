/*
 * jw3b.dev v2 — the iterative audit console (P1-08 · FR-011/FR-014, ADR-P5-02)  ·  frontend-engineer
 *
 * The loop, not a single shot: edit → the deterministic screen follows every keystroke → apply a
 * rule-derived fix → the screen re-runs and says whether the finding actually cleared → analyse →
 * that run keeps its own tab and the exact source it analysed → go back to any checkpoint.
 *
 * Everything decidable lives in pure modules (auditWorkspace / autoRunPolicy / auditFixes /
 * auditHeuristics); this file renders them. Nothing derived is stored here — the console shipped
 * once with its findings frozen into state, which is exactly why editing did nothing.
 *
 * The auto-rerun toggle is OFF by default and says why: the analysis runs Opus against a per-IP
 * budget of 10, so a timer that fires on every pause would spend a visitor's whole session in a
 * minute of typing. The free heuristic screen decides when the expensive one is worth spending
 * (ADR-P5-02 §2), and when it declines it SAYS SO — silence would read as agreement.
 */
import RunTabs from './RunTabs.jsx'
import { Link } from 'react-router-dom'
import { useAuditWorkspace } from '../../hooks/useAuditWorkspace.js'
import { SEVERITY_META } from '../../lib/auditHeuristics.js'
import { AUDIT_DISCLAIMER, SOURCE_CAP } from '../../lib/auditClient.js'
import { VERSION_ORIGIN } from '../../lib/auditWorkspace.js'

const chipBase =
  'rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

export default function AuditConsole({ initialSource, idleMs } = {}) {
  const w = useAuditWorkspace({ initialSource, idleMs })

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* ---------------------------------------------------------------- editor + controls */}
      <div className="flex flex-col">
        <label htmlFor="audit-src" className="mb-2 text-sm font-medium text-content-secondary">
          Solidity source
        </label>
        <textarea
          id="audit-src"
          value={w.draft}
          onChange={(e) => w.setDraft(e.target.value)}
          spellCheck={false}
          className="h-80 w-full resize-y rounded-lg border border-hairline bg-void p-3 font-mono text-xs text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={w.run}
            disabled={w.running}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-semibold text-cyan disabled:opacity-40 motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            {w.running ? 'Analysing…' : 'Run AI analysis'}
          </button>

          <label className="flex items-center gap-1.5 text-xs text-content-secondary">
            <input
              type="checkbox"
              checked={w.autoRun}
              onChange={(e) => w.setAutoRun(e.target.checked)}
              className="h-3.5 w-3.5 accent-cyan"
            />
            Re-run on edit
          </label>

          {w.autoRun && (
            <button
              type="button"
              onClick={() => w.setPaused(!w.paused)}
              aria-pressed={w.paused}
              className={
                chipBase +
                (w.paused ? ' border-caution/50 text-caution' : ' border-hairline text-content-muted hover:text-content-secondary')
              }
            >
              {w.paused ? 'Paused' : 'Pause'}
            </button>
          )}

          <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            {w.runsLeft} of {w.runsUsed + w.runsLeft} analyses left
          </span>
        </div>

        {/* ADR-P5-02 §5.5 — the toggle states its COST and why the default is off. Putting that
            reasoning only in a code comment leaves a visitor with a switch and no reason to think
            twice about flipping it. */}
        <p className="mt-2 text-xs text-content-muted">
          Each analysis is one model call against a 10-per-session budget — which is why re-run-on-edit
          is off by default, and why it skips edits the heuristic screen can&rsquo;t see.
        </p>
        {/* Why the automatic policy is or isn't about to run. Never silent — a control that
            quietly declines reads as "the analysis agrees with your edit". */}
        <p className="mt-1 text-xs text-content-muted">{w.autoStatus.explain}</p>

        {w.error && <p className="mt-2 text-sm text-failed">{w.error}</p>}

        {/* -------------------------------------------------------------- checkpoints */}
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">Versions — click to restore</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {w.versions.map((v) => {
              // Highlight the checkpoint the editor is ON — not the newest one. Clicking an older
              // version used to light up a different chip, which is what made the bar look shuffled.
              const isCurrent = v.id === w.currentVersionId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => w.restoreVersion(v.id)}
                  title={v.origin === VERSION_ORIGIN.ORIGINAL ? 'The contract you started with' : v.label}
                  className={
                    chipBase +
                    ' max-w-[12rem] truncate ' +
                    (isCurrent ? 'border-cyan/50 bg-cyan/10 text-cyan' : 'border-hairline text-content-muted hover:text-content-secondary')
                  }
                >
                  {v.label}
                </button>
              )
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-content-muted">
            Kept in this tab only — nothing is stored on your device or ours. A reload starts clean.
          </p>
        </div>
      </div>

      {/* ---------------------------------------------------------------- results */}
      <div className="flex flex-col rounded-lg border border-hairline bg-panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="text-sm font-semibold text-content-primary">Findings</h3>
          <span className="text-xs uppercase tracking-wide text-content-muted">Heuristic pass · live</span>
        </div>

        {w.overCap && (
          <p className="mt-3 text-sm text-caution">
            Source exceeds {SOURCE_CAP.toLocaleString()} characters — trim it to screen it here.
          </p>
        )}
        {w.screen?.empty && <p className="mt-3 text-sm text-content-secondary">Nothing to screen — the editor is empty.</p>}

        {/* The re-screen verdict. The console applies a change and then reports what the detector
            says about the RESULT; it never claims the fix worked. */}
        {w.lastFix && (
          <p
            className={
              'mt-3 rounded-md border p-2 text-xs ' +
              (w.lastFix.cleared ? 'border-verified/40 bg-verified/5 text-verified' : 'border-caution/40 bg-caution/5 text-caution')
            }
          >
            {w.lastFix.cleared
              ? `Applied the rule-derived fix “${w.lastFix.label}” — re-screened, and the finding is gone. That clears one pattern; it is not an audit.`
              : `Applied the rule-derived fix “${w.lastFix.label}” — but the re-screen still flags it. Shown as-is rather than claimed as fixed.`}
          </p>
        )}

        <ul className="mt-3 space-y-3">
          {w.findings.map((f) => {
            const meta = SEVERITY_META[f.severity]
            const fix = w.fixes.find((x) => x.findingId === f.id)
            return (
              <li key={`${f.id}-${f.line}`} className="border-l-2 border-hairline pl-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                  <span className={`text-xs font-bold ${meta.tone}`}>{meta.label}</span>
                  <span className="text-xs text-content-muted">line {f.line}</span>
                  {fix && (
                    <button
                      type="button"
                      onClick={() => w.applyFix(fix)}
                      title={`Rule-derived fix — ${fix.description}`}
                      className="rounded border border-cyan/40 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                    >
                      Apply fix
                    </button>
                  )}
                </div>
                <p className="mt-1 text-sm font-medium text-content-primary">{f.title}</p>
                <p className="mt-0.5 text-xs text-content-secondary">{f.detail}</p>
                {fix && (
                  <p className="mt-0.5 text-[11px] text-content-muted">
                    Rule-derived fix · {fix.description}
                  </p>
                )}
              </li>
            )
          })}
          {w.screen && !w.screen.empty && w.findings.length === 0 && (
            <li className="text-sm text-content-secondary">No common-pattern issues in this first-pass screen.</li>
          )}
        </ul>

        {w.findings.length > 0 && (
          <p className="mt-4 border-t border-hairline pt-3 text-xs text-content-muted">{AUDIT_DISCLAIMER}</p>
        )}

        <RunTabs
          runs={w.runs}
          selectedRun={w.selectedRun}
          onSelect={w.selectRun}
          draft={w.draft}
          onApplyFix={w.applyFix}
          onRestore={w.restoreVersion}
        />

        {w.runs.some((r) => r.degraded) && (
          <p className="mt-3 text-xs text-caution">
            A run fell back to a recorded narrative — the heuristic findings are real regardless.{' '}
            <Link to="/hire-me" className="text-cyan underline">
              Book a call
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
