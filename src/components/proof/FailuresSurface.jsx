/*
 * jw3b.dev v2 — Radical-honesty failures surface (P1-13 · FR-045)  ·  frontend-engineer
 * A FIRST-CLASS "unedited run / what failed & why" surface — not a footnote. It renders the
 * real, reproducible P1-16 failure artifacts: the attempt, the real log, what failed & why,
 * and the fix. The flagship artifact is John's OWN audit tool missing a bug — showing a tool's
 * blind spot is the thesis, not an embarrassment. Semantic tokens only; the failed/caution
 * accents frame the miss, the verified accent frames the fix; motion is limited to the native
 * <details> disclosure. Every line here traces to a captured artifact — nothing is narrated.
 */
import { FAILURES } from '../../data/recorded-runs/failures/index.js'

function FailureCard({ f }) {
  return (
    <article className="rounded-lg border border-hairline bg-panel p-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1.5 rounded-sm border border-caution/40 bg-caution/5 px-2 py-0.5">
          <span className="h-1.5 w-1.5 rounded-full bg-caution" aria-hidden="true" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-label text-caution">
            {f.label}
          </span>
        </span>
        <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          captured {f.capturedAt} · {f.surface}
        </span>
      </div>

      <h3 className="mt-3 font-display text-base font-semibold text-content-primary">{f.title}</h3>
      <p className="mt-1 text-sm text-content-secondary">{f.attempt}</p>

      {/* The real log — the load-bearing "real logs" of FR-045. */}
      <div className="mt-4">
        <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">Real log</p>
        <pre className="mt-1.5 overflow-x-auto rounded-md border border-hairline bg-void p-3 font-mono text-[12px] leading-relaxed text-content-secondary">
          {f.log.join('\n')}
        </pre>
      </div>

      {/* What failed & why */}
      <div className="mt-4 border-l-2 border-failed pl-3">
        <p className="font-mono text-[10px] uppercase tracking-label text-failed">What failed &amp; why</p>
        <p className="mt-1 text-sm text-content-secondary">{f.failure}</p>
      </div>

      {/* The fix */}
      <div className="mt-3 border-l-2 border-verified pl-3">
        <p className="font-mono text-[10px] uppercase tracking-label text-verified">The fix</p>
        <p className="mt-1 text-sm text-content-secondary">{f.fix}</p>
      </div>

      {/* Reproduce it yourself — honesty you can check */}
      {f.input && (
        <details className="mt-4 group">
          <summary className="cursor-pointer list-none font-mono text-[11px] uppercase tracking-label text-cyan hover:text-content-primary [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">▸ Reproduce it — show the input</span>
            <span className="hidden group-open:inline">▾ Hide the input</span>
          </summary>
          {f.reproduce && <p className="mt-2 text-xs text-content-muted">{f.reproduce}</p>}
          <pre className="mt-2 overflow-x-auto rounded-md border border-hairline bg-void p-3 font-mono text-[12px] leading-relaxed text-content-secondary">
            {f.input}
          </pre>
        </details>
      )}
    </article>
  )
}

export default function FailuresSurface({ className = '' }) {
  return (
    <section aria-labelledby="failures-title" className={className}>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-caution" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          Radical honesty — unedited
        </span>
      </div>
      <h2 id="failures-title" className="mt-3 font-display text-lg font-semibold text-content-primary">
        What failed, and why
      </h2>
      <p className="mt-1 max-w-prose text-sm text-content-secondary">
        Most portfolios only show wins. These are real, reproducible failures — including one in
        John's own tooling — with the log, the cause, and the fix. You can re-run them yourself.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4">
        {FAILURES.map((f) => (
          <FailureCard key={f.id} f={f} />
        ))}
      </div>
    </section>
  )
}
