/*
 * jw3b.dev v2 — KTHULHU Overmind pipeline model  ·  creative-technologist
 *
 * NON-3D by design: the approved direction locks anti-spectacle / no-3D / flat engineered panels,
 * so this is NFR-03's "non-3D fallback" promoted to the primary rendering.
 *
 * ✎ REBUILT 2026-08-22 (second pass — the first was wrong twice over).
 *
 *   v1 invented thirteen stage names. Their SEMANTICS were audit-domain and correct in spirit
 *   (severity labels, first-pass findings, "does the exploit actually run", human sign-off), but
 *   no such stage list exists in KTHULHU.
 *
 *   v2 replaced them with the DSDM lifecycle from MB-agentic — a DIFFERENT product that is also
 *   called "Overmind". That was worse: real phases, wrong system. "Overmind" names two things in
 *   this portfolio (KTHULHU Overmind, the auditor at kthulhu.co; and the MB-agentic orchestration
 *   engine), and discriminating on the NAME rather than on what the stages describe is what
 *   produced the error.
 *
 * This is KTHULHU's real pipeline, transcribed from `mas/audits/KTHULHU_INFRA_AUDIT.md` §2 —
 * itself read from `lib/ui/display.ts` (PIPELINE_STEPS, STEP_META) and `lib/engine/phases/`.
 * Four phases, ~20 recorded steps, across TWO LANES: Cloudflare orchestration and box execution.
 *
 * Why two lanes matter to a visitor: "multi-agent pipeline" is a claim every AI product makes.
 * "Cloudflare Workers orchestrating containerised Foundry/Halmos/Medusa jobs on self-hosted
 * infrastructure, with deadline budgets and watchdog re-enqueue" is one almost nobody can make.
 */

/** Where a step actually executes. The lane IS the differentiator — never collapse it. */
export const LANES = Object.freeze({ CLOUD: 'cloud', BOX: 'box' })

/**
 * The four phases and their steps. `lane` is where the step runs; `gate` marks the two real
 * gates. Step names are KTHULHU's own, not paraphrases.
 */
export const OVERMIND_PHASES = Object.freeze([
  {
    id: 'triage',
    label: 'Triage',
    note: 'Cloud orchestrates; Slither runs on the box.',
    steps: [
      { id: 'attack-surface-scoping', label: 'Attack-surface scoping', lane: LANES.CLOUD },
      { id: 'static-grounding', label: 'Static grounding (Slither + RAG context)', lane: LANES.BOX },
    ],
  },
  {
    id: 'ensemble',
    label: 'Ensemble',
    note: 'Mixed: discovery jobs on the box, kill-gate and consolidation in the cloud.',
    steps: [
      { id: 'box-ensemble', label: 'Box ensemble', lane: LANES.BOX },
      { id: 'claude-discovery', label: 'Claude discovery', lane: LANES.BOX },
      { id: 'static-adjudication', label: 'Static adjudication', lane: LANES.BOX },
      { id: 'primary-audit', label: 'Primary audit', lane: LANES.CLOUD },
      { id: 'adversary-pass', label: 'Adversary pass', lane: LANES.CLOUD },
      { id: 'cross-contract', label: 'Cross-contract', lane: LANES.CLOUD },
      { id: 'scenario-decomposition', label: 'Scenario decomposition', lane: LANES.BOX },
      { id: 'per-function', label: 'Per-function', lane: LANES.CLOUD },
      { id: 'rag-pattern-match', label: 'RAG pattern match', lane: LANES.CLOUD },
      { id: 'red-team-review', label: 'Red-team review', lane: LANES.CLOUD },
      { id: 'kill-gate-vote', label: 'Kill-gate vote', lane: LANES.CLOUD, gate: 'kill' },
      { id: 'consolidation', label: 'Consolidation', lane: LANES.CLOUD },
      { id: 'submit-findings', label: 'Submit findings', lane: LANES.CLOUD },
      { id: 'static-ledger-pull', label: 'Static ledger pull', lane: LANES.CLOUD },
    ],
  },
  {
    id: 'verification',
    label: 'Verification',
    note: 'Entirely on the box — forge, halmos, medusa, anvil in rootless-Podman containers.',
    steps: [
      { id: 'fuzzing-campaign', label: 'Fuzzing campaign', lane: LANES.BOX },
      { id: 'proof-generation', label: 'Proof generation', lane: LANES.BOX },
      { id: 'fv-dispatch', label: 'FV dispatch', lane: LANES.BOX, async: true },
    ],
  },
  {
    id: 'reporting',
    label: 'Reporting',
    note: 'Cloud. The review gate decides whether the report may be delivered at all.',
    steps: [
      { id: 'report-generation', label: 'Report generation', lane: LANES.CLOUD },
      { id: 'review-gate', label: 'Review gate', lane: LANES.CLOUD, gate: 'review' },
    ],
  },
])

/** Flat step list in execution order. */
export const OVERMIND_STEPS = Object.freeze(
  OVERMIND_PHASES.flatMap((p) => p.steps.map((s) => ({ ...s, phase: p.id, phaseLabel: p.label }))),
)

export const TOTAL_STEPS = OVERMIND_STEPS.length

/**
 * What each gate actually does. Both are transcribed, not summarised — the asymmetry of the kill
 * gate and the derived-ness of the review gate are the parts that are hard to claim falsely.
 */
export const GATES = Object.freeze({
  kill: {
    label: 'Kill gate',
    mechanism: 'N decorrelated critic passes vote UPHOLD or REFUTE on every candidate finding.',
    outcome: 'A majority-refute drops the candidate as dropped_fp — with the refutation reason persisted, never silently lost.',
    asymmetry: 'Deliberately asymmetric: REFUTE only when you can name the specific reason. A false negative is far worse than a false positive a human reviewer later dismisses.',
    scope: 'Deep tier only; the rush tier keeps the single-pass path.',
  },
  review: {
    label: 'Review gate',
    mechanism: 'Terminal status is DERIVED from the findings, never stored independently.',
    outcome: 'Any unconfirmed CRITICAL or HIGH ⇒ awaiting_review, and report delivery is HELD. Otherwise complete, and the report is deliverable.',
    asymmetry: 'This is the human-oversight hold: awaiting_review means the audit found something serious, not that it stalled.',
    scope: 'Every audit.',
  },
})

/**
 * Per-job runtime budgets (minutes). A job still running past its deadline is re-enqueued by the
 * watchdog with a FRESH deadline — so a long tool is slow, not lost.
 */
export const DEADLINES_MIN = Object.freeze({
  fv: 90, medusa: 90, anvil: 90, fuzz: 60,
  'static-adjudication': 45, ensemble: 45,
  'claude-discovery': 30, 'scenario-decomposition': 30,
  slither: 20, builder: 15,
})

/** Status of a step at the current position. @returns {'done'|'running'|'pending'} */
export function stepStatus(index, step) {
  if (index < step) return 'done'
  if (index === step) return 'running'
  return 'pending'
}

export function advance(step, total = TOTAL_STEPS) {
  return Math.min(step + 1, total)
}
export function reset() {
  return 0
}
export function isComplete(step, total = TOTAL_STEPS) {
  return step >= total
}

/** Detail for a step index, including its gate when it is one. */
export function stepDetail(index) {
  const s = OVERMIND_STEPS[index]
  return s ? { ...s, index, gateDetail: s.gate ? GATES[s.gate] : null } : null
}

/** How many of the two real gates have been passed. */
export function gatesPassed(step) {
  return OVERMIND_STEPS.filter((s, i) => s.gate && i < step).length
}
export function gateCount() {
  return OVERMIND_STEPS.filter((s) => s.gate).length
}

/** Steps executed on a given lane — the two-lane split, countable rather than asserted. */
export function laneSteps(lane) {
  return OVERMIND_STEPS.filter((s) => s.lane === lane)
}

/** Progress within one phase, so the stepper can show where it is without a global bar only. */
export function phaseProgress(phaseId, step) {
  const idx = OVERMIND_STEPS.map((s, i) => ({ s, i })).filter(({ s }) => s.phase === phaseId)
  if (idx.length === 0) return null
  const done = idx.filter(({ i }) => i < step).length
  return { done, total: idx.length, active: idx.some(({ i }) => i === step) }
}
