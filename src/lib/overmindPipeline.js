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
