/*
 * jw3b.dev v2 — Tier-1 replay server (Worker)  ·  domain-engine (P0-10)
 * The KV/R2 tier of the 3-tier replay/fallback harness (ADR-01, BR-03, NFR-02):
 *   Tier-0 live inference → Tier-1 THIS (Worker KV transcript + R2 media) → Tier-2
 *   SPA-bundled runs. When live upstream (Workers AI / Anthropic) is down, the Worker
 *   serves a recorded run from KV instead of failing. If the key isn't recorded here,
 *   serveRecordedRun returns null and the caller signals the client to drop to Tier-2.
 * Body construction is PURE (buildReplayBody) and unit-tested; the KV/R2 reads are the
 * only I/O and are isolated in serveRecordedRun / getReplayMedia.
 */
import { sseFrame, SSE_DONE, SSE_HEADERS } from './tagProtocol.js'

export const REPLAY_LABEL = 'Recorded run'

/** KV key for a recorded transcript. */
export const runKvKey = (key) => `run:${key}`

/**
 * PURE — build the SSE body for a recorded run: a labelled+dated header prefixed onto
 * the first frame (so even a client that ignores headers still shows the label),
 * the remaining frames, then [DONE]. Returns null for a malformed run.
 */
export function buildReplayBody(run) {
  if (!run || !Array.isArray(run.frames)) return null
  const dated = run.capturedAt ? ` · captured ${run.capturedAt}` : ''
  const header = `[${run.label || REPLAY_LABEL}${dated}] `
  const frames = run.frames
    .map((f) => (typeof f?.response === 'string' ? f.response : ''))
    .filter(Boolean)
  if (frames.length === 0) return null
  const labelled = [header + frames[0], ...frames.slice(1)]
  return labelled.map(sseFrame).join('') + SSE_DONE
}

/**
 * Tier-1: serve a recorded run from KV (transcript). Returns a labelled SSE Response
 * with X-Replay-Tier: 1, or null when this key isn't recorded / is malformed — the
 * null is the signal for the caller to let the client fall through to Tier-2.
 */
export async function serveRecordedRun(env, key, extraHeaders = {}) {
  if (!env || !env.KV || !key) return null
  const raw = await env.KV.get(runKvKey(key))
  if (!raw) return null
  let run
  try {
    run = JSON.parse(raw)
  } catch {
    return null
  }
  const body = buildReplayBody(run)
  if (!body) return null
  return new Response(body, {
    headers: {
      ...SSE_HEADERS,
      'X-Replay-Tier': '1',
      'X-Replay-Source': 'cached_replay',
      ...extraHeaders,
    },
  })
}

/** Optional Tier-1 media (audio) pointer resolution from R2 for a recorded run. */
export async function getReplayMedia(env, mediaKey) {
  if (!env || !env.R2 || !mediaKey) return null
  return env.R2.get(mediaKey)
}
