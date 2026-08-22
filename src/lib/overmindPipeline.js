/*
 * jw3b.dev v2 — Overmind pipeline model  ·  creative-technologist
 *
 * NON-3D by design: the approved direction locks anti-spectacle / no-3D / flat engineered panels,
 * so this is NFR-03's "non-3D fallback" promoted to the primary rendering.
 *
 * ✎ REWRITTEN 2026-08-22. The previous model listed thirteen stages — ingest, classify, retrieve,
 * plan, draft, critique, revise, validate, test, govern, approve, record, deliver — and those
 * names appear NOWHERE in Overmind's source. They were generic agent-pipeline vocabulary, which is
 * the vocabulary every AI product uses; the thing worth showing is the part almost nobody has.
 *
 * Overmind (the orchestration engine in MB-agentic — NOT KTHULHU, whose product name is also
 * "KTHULHU Overmind") runs a DSDM/AgilePM lifecycle with real governance gates. Every value below
 * is transcribed from its source:
 *   - `.agents/orchestrator/lifecycle.ts:20`   PROJECT_PHASES — the six phases
 *   - `.agents/orchestrator/lifecycle.ts:33`   PHASE_PLANS — roster + products created per phase
 *   - `.agents/orchestrator/products.ts:302`   PHASE_GATES — products that must be BASELINED to exit
 *   - `.agents/orchestrator/products.ts:322`   evaluatePhaseGate — allowed only when none are missing
 *   - `.agents/orchestrator/director.ts:94`    TIMEBOX_PHASES — the cycle inside evolutionary dev
 *
 * The gate semantics are the point. A gate is not a boolean that flips: it evaluates the set of
 * baselined products and, when it refuses, NAMES what is missing. That is a governance gate you
 * can watch refuse, which is the claim the surface is actually making.
 */

/**
 * The six DSDM project phases. `gateProducts` are the products that must be baselined to LEAVE
 * the phase — the empty ones are empty on purpose and the model says why, because a gate that is
 * absent for a documented reason and a gate that was forgotten look identical on a diagram.
 */
export const OVERMIND_PHASES = Object.freeze([
  {
    id: 'pre-project',
    label: 'Pre-project',
    roles: ['business-sponsor', 'project-manager'],
    creates: ['terms-of-reference'],
    gateProducts: [],
    noGateReason: 'The proposal stage produces only the lightweight Terms of Reference — not a baselined governance product.',
  },
  {
    id: 'feasibility',
    label: 'Feasibility',
    roles: ['project-manager', 'business-analyst', 'technical-coordinator'],
    creates: ['feasibility-assessment'],
    gateProducts: ['feasibility-assessment'],
    noGateReason: null,
  },
  {
    id: 'foundations',
    label: 'Foundations',
    roles: ['project-manager', 'business-analyst', 'business-visionary', 'technical-coordinator', 'solution-developer'],
    creates: ['business-case', 'prl', 'sad', 'dad', 'delivery-plan', 'mad', 'foundations-summary'],
    gateProducts: ['foundations-summary', 'prl', 'delivery-plan'],
    noGateReason: null,
  },
  {
    id: 'evolutionary',
    label: 'Evolutionary development',
    roles: ['team-leader', 'solution-developer', 'solution-tester', 'business-ambassador', 'technical-coordinator'],
    creates: ['evolving-solution'],
    gateProducts: [],
    noGateReason: 'Increment-driven, not product-gated — the Timebox Review Records gate individual timeboxes, not the phase.',
  },
  {
    id: 'deployment',
    label: 'Deployment',
    roles: ['project-manager', 'technical-coordinator', 'business-visionary'],
    creates: ['project-review-report'],
    gateProducts: ['project-review-report'],
    noGateReason: null,
  },
  {
    id: 'post-project',
    label: 'Post-project',
    roles: ['business-visionary'],
    creates: ['benefits-assessment'],
    gateProducts: [],
    noGateReason: 'Benefits are assessed after the project closes; there is nothing left to gate.',
  },
])

export const TOTAL_PHASES = OVERMIND_PHASES.length

/**
 * The timebox cycle INSIDE evolutionary development (director.ts:94). Exploration and Engineering
 * are activities within that phase, not phases of their own — lifecycle.ts states this explicitly,
 * and collapsing them into the spine is the mistake that turns six phases into a longer list.
 */
export const TIMEBOX_PHASES = Object.freeze(['Investigation', 'Refinement', 'Consolidation'])

/** Phases that carry a governance gate. */
export function gateCount() {
  return OVERMIND_PHASES.filter((p) => p.gateProducts.length > 0).length
}

/** Products that must be baselined before the project can leave `index`. */
export function phaseGateProducts(index) {
  const phase = OVERMIND_PHASES[index]
  return phase ? phase.gateProducts : []
}

/**
 * The governance gate, mirroring `evaluatePhaseGate`: allowed only when EVERY gate product is
 * baselined, and the refusal names the missing ones rather than just saying no.
 * @returns {{allowed:boolean, missing:string[]}}
 */
export function evaluatePhaseGate(index, baselined = []) {
  const missing = phaseGateProducts(index).filter((id) => !baselined.includes(id))
  return { allowed: missing.length === 0, missing }
}

/**
 * On entering a phase: the products not yet baselined become seeded tasks (planPhaseEntry).
 * A product already baselined in an earlier phase is not re-seeded.
 */
export function seedTasks(index, baselined = []) {
  const phase = OVERMIND_PHASES[index]
  return phase ? phase.creates.filter((id) => !baselined.includes(id)) : []
}

/** Baseline a product. Pure: returns a new array, and re-baselining is a no-op rather than a dupe. */
export function baseline(baselined, productId) {
  return baselined.includes(productId) ? baselined : [...baselined, productId]
}

/**
 * Status of a phase at the current step.
 * @returns {'passed'|'active'|'pending'}
 */
export function phaseStatus(index, step) {
  if (index < step) return 'passed'
  if (index === step) return 'active'
  return 'pending'
}

/**
 * Advance to the next phase — REFUSED when the current phase's gate is unmet. This is the whole
 * demonstration: the stepper cannot be clicked past a governance gate whose products are not
 * baselined, and the refusal carries the reason.
 * @returns {{step:number, advanced:boolean, missing:string[]}}
 */
export function advance(step, baselined = []) {
  if (step >= TOTAL_PHASES) return { step: TOTAL_PHASES, advanced: false, missing: [] }
  const { allowed, missing } = evaluatePhaseGate(step, baselined)
  return allowed ? { step: step + 1, advanced: true, missing: [] } : { step, advanced: false, missing }
}

export function reset() {
  return 0
}

/** Complete when the project has left the final phase. */
export function isComplete(step) {
  return step >= TOTAL_PHASES
}

/** How many governance gates have been cleared by the current step. */
export function gatesPassed(step) {
  return OVERMIND_PHASES.filter((p, i) => p.gateProducts.length > 0 && i < step).length
}

/** Full detail for a phase index, or null when out of range. */
export function phaseDetail(index) {
  const phase = OVERMIND_PHASES[index]
  return phase ? { ...phase, index, hasGate: phase.gateProducts.length > 0 } : null
}
