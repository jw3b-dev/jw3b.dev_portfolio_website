/*
 * jw3b.dev v2 — Audit console client logic (P1-08 · FR-011/FR-014)  ·  full-stack-integrator
 * PURE client-side input validation for the /audit console (mirrors the Worker's FR-013 gate so
 * the user gets an instant, specific error before any request) + the AI-assisted-first-pass
 * disclaimer (FR-014). AUDIT_DISCLAIMER is a verbatim mirror of the Worker's copy; a parity test
 * fails CI if they drift, so the disclaimer the user reads is always the reviewed public claim.
 */

export const SOURCE_CAP = 24000 // mirror of the Worker SOURCE_CAP (FR-013)

// Verbatim mirror of workers/portfolio-agent/src/auditHeuristics.js AUDIT_DISCLAIMER (BR-10).
export const AUDIT_DISCLAIMER =
  'Automated AI-assisted first-pass screen: deterministic heuristics plus a model narrative. ' +
  'It flags common patterns and is not a substitute for a full manual audit; it does not claim ' +
  'to be complete. Reproduced exploits appear only in labelled recorded runs.'

/** Validate pasted contract source before a request (matches the Worker's rejects). */
export function validateAuditSource(source) {
  const s = String(source || '')
  if (!s.trim()) return { ok: false, error: 'Paste a Solidity contract to analyse.' }
  if (s.length > SOURCE_CAP) return { ok: false, error: `Source exceeds ${SOURCE_CAP.toLocaleString()} characters.` }
  return { ok: true }
}
