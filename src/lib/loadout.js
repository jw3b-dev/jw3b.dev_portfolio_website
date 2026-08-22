/*
 * jw3b.dev v2 — Mission Control loadout engine (P1-18 · FR-029/FR-030/BR-12)  ·  domain-engine
 * Pure client-side logic behind the /hire-me configurator. No I/O, no React: it takes the
 * wizard's captured selections and returns the recommended loadout so the UI (P1-17/P1-19) can
 * render it. The Worker's engagement route re-derives price authoritatively on submit (BR-12);
 * this module is the *display* half of the same contract and must never disagree with it.
 *
 * The two domain rules this file exists to enforce:
 *  - FR-029 — Step 2 (ASSESSMENT) is NON-DECORATIVE: the answers move the recommendation. Here
 *    they produce a scored `recommendEngagement()` and a derived `indicativeScope()`; change an
 *    answer and the recommended tier and/or scope change.
 *  - FR-030 / BR-12 — every price string is COPIED FROM retainer.json. `priceLabel()` reads only
 *    the catalog; an unprovisioned tier states so honestly and NEVER emits a free-typed number.
 * All business rules live in the named tables below (not inline), so a rule change is an edit to
 * data, not archaeology through logic.
 */
import RETAINER from '../data/retainer.json'

export const OBJECTIVES = ['security', 'engineering', 'pm']
export const ENGAGEMENTS = ['project', 'retainer']

// FR-029 rule table — how each assessment answer votes for an engagement SHAPE.
// A "shipped, exploring" system wants ongoing coverage (retainer); an "urgent" or early-stage
// piece of work is a time-boxed project. Weights are transparent and tunable in one place.
export const ENGAGEMENT_WEIGHTS = Object.freeze({
  stage: {
    idea: { project: 2 },
    building: { project: 1 },
    shipped: { retainer: 2 },
  },
  surface: {
    contracts: { project: 1 },
    agentic: {},
    both: { retainer: 1 },
  },
  urgency: {
    exploring: { retainer: 2 },
    weeks: { project: 1 },
    urgent: { project: 2 },
  },
})

// Human-readable scope fragments per assessment answer (FR-029 "indicative scope").
const SCOPE_FRAGMENTS = Object.freeze({
  surface: {
    contracts: 'Solidity / EVM contract review',
    agentic: 'Agentic / AI pipeline architecture',
    both: 'Contracts + agentic system, end to end',
  },
  stage: {
    idea: 'Greenfield — spec through implementation',
    building: 'In-flight — integrate mid-build',
    shipped: 'Live system — audit and hardening',
  },
  urgency: {
    exploring: 'No fixed deadline — scoped on the call',
    weeks: 'Multi-week delivery window',
    urgent: 'Expedited, time-critical engagement',
  },
})

const ASSESSMENT_KEYS = ['stage', 'surface', 'urgency']

/**
 * Look up the single catalog tier for an (objective × engagement) pair. The catalog holds exactly
 * one tier per pair; returns null if either is missing/unknown. Pure lookup over retainer.json.
 */
export function lookupTier(objective, engagement) {
  if (!objective || !engagement) return null
  return RETAINER.tiers.find((t) => t.objective === objective && t.engagement === engagement) || null
}

/**
 * FR-029 — score the assessment answers into a recommended engagement SHAPE. Non-decorative:
 * different answers yield a different winner. Ties resolve to 'project' (the book-a-call floor's
 * safer default — a fixed scope commits less than an open-ended retainer). Returns an object with
 * the winner, the raw scores, and the dominant signal (audit trail, domain rule 6).
 */
export function recommendEngagement(assessment = {}) {
  const scores = { project: 0, retainer: 0 }
  let topSignal = null
  let topWeight = 0
  for (const key of ASSESSMENT_KEYS) {
    const answer = assessment[key]
    const votes = ENGAGEMENT_WEIGHTS[key]?.[answer]
    if (!votes) continue
    for (const [shape, weight] of Object.entries(votes)) {
      scores[shape] += weight
      if (weight > topWeight) {
        topWeight = weight
        topSignal = { key, answer, shape }
      }
    }
  }
  const recommended = scores.retainer > scores.project ? 'retainer' : 'project'
  return { recommended, scores, topSignal }
}

/*
 * FR-029/FR-030 (brief 08, next-need 3) — WHY this recommendation, answer by answer.
 *
 * `recommendEngagement` already scored the assessment and `resolveLoadout` already built a one-line
 * `rationale`; both were computed and then discarded by the UI, so the configurator presented a
 * conclusion with no derivation. A visitor could not see which of their own answers moved it.
 *
 * Note what this does NOT explain: the PRICE. No tier in retainer.json is price-provisioned, so
 * `priceLabel` honestly returns "sized on the call" and there is no figure to derive. Explaining a
 * number that does not exist would be the opposite of the fix.
 *
 * Returns one row per answer that carried weight, heaviest first, with ties broken by the fixed
 * key order so the same answers always render in the same sequence.
 */
export function explainRecommendation(assessment = {}) {
  const rows = []
  for (const key of ASSESSMENT_KEYS) {
    const answer = assessment[key]
    const votes = ENGAGEMENT_WEIGHTS[key]?.[answer]
    if (!votes) continue
    for (const [shape, weight] of Object.entries(votes)) {
      if (!weight) continue
      rows.push({ key, answer, shape, weight })
    }
  }
  // Heaviest contribution first; ASSESSMENT_KEYS order is the stable tie-break.
  return rows.sort((a, b) => b.weight - a.weight || ASSESSMENT_KEYS.indexOf(a.key) - ASSESSMENT_KEYS.indexOf(b.key))
}

/**
 * FR-029 — derive the indicative scope lines from the assessment. Order is stable
 * (surface → stage → urgency) so the same answers always render the same scope.
 */
export function indicativeScope(assessment = {}) {
  const order = ['surface', 'stage', 'urgency']
  return order
    .map((key) => SCOPE_FRAGMENTS[key]?.[assessment[key]])
    .filter(Boolean)
}

/**
 * FR-030 / BR-12 — the price string, COPIED FROM retainer.json. A provisioned tier renders its
 * catalog `indicative_price` + catalog currency; an unprovisioned one states the honest floor.
 * Never returns a free-typed number. `provisioned` lets the UI style the two cases distinctly.
 */
export function priceLabel(tier) {
  if (tier && tier.price_provisioned && tier.indicative_price) {
    return { text: `${tier.indicative_price} ${RETAINER.currency}`, provisioned: true }
  }
  return { text: 'Sized honestly on the call — no template number.', provisioned: false }
}

/**
 * Compose the full loadout for the configurator's final step. `engagement` is the user's Step-3
 * choice; when absent, the assessment-recommended shape is used so the loadout is never empty.
 * Returns the resolved tier, the indicative scope, the provenance-safe price, the recommended
 * shape (so the UI can flag it in Step 3), and a one-line rationale.
 */
export function resolveLoadout({ objective, engagement, assessment = {} } = {}) {
  const recommendation = recommendEngagement(assessment)
  const chosenEngagement = engagement || recommendation.recommended
  const tier = lookupTier(objective, chosenEngagement)
  const scope = indicativeScope(assessment)
  const price = priceLabel(tier)

  const rationale = recommendation.topSignal
    ? `Recommended a ${recommendation.recommended} because “${recommendation.topSignal.answer}” points that way.`
    : 'Answer the assessment to tune the recommendation.'

  return {
    tier,
    scope,
    price,
    recommendedEngagement: recommendation.recommended,
    engagementScores: recommendation.scores,
    rationale,
  }
}
