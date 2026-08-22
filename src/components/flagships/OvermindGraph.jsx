/*
 * jw3b.dev v2 — KTHULHU Overmind steppable pipeline (FR-006)  ·  creative-technologist
 * NON-3D per the approved design lock (anti-spectacle / flat cyan engineered panels).
 *
 * ✎ REBUILT 2026-08-22 (second pass). Renders KTHULHU's real four-phase pipeline across its TWO
 * LANES — Cloudflare orchestration and box execution — with its two real gates. See
 * overmindPipeline.js for why the first two attempts were wrong.
 *
 * The lane is the point. Anyone can claim "multi-agent pipeline"; the claim that is hard to fake
 * is that half these steps execute in rootless-Podman containers on self-hosted hardware, under
 * deadline budgets, with watchdog re-enqueue.
 *
 * Reduced-motion safe; the only motion is a token-driven colour transition. Semantic tokens only.
 */
import { useState } from 'react'
import {
  OVERMIND_PHASES,
  OVERMIND_STEPS,
  TOTAL_STEPS,
  LANES,
  stepStatus,
  advance,
  reset,
  isComplete,
  gatesPassed,
  gateCount,
  stepDetail,
  laneSteps,
} from '../../lib/overmindPipeline.js'

const STATUS_TONE = {
  done: 'border-verified/50 text-verified',
  running: 'border-cyan text-cyan',
  pending: 'border-hairline text-content-muted',
}

const LANE_LABEL = {
  [LANES.CLOUD]: 'Cloudflare',
  [LANES.BOX]: 'self-hosted box',
}

export default function OvermindGraph() {
  const [step, setStep] = useState(0)
  const complete = isComplete(step)
  const detail = stepDetail(step)

  return (
    <section aria-labelledby="overmind-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          {/* Heading stays "Overmind" — the flagship IA (FlagshipShowcase §3) names it that, and
              restructuring the four-flagship framing is the owner's call. The attribution rides in
              the eyebrow and the prose instead, so the card cannot be read as a different system. */}
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · KTHULHU&rsquo;s two-lane audit engine</p>
          <h3 id="overmind-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Overmind</h3>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted" aria-live="polite">
          {gatesPassed(step)}/{gateCount()} gates · step {Math.min(step + 1, TOTAL_STEPS)} of {TOTAL_STEPS}
        </p>
      </div>

      <p className="mb-4 text-sm text-content-secondary">
        Four phases, {TOTAL_STEPS} recorded steps, across two lanes:{' '}
        <span className="text-content-primary">{laneSteps(LANES.CLOUD).length} orchestrated on Cloudflare</span> and{' '}
        <span className="text-content-primary">{laneSteps(LANES.BOX).length} executed in containers on self-hosted
        hardware</span> — forge, halmos, medusa, anvil, each under a deadline budget with watchdog re-enqueue.
      </p>

      {/* One block per phase; the lane rides on every step so the split is visible, not asserted. */}
      <ol className="space-y-3">
        {OVERMIND_PHASES.map((phase) => (
          <li key={phase.id}>
            <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">{phase.label}</p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {phase.steps.map((s) => {
                const i = OVERMIND_STEPS.findIndex((x) => x.id === s.id)
                const status = stepStatus(i, step)
                return (
                  <li
                    key={s.id}
                    aria-current={status === 'running' ? 'step' : undefined}
                    className={`flex items-center gap-1.5 rounded-sm border bg-void/40 px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors ${STATUS_TONE[status]}`}
                  >
                    <span>{s.label}</span>
                    {/* The lane marker — a box step and a cloud step must never look identical. */}
                    <span className="text-content-muted" aria-label={`runs on the ${LANE_LABEL[s.lane]}`}>
                      {s.lane === LANES.BOX ? '▪' : '☁'}
                    </span>
                    {s.gate && <span aria-label="gate">{status === 'done' ? '✓' : status === 'running' ? '⋯' : '·'}</span>}
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ol>

      {!complete && detail && (
        <div className="mt-4 rounded-md border border-hairline bg-void p-3">
          <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
            {detail.phaseLabel} · {detail.label}
            <span className="ml-2 text-content-secondary">runs on the {LANE_LABEL[detail.lane]}</span>
            {detail.gateDetail && <span className="ml-2 text-cyan">gate</span>}
          </p>

          {detail.async && (
            <p className="mt-1 text-sm text-content-secondary">
              Dispatched asynchronously — <span className="text-content-primary">the verdict may not land</span>. A
              formal-verification job that does not return in budget leaves the finding unproven rather than proven.
            </p>
          )}

          {detail.gateDetail && (
            <div className="mt-2 space-y-1 text-sm text-content-secondary">
              <p>{detail.gateDetail.mechanism}</p>
              <p className="text-content-primary">{detail.gateDetail.outcome}</p>
              <p className="text-content-muted">{detail.gateDetail.asymmetry}</p>
              <p className="font-mono text-[11px] text-content-muted">Applies to: {detail.gateDetail.scope}</p>
            </div>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-4">
        {!complete ? (
          <button
            type="button"
            onClick={() => setStep((s) => advance(s))}
            className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Step the pipeline →
          </button>
        ) : (
          <p className="font-mono text-[12px] uppercase tracking-label text-verified">
            Pipeline complete · both gates passed ✓
          </p>
        )}
        <button
          type="button"
          onClick={() => setStep(reset())}
          className="font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary"
        >
          Reset
        </button>
      </div>
    </section>
  )
}
