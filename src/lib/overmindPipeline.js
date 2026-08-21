/*
 * jw3b.dev v2 — Overmind steppable pipeline model (P2-11 · FR-006)  ·  creative-technologist
 * NON-3D by design: the approved direction locks anti-spectacle / no-3D / flat engineered
 * panels, so this is NFR-03's "non-3D fallback" promoted to the primary rendering. PURE
 * model of the Overmind agent pipeline as a STEPPABLE object — a sequence of stages, some of
 * which are zero-trust validation GATES that visibly pass as you step through it (systems-are-
 * graphs; a validated pipeline you operate, not a static diagram). No number is asserted here;
 * the stage count is consistent with the cleared "13-phase pipeline" claim (CR-06).
 */

export const OVERMIND_STAGES = Object.freeze([
  { id: 'ingest', label: 'Ingest', gate: false },
  { id: 'classify', label: 'Classify', gate: true },
  { id: 'retrieve', label: 'Retrieve', gate: false },
  { id: 'plan', label: 'Plan', gate: true },
  { id: 'draft', label: 'Draft', gate: false },
  { id: 'critique', label: 'Critique', gate: true },
  { id: 'revise', label: 'Revise', gate: false },
  { id: 'validate', label: 'Validate', gate: true },
  { id: 'test', label: 'Test', gate: true },
  { id: 'govern', label: 'Govern', gate: true },
  { id: 'approve', label: 'Approve', gate: true },
  { id: 'record', label: 'Record', gate: false },
  { id: 'deliver', label: 'Deliver', gate: false },
])

export const TOTAL_STEPS = OVERMIND_STAGES.length

/**
 * Status of a stage at the current step. `step` is how many stages have been validated so far
 * (0…TOTAL): a stage the pipeline has moved past is `passed` (its gate cleared), the current
 * one is `validating`, everything ahead is `pending`.
 * @returns {'passed'|'validating'|'pending'}
 */
export function stageStatus(index, step) {
  if (index < step) return 'passed'
  if (index === step) return 'validating'
  return 'pending'
}

/** Advance the pipeline — the current stage's gate passes (zero-trust: one stage at a time). */
export function advance(step, total = TOTAL_STEPS) {
  return Math.min(step + 1, total)
}
export function stepBack(step) {
  return Math.max(step - 1, 0)
}
export function reset() {
  return 0
}

/** The whole pipeline is validated when every stage has passed. */
export function isComplete(step, total = TOTAL_STEPS) {
  return step >= total
}

/** How many zero-trust GATES have passed by the current step — the visible trust progress. */
export function gatesPassed(step) {
  return OVERMIND_STAGES.filter((s, i) => s.gate && i < step).length
}

/** Total number of gates in the pipeline. */
export function gateCount() {
  return OVERMIND_STAGES.filter((s) => s.gate).length
}

/*
 * What each stage actually EMITS, and what each gate actually CHECKS.
 *
 * The stepper showed thirteen labels advancing, which demonstrates that a pipeline has stages —
 * something nobody doubted. The interesting claim is the zero-trust one: that work is REJECTED at
 * gates rather than waved through. That claim needs the detail, and it needs the rejection path.
 */
export const STAGE_DETAIL = Object.freeze({
  ingest: { emits: 'Normalised source + metadata', check: null },
  classify: { emits: 'Domain + severity labels', check: 'Is this in scope, and correctly typed?' },
  retrieve: { emits: 'Ranked context from the graph', check: null },
  plan: { emits: 'Ordered work plan', check: 'Does the plan cover every classified item?' },
  draft: { emits: 'First-pass findings', check: null },
  critique: { emits: 'Adversarial review notes', check: 'Does any finding fail to reproduce?' },
  revise: { emits: 'Findings, corrected', check: null },
  validate: { emits: 'Schema + citation check', check: 'Does every finding cite real evidence?' },
  test: { emits: 'Executed proofs', check: 'Does the exploit actually run?' },
  govern: { emits: 'Policy + budget audit', check: 'Within token budget and policy limits?' },
  approve: { emits: 'Human-in-the-loop decision', check: 'Has a person signed this off?' },
  record: { emits: 'Immutable run record', check: null },
  deliver: { emits: 'Report + API payload', check: null },
})

/** Detail for a stage index, or null if out of range. */
export function stageDetail(index) {
  const stage = OVERMIND_STAGES[index]
  return stage ? { ...stage, ...STAGE_DETAIL[stage.id] } : null
}

/**
 * Where a rejected gate sends the work back to.
 *
 * Not to the start — that is the naive model, and it is wrong. A gate rejects for a reason, and
 * the reason names the earliest stage whose OUTPUT is now suspect. Critique failing means the
 * draft was wrong, so you redraft; validate failing means citations are wrong, so you revise.
 * @returns {number} index of the stage to return to
 */
export function reworkTarget(gateIndex) {
  const stage = OVERMIND_STAGES[gateIndex]
  if (!stage || !stage.gate) return 0
  const REWORK = { classify: 'ingest', plan: 'classify', critique: 'draft', validate: 'revise', test: 'revise', govern: 'plan', approve: 'revise' }
  const target = REWORK[stage.id]
  const idx = OVERMIND_STAGES.findIndex((s) => s.id === target)
  return idx < 0 ? 0 : idx
}

/**
 * Reject at the gate the pipeline is currently sitting on.
 *
 * Returns the step the run falls back to, plus what happened — so the UI can show a rejection as
 * a real state rather than an error message. A gate that cannot be seen rejecting is decoration.
 * @returns {{step:number, rejectedAt:number, returnedTo:number}|null} null if not on a gate
 */
export function rejectAt(step) {
  const stage = OVERMIND_STAGES[step]
  if (!stage || !stage.gate) return null
  const returnedTo = reworkTarget(step)
  return { step: returnedTo, rejectedAt: step, returnedTo }
}

