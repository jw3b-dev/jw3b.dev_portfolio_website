/*
 * AI security console route (P1-08 · FR-011/FR-014, extended by the P5 audit).
 *
 * TABBED because two finished tools were unreachable: FuzzTool (P2-15 · FR-009) and
 * TxExplainer (P2-16 · FR-010) shipped with components, hooks, Worker routes and tests, but
 * were mounted on no page — so no visitor could ever run them, and the Worker's /fuzz route
 * was answering requests nobody could make. Composing all three here restores FR-009/FR-010
 * and honours FR-038 (nothing ships that a user can't reach).
 *
 * Tabs are real semantic tablist/tab/tabpanel with roving focus, so the surface stays
 * keyboard-operable — this console is the site's own proof of care.
 */
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Seo from '../components/seo/Seo.jsx'
import { FAILURES } from '../data/recorded-runs/failures/index.js'
import AuditConsole from '../components/audit/AuditConsole.jsx'
import { CONSOLE_SECTIONS, INSTANT_SCREEN_BRIDGE } from '../components/audit/consoleCopy.js'
import FuzzTool from '../components/audit/FuzzTool.jsx'
import TxExplainer from '../components/audit/TxExplainer.jsx'

const TABS = [
  { id: 'screen', label: 'Screen a contract', hint: 'Instant screen (free) + AI analysis (metered)' },
  { id: 'fuzz', label: 'Generate a fuzz harness', hint: 'Foundry property-test scaffold' },
  { id: 'tx', label: 'Explain a transaction', hint: 'Decode calldata, then narrate it' },
]

/**
 * The four steps, stated BEFORE the tool — so a first-time visitor learns the workflow without
 * spending anything to discover it. Built from the console's own copy module, so this strip and
 * the section headers below it cannot drift apart. Section 4 is otherwise invisible until a run
 * exists, which meant the shape of the workflow could only be learned by paying for it.
 */
function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="mt-6 rounded-lg border border-hairline bg-panel p-4">
      <h2 id="how-it-works" className="font-mono text-[11px] uppercase tracking-label text-content-muted">
        How screening a contract works
      </h2>
      <ol className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {CONSOLE_SECTIONS.map((s) => (
          <li key={s.n} className="border-t border-hairline pt-2">
            <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
              <span className="text-cyan">{s.n}</span> · {s.title}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-content-secondary">{s.blurb}</p>
          </li>
        ))}
      </ol>
      {/* Cyan marks the metered tier everywhere on this page; saying it once here stops the
          colour reading as decoration. */}
      <p className="mt-3 border-t border-hairline pt-2 text-[11px] text-content-muted">
        Steps 1 and 2 are free and run entirely in your browser. Only{' '}
        <span className="text-cyan">step 3</span> spends anything — one model call per run, 10 per
        session.
      </p>
    </section>
  )
}

export default function Audit() {
  const [active, setActive] = useState('screen')

  // `?case=<failure id>` loads that captured failure's EXACT input into the console. The
  // failures surface links here, so "reproduce it" is a click rather than a copy-paste
  // instruction — you run the real tool on the real input and watch it miss the bug yourself.
  const [params] = useSearchParams()
  const replay = FAILURES.find((f) => f.id === params.get('case') && f.surface === 'audit')

  // Left/Right arrows move between tabs, matching the WAI-ARIA tabs pattern.
  const onKeyDown = (e) => {
    const i = TABS.findIndex((t) => t.id === active)
    if (e.key === 'ArrowRight') setActive(TABS[(i + 1) % TABS.length].id)
    if (e.key === 'ArrowLeft') setActive(TABS[(i - 1 + TABS.length) % TABS.length].id)
  }

  return (
    <section aria-labelledby="audit-title" className="mx-auto max-w-6xl px-4 py-10">
      <Seo
        title="AI Security Console"
        description="Paste a Solidity contract for a free instant pattern screen and an optional AI analysis, generate a Foundry fuzz harness, or decode and explain a transaction — John Wellard's operable smart-contract auditor."
      />
      <h1 id="audit-title" className="text-2xl font-semibold text-content-primary">
        AI security console
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-content-secondary">
        Three tools against the same discipline: reproduce the finding, don&rsquo;t assert it.{' '}
        {/* Said ONCE: the old name and the new name are the same section. After this the old term
            is never used as a name again. */}
        {INSTANT_SCREEN_BRIDGE} It keeps working when the live model is offline.
      </p>

      {replay && (
        <p className="mt-4 rounded-md border border-caution/40 bg-caution/5 p-3 text-sm text-content-secondary">
          <span className="font-mono text-[11px] uppercase tracking-label text-caution">Replaying a captured miss</span>
          <br />
          Loaded the exact contract from “{replay.title}”. Run it: the instant screen returns{' '}
          <span className="font-mono text-content-primary">no pattern findings</span> on a contract
          anyone can drain — which is precisely what a pattern pre-screen cannot promise.
        </p>
      )}

      {active === 'screen' && <HowItWorks />}

      <div
        role="tablist"
        aria-label="Security console tools"
        onKeyDown={onKeyDown}
        className="mt-8 flex flex-wrap gap-2 border-b border-hairline"
      >
        {TABS.map((t) => {
          const selected = t.id === active
          return (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              type="button"
              aria-selected={selected}
              aria-controls={`panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              title={t.hint}
              className={
                '-mb-px rounded-t-md border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
                (selected
                  ? 'border-cyan text-cyan'
                  : 'border-transparent text-content-muted hover:text-content-secondary')
              }
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {TABS.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`panel-${t.id}`}
          aria-labelledby={`tab-${t.id}`}
          hidden={t.id !== active}
          className="mt-6"
        >
          {/* Mounted only when active so a hidden tool never fires a request or holds state. */}
          {t.id === active && t.id === 'screen' && (
            <AuditConsole key={replay?.id || 'default'} initialSource={replay?.input} />
          )}
          {t.id === active && t.id === 'fuzz' && <FuzzTool />}
          {t.id === active && t.id === 'tx' && <TxExplainer />}
        </div>
      ))}
    </section>
  )
}
