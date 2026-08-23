/*
 * The live CodeHawks record — client half  ·  full-stack-integrator
 *
 * Reads the Worker's `/codehawks` verdict and answers ONE question the register cannot: is the
 * figure on this page still the figure CodeHawks reports? The register is build-time and cleared;
 * that is what makes it trustworthy and also what let "#124" sit on the homepage for months after
 * it stopped being true.
 *
 * SO THIS NEVER REPLACES A CLEARED CLAIM — it annotates one. The `<Claim>` values still render from
 * the register; this adds the freshness line, and says so plainly when upstream now reports
 * something different. A live fetch that silently overwrote a gated claim would route around the
 * claims gate, which is the one thing this codebase does not do.
 *
 * Degrades to `unknown` on every failure and renders nothing in that state: our own probe being
 * down says nothing about the record, and a permanent "unknown" is noise, not information.
 */
import { AGENT_CODEHAWKS_URL } from '../config/worker.js'

export const RECORD_STATE = Object.freeze({
  UNKNOWN: 'unknown',
  LIVE: 'live',
  STALE: 'stale',
})

/** PURE — a coarse, humane age. Precision here would imply a freshness we do not have. */
export function ageLabel(ageSec) {
  if (!Number.isFinite(ageSec) || ageSec < 0) return null
  if (ageSec < 90 * 60) return 'just now'
  const hours = Math.round(ageSec / 3600)
  if (hours < 36) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  return `${Math.round(hours / 24)} days ago`
}

/**
 * PURE — does the live record still agree with the register?
 * Returns null when there is nothing to compare, so "no answer" and "they disagree" can never be
 * confused by a caller.
 */
export function driftFrom(record, registerValidSubmissions) {
  if (!record || !Number.isFinite(record.validSubmissions)) return null
  const expected = Number(registerValidSubmissions)
  if (!Number.isFinite(expected)) return null
  return record.validSubmissions === expected
    ? { drifted: false, live: record.validSubmissions, register: expected }
    : { drifted: true, live: record.validSubmissions, register: expected }
}

/**
 * Fetch the live record.
 * @returns {Promise<{state:string, record:object|null, ageSec:number|null}>} never throws.
 */
export async function fetchCodehawksRecord({ fetchImpl, url = AGENT_CODEHAWKS_URL, signal } = {}) {
  const doFetch = fetchImpl || (typeof fetch === 'function' ? fetch : null)
  const empty = { state: RECORD_STATE.UNKNOWN, record: null, ageSec: null }
  if (!doFetch) return empty
  try {
    const res = await doFetch(url, { method: 'GET', headers: { Accept: 'application/json' }, signal })
    if (!res || !res.ok) return empty
    const body = await res.json()
    const state = body && body.state
    if (state !== RECORD_STATE.LIVE && state !== RECORD_STATE.STALE) return empty
    if (!body.record || !Number.isFinite(Number(body.record.validSubmissions))) return empty
    return {
      state,
      record: body.record,
      ageSec: Number.isFinite(Number(body.ageSec)) ? Number(body.ageSec) : null,
    }
  } catch {
    return empty
  }
}
