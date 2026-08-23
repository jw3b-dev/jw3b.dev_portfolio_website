/*
 * jw3b.dev v2 — Evidence register runtime loader  ·  domain-engine (P0-07)
 * Wraps the sealed register (src/data/evidence-register.json, seeded in P0-08) for the
 * runtime <Claim> primitive. Pure lookups; the render decision is isCleared() from claimsValidate.
 */
import register from '../data/evidence-register.json'
import { isCleared } from './claimsValidate.js'

const byId = new Map((register.claims || []).map((c) => [c.id, c]))

export function getClaim(id) {
  return byId.get(id) || null
}

export function isClaimCleared(claim) {
  return isCleared(claim)
}

export function allClaims() {
  return register.claims || []
}

export const forbiddenList = register.forbidden || []

/**
 * What KIND of evidence backs a claim.
 *
 * The register has always recorded this and the UI never showed it: 17 of the 31 cleared claims
 * carry a prose pointer ("owner-attested — …") rather than a URL, and every one rendered exactly
 * like a CodeHawks rank a reader can click through and check. Portfolio-evidence's rule is that
 * owner-attested figures are allowed but must be *marked as attested with their provenance, never
 * dressed up as independently verified* — so the distinction has to reach the reader, not sit in
 * the JSON.
 *
 * @returns {'verified'|'attested'|'unsourced'}
 *   verified  — the pointer is a URL the reader can open and check
 *   attested  — a pointer exists, but it is a statement rather than a checkable source
 *   unsourced — no pointer at all (the claims gate blocks a cleared claim in this state)
 */
export function evidenceKind(claim) {
  const p = claim && claim.evidence_pointer
  if (typeof p !== 'string' || !p.trim()) return 'unsourced'
  return /^https?:\/\//i.test(p.trim()) ? 'verified' : 'attested'
}

/**
 * PURE — the first sentence of a reconciliation note, for a collapsed summary.
 *
 * A third of the register carries a note explaining a time its figure was wrong. They are
 * paragraph-length by design (the detail is the point), so /evidence shows the first sentence and
 * expands to the whole thing. Falls back to the entire note rather than an empty string: a
 * correction that renders blank is worse than one that renders long.
 */
export function firstSentence(note = '') {
  const text = String(note ?? '').trim()
  const m = /^(.*?[.!?])(\s|$)/s.exec(text)
  return (m ? m[1] : text).trim()
}
