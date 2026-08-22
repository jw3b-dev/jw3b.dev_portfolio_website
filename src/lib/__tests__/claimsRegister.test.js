/*
 * The claims register is the gate between "a number we can prove" and "a number we typed".
 * It had NO test file, despite being the mechanism the whole proof-not-promises thesis rests
 * on — and despite an explicit rule that no unsourced figure may render.
 */
import { describe, it, expect } from 'vitest'
import { getClaim, isClaimCleared, allClaims, forbiddenList, evidenceKind } from '../claimsRegister.js'

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

/*
 * evidenceKind — the distinction the register always recorded and the UI never showed.
 * Portfolio-evidence: an owner-attested figure is allowed, but must be marked as attested and
 * never dressed up as independently verified. These pin the classifier that makes that possible.
 */
describe('evidenceKind — verified vs attested vs unsourced', () => {
  it('classifies a URL pointer as verified, scheme-insensitively', () => {
    expect(evidenceKind({ evidence_pointer: 'https://profiles.cyfrin.io/u/agilegypsy' })).toBe('verified')
    expect(evidenceKind({ evidence_pointer: 'http://example.com/x' })).toBe('verified')
    expect(evidenceKind({ evidence_pointer: 'HTTPS://EXAMPLE.COM' })).toBe('verified')
    expect(evidenceKind({ evidence_pointer: '  https://example.com  ' })).toBe('verified')
  })

  it('classifies a prose pointer as attested — a statement is not a checkable source', () => {
    expect(evidenceKind({ evidence_pointer: 'owner-attested — Overmind GenAI engine' })).toBe('attested')
    expect(evidenceKind({ evidence_pointer: 'CodeHawks profile' })).toBe('attested')
    // Not a URL just because it mentions one — the pointer must BE the link, not describe it.
    expect(evidenceKind({ evidence_pointer: 'see https://example.com' })).toBe('attested')
  })

  it('classifies a missing or blank pointer as unsourced', () => {
    expect(evidenceKind({ evidence_pointer: '' })).toBe('unsourced')
    expect(evidenceKind({ evidence_pointer: '   ' })).toBe('unsourced')
    expect(evidenceKind({ evidence_pointer: null })).toBe('unsourced')
    expect(evidenceKind({})).toBe('unsourced')
    expect(evidenceKind(null)).toBe('unsourced')
    expect(evidenceKind(undefined)).toBe('unsourced')
  })

  it('NO cleared claim in the shipped register is unsourced', () => {
    const bad = allClaims().filter((c) => isClaimCleared(c) && evidenceKind(c) === 'unsourced')
    expect(bad.map((c) => c.id), 'cleared claims with no evidence pointer').toEqual([])
  })

  it('the register genuinely contains both kinds — otherwise this distinction is untested in situ', () => {
    const kinds = new Set(allClaims().filter(isClaimCleared).map(evidenceKind))
    expect(kinds.has('verified')).toBe(true)
    expect(kinds.has('attested')).toBe(true)
  })
})
