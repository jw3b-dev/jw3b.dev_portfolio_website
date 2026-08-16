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
