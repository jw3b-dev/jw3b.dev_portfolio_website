import conciergeIntro from './concierge/intro.json'
import auditIntro from './audit/vault-reentrancy.json'

/*
 * Tier-2 recorded runs BUNDLED INTO THE SPA (ADR-01, SDD 02 §7).
 * This is an INDEPENDENT failure domain from the Worker's Tier-1 KV/R2 store: if the
 * Worker itself is unreachable, these still load straight from the app bundle, so a
 * visitor always sees a labelled, dated recorded run rather than a dead surface (BR-03).
 *
 * P1-16 (synthetic-data): the SEED placeholder is replaced with REAL, verifiably-real runs.
 * - concierge-intro: register-grounded concierge fallback (every figure traces to a cleared
 *   evidence-register entry, DE-07).
 * - audit-intro: the EXACT auditSolidity(SAMPLE_CONTRACT) output (reproduce to verify).
 * Keys match the Worker's Tier-1 KV keys (REPLAY_KEY / AUDIT_REPLAY_KEY) so Tier-1 and
 * Tier-2 stay aligned. Radical-honesty failure artifacts live in ./failures (FR-045).
 * Every run renders with a visible "recorded run" label + capture date.
 */
export const RECORDED_RUNS = {
  [conciergeIntro.key]: conciergeIntro,
  [auditIntro.key]: auditIntro,
}

export const RECORDED_RUN_KEYS = Object.keys(RECORDED_RUNS)
