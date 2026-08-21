/*
 * The claims register is the gate between "a number we can prove" and "a number we typed".
 * It had NO test file, despite being the mechanism the whole proof-not-promises thesis rests
 * on — and despite an explicit rule that no unsourced figure may render.
 */
import { describe, it, expect } from 'vitest'
import { getClaim, isClaimCleared, allClaims, forbiddenList } from '../claimsRegister.js'

describe('claims register', () => {
  it('exposes a non-empty register of claims', () => {
    expect(Array.isArray(allClaims())).toBe(true)
    expect(allClaims().length).toBeGreaterThan(0)
  })

  it('looks a claim up by id, and returns null for an unknown one', () => {
    const first = allClaims()[0]
    expect(getClaim(first.id)).toEqual(first)
    for (const bad of ['nope', '', null, undefined]) expect(getClaim(bad)).toBeNull()
  })

  it('every cleared claim carries an evidence pointer — that is what "cleared" MEANS', () => {
    const unsourced = allClaims()
      .filter((c) => isClaimCleared(c))
      .filter((c) => !c.evidence_pointer || !String(c.evidence_pointer).trim())
      .map((c) => c.id)
    expect(unsourced, `cleared claims with no evidence:\n  ${unsourced.join('\n  ')}`).toEqual([])
  })

  it('claim ids are unique — a duplicate would make lookups silently ambiguous', () => {
    const ids = allClaims().map((c) => c.id)
    expect(ids.length).toBe(new Set(ids).size)
  })

  it('publishes a non-empty forbidden list, and no cleared claim contains a forbidden term', () => {
    expect(Array.isArray(forbiddenList)).toBe(true)
    expect(forbiddenList.length).toBeGreaterThan(0)
    const offenders = allClaims()
      .filter((c) => isClaimCleared(c))
      .filter((c) => forbiddenList.some((f) => String(c.rendered || '').toLowerCase().includes(String(f).toLowerCase())))
      .map((c) => c.id)
    expect(offenders, `cleared claims containing forbidden copy: ${offenders.join(', ')}`).toEqual([])
  })

  it('isClaimCleared is defensive about malformed input', () => {
    for (const bad of [null, undefined, {}, 'x']) expect(() => isClaimCleared(bad)).not.toThrow()
  })
})
