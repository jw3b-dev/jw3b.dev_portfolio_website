/*
 * jw3b.dev v2 — Overmind: the governed agent-orchestration engine  ·  creative-technologist
 *
 * THE engine. Not KTHULHU's — KTHULHU is a separate product that happens to contain a Worker named
 * `kthulhu-overmind`, and that namesake caused three wrong rebuilds of this flagship before the
 * owner corrected it in five words: "no overmind is the engine". Full history and the resulting
 * standing rule (attribute on the evidence pointer, never on the name) in
 * `mas/audits/OVERMIND_ATTRIBUTION_2026-08-22.md`. KTHULHU's pipeline is in `kthulhuPipeline.js`.
 *
 * WHAT IT IS: an agent fleet governed by AgilePM/DSDM, where the governance is executable. The
 * differentiator is not "multi-agent" — everyone claims that. It is that the phase gate is a
 * PREDICATE SWEEP that can REFUSE, and refusing is the normal, designed outcome.
 *
 * TRANSCRIBED, WITH CITATIONS — every structure below is read from the engine's source, never
 * summarised from a description of it:
 *   - the six phases          → `lifecycle.ts:20`   (its own test asserts the array verbatim:
 *                               `tests-workers/lifecycle.test.ts:12`)
 *   - the exit-gate products  → `lifecycle.ts` PHASE_PLANS[phase].gateProducts
 *   - the eight principles    → `principles.ts` PRINCIPLES (number, name, definition, severity)
 *   - EXCEPTION halts / COACHING proceeds → `principles.ts`, `gateAllowed = exceptions.length === 0`
 *
 * HONESTY BOUNDARY (the card states this too): the predicates here are *faithful but simplified* —
 * each reads one field of a small visitor-editable context, where the engine's own predicate reads
 * projected Director SQLite state. The rule set, the severities and the halt semantics are the
 * engine's; the state is a sandbox. This is a transcription you can operate, NOT a live connection
 * to a running fleet, and it must never be captioned as one.
 *
 * Pure module: no I/O, no state, no clock. Every branch unit-tested.
 */

/** A violation either HALTS a gate or is advisory. `principles.ts`: severity. */
export const SEVERITY = Object.freeze({ EXCEPTION: 'EXCEPTION', COACHING: 'COACHING' })

/**
 * The six DSDM lifecycle phases, in order (`lifecycle.ts:20`). `gateProducts` are the products that
 * must be baselined to EXIT the phase — an empty list means the phase is increment-driven, not
 * product-gated (Evolutionary Development), which is a real property of the model, not a gap.
 */
export const OVERMIND_PHASES = Object.freeze([
  { id: 'PRE_PROJECT', label: 'Pre-Project', gateProducts: ['terms-of-reference'] },
  { id: 'FEASIBILITY', label: 'Feasibility', gateProducts: ['feasibility-assessment'] },
  { id: 'FOUNDATIONS', label: 'Foundations', gateProducts: ['foundations-summary', 'prl', 'delivery-plan'] },
  { id: 'EVOLUTIONARY', label: 'Evolutionary Development', gateProducts: [] },
  { id: 'DEPLOYMENT', label: 'Deployment', gateProducts: ['project-review-report'] },
  { id: 'POST_PROJECT', label: 'Post-Project', gateProducts: [] },
])

export const TOTAL_PHASES = OVERMIND_PHASES.length

/** Index of a phase id in lifecycle order, or -1. */
export function phaseIndex(id) {
  return OVERMIND_PHASES.findIndex((p) => p.id === id)
}

/** The phase at a step position, or null past the end. */
export function phaseAt(index) {
  return OVERMIND_PHASES[index] ?? null
}

/**
 * The eight principles. Names, definitions and severities are `principles.ts` verbatim.
 *
 * `appliesFrom` encodes where the engine's predicate actually starts biting — COLLABORATE is
 * checked "beyond Feasibility", BUILD_INCREMENTALLY "beyond Foundations". A principle that applies
 * everywhere carries null. Getting this wrong would make the demo halt in phases the real engine
 * never halts in, which is the same class of error this whole file exists to correct.
 *
 * `field` is the one context key this simplified predicate reads (see the honesty boundary above).
 */
export const PRINCIPLES = Object.freeze([
  {
    number: 1,
    id: 'FOCUS_ON_BUSINESS_NEED',
    name: 'Focus on the Business Need',
    definition: 'Every decision is driven by the need to deliver real business value; guarantee the Minimum Usable Subset.',
    severity: SEVERITY.COACHING,
    field: 'hasMustRequirement',
    appliesFrom: null,
    violation: 'No MUST requirement — there is no Minimum Usable Subset to guarantee.',
  },
  {
    number: 2,
    id: 'DELIVER_ON_TIME',
    name: 'Deliver on Time',
    definition: 'Time is fixed; scope is the variable. Descope rather than overrun a timebox budget.',
    severity: SEVERITY.COACHING,
    field: 'withinBudget',
    appliesFrom: null,
    violation: 'Timebox is over its token budget and has not descoped.',
  },
  {
    number: 3,
    id: 'COLLABORATE',
    name: 'Collaborate',
    definition: 'Business and technical interests work together; shared ownership, not solo effort.',
    severity: SEVERITY.COACHING,
    field: 'rolesEngaged',
    appliesFrom: 'FOUNDATIONS',
    violation: 'Fewer than two distinct roles engaged — this is solo work.',
  },
  {
    number: 4,
    id: 'NEVER_COMPROMISE_QUALITY',
    name: 'Never Compromise Quality',
    definition: 'Quality is agreed at the start and cannot be reduced later; scope flexes, quality does not.',
    severity: SEVERITY.EXCEPTION,
    field: 'qualityAccepted',
    appliesFrom: null,
    violation: 'A completed timebox carries a FAILED review, or was never accepted fit-for-purpose.',
  },
  {
    number: 5,
    id: 'BUILD_INCREMENTALLY',
    name: 'Build Incrementally from Firm Foundations',
    definition: 'Establish a solid foundation before building the full solution.',
    severity: SEVERITY.EXCEPTION,
    field: 'foundationsBaselined',
    appliesFrom: 'EVOLUTIONARY',
    violation: 'Building beyond Foundations while the foundation milestone products are not baselined.',
  },
  {
    number: 6,
    id: 'DEVELOP_ITERATIVELY',
    name: 'Develop Iteratively',
    definition: 'Accept that all knowledge is incomplete; incorporate feedback every iteration.',
    severity: SEVERITY.COACHING,
    field: 'standUpRecorded',
    appliesFrom: 'EVOLUTIONARY',
    violation: 'A completed timebox captured no stand-up — no iteration feedback was recorded.',
  },
  {
    number: 7,
    id: 'COMMUNICATE_CONTINUOUSLY',
    name: 'Communicate Continuously and Clearly',
    definition: 'Poor communication is the biggest internal risk; work is not done in silence.',
    severity: SEVERITY.COACHING,
    field: 'standUpRecorded',
    appliesFrom: 'EVOLUTIONARY',
    violation: 'The active timebox has no stand-up — work is proceeding in silence.',
  },
  {
    number: 8,
    id: 'DEMONSTRATE_CONTROL',
    name: 'Demonstrate Control',
    definition: 'Be in charge of the work, not at its mercy; exceptions resolved, change under RFC.',
    severity: SEVERITY.EXCEPTION,
    field: 'exceptionsResolved',
    appliesFrom: null,
    violation: 'An unresolved Management-by-Exception signal is open, or a baseline was amended without an RFC.',
  },
])

/** Every principle that can halt a gate. Three of eight — the asymmetry IS the design. */
export function haltingPrinciples() {
  return PRINCIPLES.filter((p) => p.severity === SEVERITY.EXCEPTION)
}

/**
 * The sandbox state the visitor edits. Every key is one principle's field; every default is the
 * compliant value, so an untouched stepper walks the whole lifecycle and a visitor has to
 * deliberately break something to see a refusal.
 */
export const DEFAULT_CONTEXT = Object.freeze({
  hasMustRequirement: true,
  withinBudget: true,
  rolesEngaged: true,
  qualityAccepted: true,
  foundationsBaselined: true,
  standUpRecorded: true,
  exceptionsResolved: true,
})

/** Is this principle in force when exiting `phaseId`? */
export function applies(principle, phaseId) {
  if (!principle.appliesFrom) return true
  const from = phaseIndex(principle.appliesFrom)
  const at = phaseIndex(phaseId)
  return at >= 0 && at >= from
}

/**
 * The gate sweep — the engine's `checkPrinciples`, scoped to the phase being exited.
 * `gateAllowed` is the engine's own rule: exceptions.length === 0. Note that `ok` and `gateAllowed`
 * differ exactly when only COACHING principles are violated, which is the interesting case: the
 * gate proceeds AND the violation is still reported, rather than being swallowed to keep it green.
 */
export function checkPrinciples(context = DEFAULT_CONTEXT, phaseId = OVERMIND_PHASES[0].id) {
  const ctx = { ...DEFAULT_CONTEXT, ...context }
  const checks = PRINCIPLES.map((p) => {
    const inForce = applies(p, phaseId)
    const ok = !inForce || ctx[p.field] !== false
    return { principle: p.id, number: p.number, name: p.name, severity: p.severity, inForce, ok, detail: ok ? null : p.violation }
  })
  const violations = checks.filter((c) => !c.ok)
  const exceptions = violations.filter((c) => c.severity === SEVERITY.EXCEPTION)
  return { ok: violations.length === 0, gateAllowed: exceptions.length === 0, checks, violations, exceptions }
}

/** Convenience: may the gate at `phaseId` be crossed under this context? */
export function canExit(phaseId, context = DEFAULT_CONTEXT) {
  return checkPrinciples(context, phaseId).gateAllowed
}

/**
 * Attempt one phase transition. A blocked attempt returns the SAME index plus the exceptions that
 * held it — a halt is a reported outcome, never a silent no-op, exactly as the engine ledgers a
 * Management-by-Exception rather than failing quietly.
 */
export function advancePhase(index, context = DEFAULT_CONTEXT) {
  const phase = phaseAt(index)
  if (!phase) return { index, halted: false, complete: true, exceptions: [] }
  const verdict = checkPrinciples(context, phase.id)
  if (!verdict.gateAllowed) return { index, halted: true, complete: false, exceptions: verdict.exceptions }
  const next = index + 1
  return { index: next, halted: false, complete: next >= TOTAL_PHASES, exceptions: [] }
}

export function resetPhase() {
  return 0
}

/** Status of a phase at the current position. @returns {'done'|'active'|'pending'} */
export function phaseStatus(index, current) {
  if (index < current) return 'done'
  if (index === current) return 'active'
  return 'pending'
}
