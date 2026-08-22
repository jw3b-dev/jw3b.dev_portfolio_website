/*
 * jw3b.dev v2 — the audit console (P1-08 · FR-011/FR-014, ADR-P5-02)  ·  frontend-engineer
 * Implements design/briefs/audit-console.md.
 *
 * The console does two genuinely different things, and the version before this presented them as
 * undifferentiated panels: a FREE, instant, in-browser deterministic screen, and an on-demand
 * model call metered at 10 per session. Nothing on screen answered the first question a careful
 * visitor asks — which of these costs me something? So every section now states its own cost in
 * its own header, and `cyan` is reserved for the metered tier so the eye learns that colour means
 * "this spends something".
 *
 * THE NAMING RULE (binding, brief §2): the word "live" describes MODEL PROVENANCE and nothing
 * else. The findings panel used to be headed "Heuristic pass · live", meaning *updates as you
 * type*, while each run carried a badge reading "live", meaning *came from the model rather than a
 * recording* — one word, two meanings, one screen. The free tier is INSTANT. It is never live.
 *
 * The other structural fix: the auto-run toggle, pause, budget and status used to sit under the
 * editor as though they governed typing. They govern the metered tier, so they live in section 3
 * with it; the version chips moved the other way, under the editor, because they are the history
 * of the source.
 */
import { useCallback, useRef } from 'react'
import RunTabs from './RunTabs.jsx'
import { section } from './consoleCopy.js'
import { meteringState, meteringLabel } from '../../lib/meteringPolicy.js'
import { buildAuditReport, reportFilename, lineRange } from '../../lib/auditReport.js'
import VersionDiff from './VersionDiff.jsx'
import { Link } from 'react-router-dom'
import { useAuditWorkspace } from '../../hooks/useAuditWorkspace.js'
import { SEVERITY_META } from '../../lib/auditHeuristics.js'
import { AUDIT_DISCLAIMER, SOURCE_CAP } from '../../lib/auditClient.js'
import { AUDIT_EXAMPLES } from '../../lib/auditExamples.js'
import FixVerdict from './FixVerdict.jsx'

const chipBase =
  'rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

/**
 * A numbered section head. `cost` is not decoration — the brief's hard constraint is that a
 * section which doesn't say what it costs does not ship.
 */
function SectionHead({ n, title, cost, id, aside }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          <span className="text-cyan">{n}</span> · {title}
        </p>
        <p id={id} className="mt-0.5 text-[11px] text-content-muted">
          {cost}
        </p>
      </div>
      {aside}
    </div>
  )
}

export default function AuditConsole({ initialSource, idleMs } = {}) {
  const w = useAuditWorkspace({ initialSource, idleMs })

  /*
   * Take it with you. Everything in this console lives in a tab that a reload wipes — that is
   * deliberate (nothing is persisted, by design), but it also meant a visitor could screen a
   * contract, iterate versions and spend model calls, then leave with nothing at all. The report
   * is built by a pure function so the honesty rules travel with the file: verbatim disclaimer,
   * per-run live/recorded provenance, and "no patterns matched" never rendered as "safe".
   */
  /*
   * A finding's line number used to be printed and nothing more — the reader had to count lines
   * by eye in their own contract to find what was being described. Clicking it now selects that
   * line in the editor, which turns the finding into navigation.
   */
  // Keyboard-first: this is a tool for people who live in an editor, and every control was
  // mouse-only. A ref (not state) holds which finding is "current" for next/prev, because moving
  // the cursor must not re-render the editor mid-keystroke.
  const findingCursor = useRef(-1)
  const jumpToLineRef = useRef(() => {})
  const exportReportRef = useRef(() => {})

  const jumpToFinding = useCallback((dir) => {
    const fs = w.findings
    if (!fs.length) return
    const n = fs.length
    findingCursor.current = (findingCursor.current + dir + n) % n
    const f = fs[findingCursor.current]
    if (f) jumpToLineRef.current(f.line)
  }, [w.findings])

  /*
   * Shortcuts, scoped to this console (a listener on the root, not window, so they never fire
   * while the visitor is elsewhere on the page). Alt-based so they coexist with typing in the
   * editor and with the browser's own Ctrl/Cmd bindings:
   *   Alt+Enter  run analysis     Alt+J / Alt+K  next / previous finding
   *   Alt+E      export report    Alt+/          focus the editor
   */
  const onConsoleKeyDown = useCallback((e) => {
    if (!e.altKey || e.ctrlKey || e.metaKey) return
    const k = e.key.toLowerCase()
    if (k === 'enter') { if (!w.running) { e.preventDefault(); w.run() } }
    else if (k === 'j') { e.preventDefault(); jumpToFinding(1) }
    else if (k === 'k') { e.preventDefault(); jumpToFinding(-1) }
    else if (k === 'e') { e.preventDefault(); exportReportRef.current() }
    else if (k === '/') { e.preventDefault(); document.getElementById('audit-src')?.focus() }
  }, [w, jumpToFinding])

  const jumpToLine = (line) => {
    const el = document.getElementById('audit-src')
    if (!el) return
    const { start, end } = lineRange(w.draft, line)
    el.focus()
    el.setSelectionRange(start, end)
    // Put the selected line near the top of the scroll box rather than wherever it happened to be.
    const lineHeight = el.scrollHeight / Math.max(1, w.draft.split('\n').length)
    el.scrollTop = Math.max(0, (Math.trunc(Number(line) || 1) - 2) * lineHeight)
  }
  jumpToLineRef.current = jumpToLine

  const exportReport = () => {
    const generatedAt = new Date().toISOString()
    const md = buildAuditReport({
      source: w.draft,
      findings: w.findings,
      versions: w.versions,
      runs: w.runs,
      generatedAt,
    })
    const url = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }))
    const a = document.createElement('a')
    a.href = url
    a.download = reportFilename(w.draft, generatedAt)
    a.click()
    URL.revokeObjectURL(url)
  }
  exportReportRef.current = exportReport

  return (
    // onKeyDown on the root (not window): shortcuts are live only while focus is inside the
    // console, so they never hijack a key while the visitor reads elsewhere. role="group" + the
    // aria-label give the interactive container an accessible identity.
    <div
      role="group"
      aria-label="Audit console — keyboard shortcuts active"
      className="grid gap-5 lg:grid-cols-2"
      onKeyDown={onConsoleKeyDown}
    >
      {/* ═══ 1 · YOUR CONTRACT ══════════════════════════════════════════════ the source */}
      <section aria-labelledby="ac-src-title" className="flex flex-col">
        <p id="ac-src-title" className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          <span className="text-cyan">{section('1').n}</span> · {section('1').title}
        </p>
        {/* The LABEL is the accessible name and stays a short noun phrase; the instruction is
            separate descriptive text. Folding the sentence into the label would rename the field
            to a paragraph for anyone using a screen reader. */}
        <label htmlFor="audit-src" className="mt-1 text-sm font-medium text-content-secondary">
          Solidity source
        </label>
        <p id="audit-src-help" className="mt-0.5 mb-2 text-[11px] text-content-muted">
          {section('1').cost}
        </p>

        {/*
            A first-time visitor arriving with no contract to hand had nothing to try — the site's
            main interactive tool assumed you brought your own Solidity, which most people reading
            a security portfolio have not, at that moment.

            Each example is deliberately vulnerable in ONE named way, and that claim is verified
            rather than asserted: auditExamples.test.js runs the real engine over every one and
            fails if it does not raise the finding it advertises, or raises one it does not.
        */}
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            Or load an example:
          </span>
          {AUDIT_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => w.setDraft(ex.source)}
              title={ex.blurb}
              className="rounded-sm border border-hairline px-2 py-0.5 font-mono text-[10px] text-content-secondary motion-safe:transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
            >
              {ex.title}
            </button>
          ))}
        </div>
        <textarea
          id="audit-src"
          aria-describedby="audit-src-help"
          value={w.draft}
          onChange={(e) => w.setDraft(e.target.value)}
          spellCheck={false}
          className="h-80 w-full resize-y rounded-lg border border-hairline bg-void p-3 font-mono text-xs text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />

        {/* Version chips belong to the SOURCE, so they sit with it. */}
        <div className="mt-4 border-t border-hairline pt-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">Your versions</p>
          <p className="mt-0.5 text-[11px] text-content-muted">
            Each version is a <span className="text-content-secondary">full snapshot</span> of the
            contract, never a diff — an analysis always reads the whole thing. Click one to put it
            back in the editor; looking around costs nothing and changes nothing.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {w.versions.map((v) => {
              // Highlight the checkpoint the editor is ON — not the newest one.
              const isCurrent = v.id === w.currentVersionId
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => w.restoreVersion(v.id)}
                  aria-current={isCurrent ? 'true' : undefined}
                  title={`${v.label} — a full snapshot, ${v.source.split('\n').length} lines`}
                  className={
                    chipBase +
                    ' max-w-[12rem] truncate ' +
                    (isCurrent
                      ? 'border-content-secondary bg-panel text-content-primary'
                      : 'border-hairline text-content-muted hover:text-content-secondary')
                  }
                >
                  {v.label} · {v.source.split('\n').length}L
                </button>
              )
            })}
          </div>
          <VersionDiff versions={w.versions} currentVersionId={w.currentVersionId} />

          <p className="mt-3 text-[11px] text-content-muted">
            Kept in this tab only — nothing is stored on your device or ours. A reload starts clean.
          </p>
        </div>
      </section>

      {/* ═══ right column: what we can tell you ═════════════════════════════════════════ */}
      <div className="flex flex-col gap-5">
        {/* ─── 2 · INSTANT SCREEN ─────────────────────────────────────── free tier, always on */}
        <section aria-labelledby="ac-screen-title" className="rounded-lg border border-hairline bg-panel p-4">
          <SectionHead
            n="2"
            id="ac-screen-title"
            title={section('2').title}
            cost={section('2').cost}
            aside={
              <button
                type="button"
                onClick={exportReport}
                title="Download everything on this screen as Markdown — findings, analyses, versions and the contract"
                className={chipBase + ' border-hairline text-content-muted hover:text-content-primary'}
              >
                Export report
              </button>
            }
          />

          {w.overCap && (
            <p className="mt-3 text-sm text-caution">
              Source exceeds {SOURCE_CAP.toLocaleString()} characters — trim it to screen it here.
            </p>
          )}
          {w.screen?.empty && <p className="mt-3 text-sm text-content-secondary">Nothing to screen — the editor is empty.</p>}

          {/* The re-screen verdict lives in its own component because it carries a RULE:
              `introduced` outranks `cleared`. See FixVerdict.jsx. */}
          <FixVerdict lastFix={w.lastFix} />

          {w.findings.length > 0 && (
            <h3 className="mt-4 font-mono text-[10px] uppercase tracking-label text-content-muted">
              Pattern findings ({w.findings.length})
            </h3>
          )}
          <ul className="mt-2 space-y-3">
            {w.findings.map((f) => {
              const meta = SEVERITY_META[f.severity]
              const fix = w.fixes.find((x) => x.findingId === f.id)
              return (
                <li key={`${f.id}-${f.line}`} className="border-l-2 border-hairline pl-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${meta.dot}`} aria-hidden="true" />
                    <span className={`text-xs font-bold ${meta.tone}`}>{meta.label}</span>
                    <button
                      type="button"
                      onClick={() => jumpToLine(f.line)}
                      title={`Select line ${f.line} in the editor`}
                      className="text-xs text-content-muted underline decoration-dotted underline-offset-2 motion-safe:transition-colors hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                    >
                      line {f.line}
                    </button>
                    {fix && (
                      <button
                        type="button"
                        onClick={() => w.applyFix(fix)}
                        disabled={fix.locked}
                        title={fix.locked ? fix.lockReason : `Rule-derived fix — ${fix.description}`}
                        className={
                          'rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-label focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
                          (fix.locked
                            ? 'cursor-not-allowed border-hairline text-content-muted opacity-60'
                            : 'border-content-secondary/50 text-content-secondary hover:text-content-primary')
                        }
                      >
                        {fix.locked ? 'Fix locked' : 'Apply fix'}
                      </button>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-content-primary">{f.title}</p>
                  <p className="mt-0.5 text-xs text-content-secondary">{f.detail}</p>
                  {fix && (
                    <p className="mt-0.5 text-[11px] text-content-muted">
                      {fix.locked ? <span className="text-caution">{fix.lockReason}</span> : `Rule-derived fix · ${fix.description}`}
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
        </section>

        {/* ─── 3 · AI ANALYSIS ──────────────────────────────── metered tier: cyan lives here */}
        <section aria-labelledby="ac-ai-title" className="rounded-lg border border-cyan/25 bg-panel p-4">
          <SectionHead
            n="3"
            id="ac-ai-title"
            title={section('3').title}
            cost={section('3').cost}
            aside={
              /* P5-05: the counter comes from meteringPolicy rather than arithmetic inlined
                 here, so the exhausted state says what is STILL FREE instead of rendering a
                 bare "0 left". The paid rails are unprovisioned, so the policy deliberately
                 offers no upgrade — a disabled buy button is the shape this rerun removes. */
              <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
                {meteringLabel(meteringState({ used: w.runsUsed }))}
              </span>
            }
          />

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {/* The shortcuts have to be SEEN to exist. Kept terse; kbd for the keys. */}
              <p className="mb-2 w-full font-mono text-[10px] uppercase tracking-label text-content-muted">
                <kbd className="text-content-secondary">Alt+Enter</kbd> run ·{' '}
                <kbd className="text-content-secondary">Alt+J/K</kbd> next/prev finding ·{' '}
                <kbd className="text-content-secondary">Alt+E</kbd> export ·{' '}
                <kbd className="text-content-secondary">Alt+/</kbd> editor
              </p>
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
                className="h-3.5 w-3.5 accent-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
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
          </div>

          {/* Why the automatic policy is or isn't about to run. Never silent — a control that
              quietly declines reads as "the analysis agrees with your edit". */}
          <p className="mt-2 text-xs text-content-muted">{w.autoStatus.explain}</p>
          {w.error && <p className="mt-2 text-sm text-failed">{w.error}</p>}
        </section>

        {/* ─── 4 · AI ANALYSES ─────────────────── the same noun phrase as the button above */}
        <RunTabs
          runs={w.runs}
          selectedRun={w.selectedRun}
          onSelect={w.selectRun}
          draft={w.draft}
          onApplyFix={w.applyFix}
          onRestore={w.restoreVersion}
        />

        {w.runs.some((r) => r.degraded) && (
          <p className="text-xs text-caution">
            A run fell back to a recorded narrative — the instant screen&rsquo;s findings are real regardless.{' '}
            <Link to="/hire-me" className="text-cyan underline">
              Book a call
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}
