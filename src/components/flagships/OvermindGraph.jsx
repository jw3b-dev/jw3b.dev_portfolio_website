/*
 * jw3b.dev v2 — Overmind flagship: the governed engine (FR-006)  ·  creative-technologist
 * NON-3D per the approved design lock (anti-spectacle / flat cyan engineered panels).
 *
 * ✎ REBUILT 2026-08-22, third and final pass. The first three attempts all rendered the WRONG
 * SYSTEM: v1 invented thirteen stage names (from a claim that turns out to be a mis-transcription),
 * v2 used this engine's real DSDM lifecycle and I wrongly rejected it as "wrong system", v3
 * "corrected" onto `kthulhu-overmind` — a Worker inside a different product that shares the word.
 * The owner ended it in five words: "no overmind is the engine." The site's own hero
 * (Hero.jsx:246, "Overmind GenAI engine") and the evidence register had said so the entire time.
 * Full account: `mas/audits/OVERMIND_ATTRIBUTION_2026-08-22.md`.
 *
 * WHY THIS SHAPE. Brief 04 asks for a steppable pipeline where "each gate visibly passes its
 * zero-trust check before the next lights". The real engine does better than the invention could:
 * its gate can also REFUSE. So the operable moment here is not watching gates go green — it is
 * breaking one of the three halting principles and watching the lifecycle STOP, with the engine's
 * own reason printed. A governance engine that only ever says yes is a diagram.
 *
 * The rule set, severities and halt semantics are transcribed with citations
 * (see overmindGovernance.js); the state is a visitor-editable sandbox, and the card says so
 * rather than implying a live fleet connection.
 *
 * Reduced-motion safe; the only motion is a token-driven colour transition. Semantic tokens only.
 */
import { useState } from 'react'
import {
  OVERMIND_PHASES,
  PRINCIPLES,
  TOTAL_PHASES,
  SEVERITY,
  DEFAULT_CONTEXT,
  checkPrinciples,
  advancePhase,
  resetPhase,
  phaseStatus,
  phaseAt,
  haltingPrinciples,
} from '../../lib/overmindGovernance.js'
import Claim from '../Claim.jsx'

const PHASE_TONE = {
  done: 'border-verified/50 text-verified',
  active: 'border-cyan text-cyan',
  pending: 'border-hairline text-content-muted',
}

// Only the three EXCEPTION principles get a switch. Offering seven toggles would bury the point;
// these are the ones whose failure changes the OUTCOME rather than the commentary.
const SWITCHES = haltingPrinciples().map((p) => ({ field: p.field, number: p.number, name: p.name }))

export default function OvermindGraph() {
  const [phase, setPhase] = useState(0)
  const [context, setContext] = useState(DEFAULT_CONTEXT)
  const [halt, setHalt] = useState(null)

  const current = phaseAt(phase)
  const complete = phase >= TOTAL_PHASES
  const verdict = current ? checkPrinciples(context, current.id) : null

  const step = () => {
    const next = advancePhase(phase, context)
    setHalt(next.halted ? next.exceptions : null)
    setPhase(next.index)
  }

  const toggle = (field) => {
    setContext((c) => ({ ...c, [field]: !c[field] }))
    setHalt(null)
  }

  const restart = () => {
    setPhase(resetPhase())
    setContext(DEFAULT_CONTEXT)
    setHalt(null)
  }

  return (
    <section aria-labelledby="overmind-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · the engine beneath the work</p>
          <h3 id="overmind-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Overmind</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted" aria-live="polite">
          phase {Math.min(phase + 1, TOTAL_PHASES)} of {TOTAL_PHASES}
        </p>
      </div>

      <p className="mb-3 text-sm text-content-secondary">
        An agent fleet governed by AgilePM/DSDM, where the governance is <span className="text-content-primary">executable</span>.
        Every phase exit runs an eight-principle predicate sweep; three of the eight are
        EXCEPTION-severity and <span className="text-content-primary">halt the transition</span>. Agents cannot vote
        their own work through — the sovereign verbs sit behind an operator wall.
      </p>

      <p className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
        <Claim id="overmind-pipeline" />
        <span className="text-content-muted">·</span>
        <Claim id="overmind-governance-tests" />
        <span className="text-content-muted">·</span>
        <Claim id="overmind-corpus" />
      </p>

      {/* The lifecycle. `lifecycle.ts:20` order, exactly — the engine's own test asserts this array. */}
      <ol className="flex flex-wrap gap-1.5">
        {OVERMIND_PHASES.map((p, i) => {
          const status = phaseStatus(i, phase)
          return (
            <li
              key={p.id}
              aria-current={status === 'active' ? 'step' : undefined}
              className={`rounded-sm border bg-void/40 px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors ${PHASE_TONE[status]}`}
            >
              {p.label}
              {p.gateProducts.length > 0 && <span className="ml-1.5 text-content-muted" aria-label="has an exit gate">▸</span>}
            </li>
          )
        })}
      </ol>

      {/* The gate readout for the phase being exited. */}
      {current && verdict && (
        <div className="mt-4 rounded-md border border-hairline bg-void p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            Exit gate · {current.label}
            {current.gateProducts.length > 0 ? (
              <span className="ml-2 text-content-secondary">baseline required: {current.gateProducts.join(', ')}</span>
            ) : (
              <span className="ml-2 text-content-secondary">increment-driven — no product gate</span>
            )}
          </p>

          <ul className="mt-2 space-y-1">
            {verdict.checks.map((c) => (
              <li key={c.principle} className="flex items-baseline gap-2 text-[13px]">
                <span
                  className={`font-mono text-[11px] ${c.ok ? 'text-verified' : c.severity === SEVERITY.EXCEPTION ? 'text-failed' : 'text-caution'}`}
                >
                  {c.ok ? '✓' : c.severity === SEVERITY.EXCEPTION ? '✕' : '!'}
                </span>
                <span className={c.inForce ? 'text-content-secondary' : 'text-content-muted'}>
                  <span className="font-mono text-[11px] text-content-muted">{c.number}</span> {c.name}
                  {!c.inForce && <span className="ml-1 text-content-muted">— not in force this phase</span>}
                  {!c.ok && <span className="block text-content-primary">{c.detail}</span>}
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-2 font-mono text-[11px] uppercase tracking-label">
            {verdict.gateAllowed ? (
              <span className="text-verified">gate allowed</span>
            ) : (
              <span className="text-failed">gate halted — {verdict.exceptions.length} exception{verdict.exceptions.length === 1 ? '' : 's'}</span>
            )}
            {verdict.gateAllowed && !verdict.ok && (
              <span className="ml-2 text-caution">with {verdict.violations.length} coaching signal{verdict.violations.length === 1 ? '' : 's'}</span>
            )}
          </p>
        </div>
      )}

      {halt && (
        <p role="status" className="mt-3 rounded-md border border-failed/50 bg-void p-3 text-sm text-content-primary">
          <span className="font-mono text-[11px] uppercase tracking-label text-failed">Transition refused. </span>
          The gate did not advance, and the engine ledgers this as a Management-by-Exception rather than
          failing quietly. Clear the exception, or descope — quality is the one thing that never flexes.
        </p>
      )}

      {complete && (
        <p role="status" className="mt-3 text-sm text-content-secondary">
          Lifecycle complete — every gate crossed with no EXCEPTION-severity violation.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={step}
          disabled={complete}
          className="rounded-sm border border-cyan px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-cyan hover:bg-cyan/10 disabled:border-hairline disabled:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          {halt ? 'Retry the gate' : 'Step the lifecycle'}
        </button>
        <button
          type="button"
          onClick={restart}
          className="rounded-sm border border-hairline px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-content-secondary hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Reset
        </button>
      </div>

      {/* The operable moment: break a halting principle, step, watch it refuse. */}
      <fieldset className="mt-4 rounded-md border border-hairline p-3">
        <legend className="px-1 font-mono text-[10px] uppercase tracking-label text-content-muted">
          Break a principle — the three that halt
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SWITCHES.map((s) => (
            <label key={s.field} className="flex items-center gap-2 text-[13px] text-content-secondary">
              <input
                type="checkbox"
                checked={context[s.field] === false}
                onChange={() => toggle(s.field)}
                className="accent-current"
              />
              <span>
                <span className="font-mono text-[11px] text-content-muted">{s.number}</span> {s.name} fails
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <p className="mt-3 text-[13px] text-content-muted">
        The eight principles, their severities and the halt rule are transcribed from the engine
        (<span className="font-mono text-[11px]">principles.ts</span>,{' '}
        <span className="font-mono text-[11px]">lifecycle.ts</span>) with the predicates simplified to
        one switch each. It is a transcription you can operate — not a live connection to a running
        fleet, and not a claim that one is running right now.{' '}
        <span className="text-content-secondary">
          {PRINCIPLES.length} principles · {SWITCHES.length} of them halting.
        </span>
      </p>
    </section>
  )
}
