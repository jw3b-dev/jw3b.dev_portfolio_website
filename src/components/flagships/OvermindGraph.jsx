/*
 * jw3b.dev v2 — Overmind steppable pipeline (P2-11 · FR-006)  ·  creative-technologist
 * NON-3D per the approved design lock (anti-spectacle / flat cyan engineered panels) — this
 * is NFR-03's non-3D fallback as the primary rendering; there is no src/three/. The Overmind
 * agent pipeline is an OPERABLE object: step through it and each stage's zero-trust gate
 * visibly passes (never a static diagram, never decorative-only). Reduced-motion safe; the
 * only motion is a token-driven colour transition on each gate. Semantic tokens only.
 */
import { useState } from 'react'
import { OVERMIND_STAGES, TOTAL_STEPS, stageStatus, advance, reset, isComplete, gatesPassed, gateCount, stageDetail, rejectAt } from '../../lib/overmindPipeline.js'

const STATUS_TONE = {
  passed: 'border-verified/50 text-verified',
  validating: 'border-cyan text-cyan',
  pending: 'border-hairline text-content-muted',
}

export default function OvermindGraph() {
  const [step, setStep] = useState(0)
  // The last rejection, so a gate can be SEEN refusing work rather than only passing it.
  const [rejection, setRejection] = useState(null)
  const complete = isComplete(step)
  const detail = stageDetail(step)

  return (
    <section aria-labelledby="overmind-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · validated pipeline</p>
          <h3 id="overmind-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Overmind</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted" aria-live="polite">
          {gatesPassed(step)}/{gateCount()} gates passed · stage {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
        </p>
      </div>

      {/* The pipeline as flat engineered panels; step through it to validate each stage. */}
      <ol className="flex flex-wrap gap-2">
        {OVERMIND_STAGES.map((stage, i) => {
          const status = stageStatus(i, step)
          return (
            <li
              key={stage.id}
              aria-current={status === 'validating' ? 'step' : undefined}
              className={`flex items-center gap-1.5 rounded-sm border bg-void/40 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-label motion-safe:transition-colors ${STATUS_TONE[status]}`}
            >
              <span>{stage.label}</span>
              {stage.gate && (
                <span aria-label={status === 'passed' ? 'gate passed' : status === 'validating' ? 'validating' : 'gate pending'}>
                  {status === 'passed' ? '✓' : status === 'validating' ? '⋯' : '·'}
                </span>
              )}
            </li>
          )
        })}
      </ol>

      {/*
          What this stage emits, and what its gate checks. Thirteen advancing labels only showed
          that a pipeline has stages — which nobody doubted. The claim worth demonstrating is the
          zero-trust one: that work is rejected at gates rather than waved through.
      */}
      {!complete && detail && (
        <div className="mt-4 rounded-md border border-hairline bg-void p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            Stage {step + 1} · {detail.label}
            {detail.gate && <span className="ml-2 text-cyan">zero-trust gate</span>}
          </p>
          <p className="mt-1 text-sm text-content-secondary">
            Emits: <span className="text-content-primary">{detail.emits}</span>
          </p>
          {detail.check && (
            <p className="mt-1 text-sm text-content-secondary">
              Gate asks: <span className="text-content-primary">{detail.check}</span>
            </p>
          )}
        </div>
      )}

      {rejection && (
        <div role="status" className="mt-3 rounded-md border border-caution/40 bg-caution/5 p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-caution">Gate rejected the work</p>
          <p className="mt-1 text-sm text-content-secondary">
            <span className="text-content-primary">{OVERMIND_STAGES[rejection.rejectedAt].label}</span> refused it, so
            the run returned to{' '}
            <span className="text-content-primary">{OVERMIND_STAGES[rejection.returnedTo].label}</span> — not to the
            start. A gate rejects for a reason, and the reason names the earliest output now in doubt.
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {!complete ? (
          <button
            type="button"
            onClick={() => {
              setRejection(null)
              setStep((s) => advance(s))
            }}
            className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Step the pipeline →
          </button>
        ) : (
          <p className="font-mono text-[12px] uppercase tracking-label text-verified">Pipeline validated end-to-end ✓</p>
        )}
        {/* Only offered ON a gate — you cannot reject at a stage that does not check anything. */}
        {!complete && detail?.gate && (
          <button
            type="button"
            onClick={() => {
              const r = rejectAt(step)
              if (!r) return
              setRejection(r)
              setStep(r.step)
            }}
            className="rounded-md border border-caution/40 px-3 py-2 font-mono text-[11px] uppercase tracking-label text-caution hover:bg-caution/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Fail this gate
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setRejection(null)
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
