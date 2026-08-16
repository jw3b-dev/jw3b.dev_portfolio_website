/*
 * jw3b.dev v2 — Tier-2 replay loader (client)  ·  domain-engine (P0-10)
 * The SPA-bundled tier of the 3-tier replay/fallback harness (ADR-01, BR-03, NFR-02):
 *   Tier-0 live inference → Tier-1 Worker KV/R2 recorded run → Tier-2 THIS (bundled).
 * The client falls back here when the Worker is unreachable (fetch throws / network
 * error) — an independent failure domain from Tier-1. Pure functions only; the only
 * "I/O" is the static import of the bundled run set, injectable for tests.
 */
import { RECORDED_RUNS } from '../data/recorded-runs/index.js'

export const REPLAY_LABEL = 'Recorded run'

/** The recorded run for a key, or null if none is bundled. */
export function getRecordedRun(key, runs = RECORDED_RUNS) {
  return (key && runs && runs[key]) || null
}

export function isReplayAvailable(key, runs = RECORDED_RUNS) {
  return !!getRecordedRun(key, runs)
}

/**
 * The mandatory visible label for a replay — NEVER render a recorded run without it
 * (BR-03: radical honesty; a replay must be unmistakable and dated). Null for null.
 */
export function replayLabel(run) {
  if (!run) return null
  const date = run.capturedAt ? ` · captured ${run.capturedAt}` : ''
  return `${run.label || REPLAY_LABEL}${date}`
}

/** Normalized render frames; each is tagged source='cached_replay', tier=2. */
export function toReplayFrames(run) {
  if (!run || !Array.isArray(run.frames)) return []
  return run.frames.map((f) => ({
    response: typeof f?.response === 'string' ? f.response : '',
    source: 'cached_replay',
    tier: 2,
  }))
}

/**
 * Full Tier-2 payload the client renders when the Worker is unreachable:
 * a labelled, dated set of frames — or null if this key isn't bundled (dead-end
 * avoided upstream by the caller choosing an available key).
 */
export function loadReplay(key, runs = RECORDED_RUNS) {
  const run = getRecordedRun(key, runs)
  if (!run) return null
  return {
    key: run.key,
    surface: run.surface || null,
    label: replayLabel(run),
    capturedAt: run.capturedAt || null,
    tier: 2,
    source: 'cached_replay',
    frames: toReplayFrames(run),
  }
}
