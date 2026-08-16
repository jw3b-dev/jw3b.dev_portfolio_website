import conciergeIntro from './concierge-intro.json'

/*
 * Tier-2 recorded runs BUNDLED INTO THE SPA (ADR-01, SDD 02 §7).
 * This is an INDEPENDENT failure domain from the Worker's Tier-1 KV/R2 store: if the
 * Worker itself is unreachable, these still load straight from the app bundle, so a
 * visitor always sees a labelled, dated recorded run rather than a dead surface (BR-03).
 *
 * SEED set — synthetic-data (SD) expands it with real recorded runs later. Every run
 * renders with a visible "recorded run" label + capture date; numbers inside a run
 * must still trace to the evidence register (DE-07).
 */
export const RECORDED_RUNS = {
  [conciergeIntro.key]: conciergeIntro,
}

export const RECORDED_RUN_KEYS = Object.keys(RECORDED_RUNS)
