/*
 * jw3b.dev v2 — Overmind steppable pipeline (FR-006)  ·  creative-technologist
 * NON-3D per the approved design lock (anti-spectacle / flat cyan engineered panels) — this
 * is NFR-03's non-3D fallback as the primary rendering; there is no src/three/.
 *
 * ✎ REWRITTEN 2026-08-22 alongside the model. This used to step through thirteen invented stage
 * names, and advancing always worked — a gate that always passes demonstrates nothing. It now
 * renders Overmind's real DSDM lifecycle, and the gate genuinely REFUSES: you cannot step past
 * Feasibility, Foundations or Deployment until their products are baselined, and the refusal
 * names which ones are missing. Baseline them and the same button starts working.
 *
 * Reduced-motion safe; the only motion is a token-driven colour transition. Semantic tokens only.
 */
import { useState } from 'react'
import {
  OVERMIND_PHASES,
  TOTAL_PHASES,
  TIMEBOX_PHASES,
  phaseStatus,
  advance,
  reset,
  isComplete,
  gatesPassed,
  gateCount,
  phaseDetail,
  evaluatePhaseGate,
  seedTasks,
  baseline,
} from '../../lib/overmindPipeline.js'

const STATUS_TONE = {
  passed: 'border-verified/50 text-verified',
  active: 'border-cyan text-cyan',
  pending: 'border-hairline text-content-muted',
}

export default function OvermindGraph() {
  const [step, setStep] = useState(0)
  const [baselined, setBaselined] = useState([])
  // The last refusal, so a gate can be SEEN blocking work rather than only clearing it.
  const [refusal, setRefusal] = useState(null)

  const complete = isComplete(step)
  const detail = phaseDetail(step)
  const gate = evaluatePhaseGate(step, baselined)
  const outstanding = seedTasks(step, baselined)

  return (
    <section aria-labelledby="overmind-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · governed lifecycle</p>
          <h3 id="overmind-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Overmind</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted" aria-live="polite">
          {gatesPassed(step)}/{gateCount()} gates cleared · phase {Math.min(step + 1, TOTAL_PHASES)} of {TOTAL_PHASES}
        </p>
      </div>

      <p className="mb-4 text-sm text-content-secondary">
        A DSDM/AgilePM lifecycle run by agents. Three of the six phases carry a governance gate:
        the project cannot leave one until its products are <span className="text-content-primary">baselined</span>.
        Try stepping past a gate before baselining, and watch it refuse.
      </p>

      {/* The lifecycle as flat engineered panels. */}
      <ol className="flex flex-wrap gap-2">
        {OVERMIND_PHASES.map((phase, i) => {
          const status = phaseStatus(i, step)
          const hasGate = phase.gateProducts.length > 0
          return (
            <li
              key={phase.id}
              aria-current={status === 'active' ? 'step' : undefined}
              className={`flex items-center gap-1.5 rounded-sm border bg-void/40 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-label motion-safe:transition-colors ${STATUS_TONE[status]}`}
            >
              <span>{phase.label}</span>
              {hasGate && (
                <span aria-label={status === 'passed' ? 'gate cleared' : status === 'active' ? 'gate active' : 'gate pending'}>
                  {status === 'passed' ? '✓' : status === 'active' ? '⋯' : '·'}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {!complete && detail && (
        <div className="mt-4 rounded-md border border-hairline bg-void p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            Phase {step + 1} · {detail.label}
            {detail.hasGate && <span className="ml-2 text-cyan">governance gate</span>}
          </p>

          <p className="mt-2 text-sm text-content-secondary">
            Activates: <span className="text-content-primary">{detail.roles.join(' · ')}</span>
          </p>

          {/* Products this phase authors. Outstanding ones are baselinable — that is the operable part. */}
          {outstanding.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-content-secondary">Products to baseline:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {outstanding.map((id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setRefusal(null)
                      setBaselined((b) => baseline(b, id))
                    }}
                    className="rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] text-content-secondary motion-safe:transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                  >
                    baseline {id}
                  </button>
                ))}
              </div>
            </div>
          )}

          {detail.hasGate ? (
            <p className="mt-2 text-sm text-content-secondary">
              Gate requires: <span className="text-content-primary">{detail.gateProducts.join(', ')}</span>
              {gate.allowed && <span className="ml-2 text-verified">all baselined ✓</span>}
            </p>
          ) : (
            /* An absent gate and a forgotten gate look identical on a diagram. Say which this is. */
            <p className="mt-2 text-sm text-content-muted">No governance gate — {detail.noGateReason}</p>
          )}

          {detail.id === 'evolutionary' && (
            <p className="mt-2 text-sm text-content-secondary">
              Timeboxes cycle <span className="text-content-primary">{TIMEBOX_PHASES.join(' → ')}</span>; each is
              gated by its own Timebox Review Record.
            </p>
          )}
        </div>
      )}

      {refusal && (
        <div role="status" className="mt-3 rounded-md border border-caution/40 bg-caution/5 p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-caution">Gate refused</p>
          <p className="mt-1 text-sm text-content-secondary">
            The project cannot leave <span className="text-content-primary">{refusal.label}</span> — not baselined:{' '}
            <span className="text-content-primary">{refusal.missing.join(', ')}</span>. The gate names what is
            missing rather than only saying no.
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {!complete ? (
          <button
            type="button"
            onClick={() => {
              const r = advance(step, baselined)
              if (r.advanced) {
                setRefusal(null)
                setStep(r.step)
              } else {
                setRefusal({ label: detail.label, missing: r.missing })
              }
            }}
            className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Leave this phase →
          </button>
        ) : (
          <p className="font-mono text-[12px] uppercase tracking-label text-verified">Lifecycle complete · every gate cleared ✓</p>
        )}
        <button
          type="button"
          onClick={() => {
            setRefusal(null)
            setBaselined([])
            setStep(reset())
          }}
          className="font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary"
        >
          Reset
        </button>
      </div>
    </section>
  )
}
