import { describe, it, expect } from 'vitest'
import { isCleared, validateRegister, scanTextForForbidden } from '../claimsValidate.js'
import { getClaim, isClaimCleared } from '../claimsRegister.js'
import register from '../../data/evidence-register.json'

describe('isCleared', () => {
  const ok = { id: 'x', value: '17 findings', label: 'l', status: 'cleared', evidence_pointer: 'https://e' }
  it('true for cleared + sourced + non-forbidden', () => expect(isCleared(ok)).toBe(true))
  it('false when status is not cleared', () => {
    expect(isCleared({ ...ok, status: 'requires_resolution' })).toBe(false)
    expect(isCleared({ ...ok, status: 'forbidden' })).toBe(false)
  })
  it('false when no evidence pointer', () => expect(isCleared({ ...ok, evidence_pointer: '' })).toBe(false))
  it('EDGE: false for null / undefined', () => {
    expect(isCleared(null)).toBe(false)
    expect(isCleared(undefined)).toBe(false)
  })
  it('EDGE: cleared claim with a FORBIDDEN value is blocked', () => {
    expect(isCleared({ ...ok, value: '$5M secured' })).toBe(false)
    expect(isCleared({ ...ok, value: 'protocols secured' })).toBe(false)
  })
})

describe('scanTextForForbidden', () => {
  it('catches the forbidden claim shapes', () => {
    expect(scanTextForForbidden('total value locked').length).toBeGreaterThan(0)
    expect(scanTextForForbidden('50+ audits').length).toBeGreaterThan(0)
    expect(scanTextForForbidden('PMP certified').length).toBeGreaterThan(0)
    expect(scanTextForForbidden('PRINCE2 Practitioner').length).toBeGreaterThan(0)
  })
  it('catches the credential/experience inflation the register declares (Neo4j GDS, combined experience, dollar bounties)', () => {
    expect(scanTextForForbidden('Neo4j GDS certified').length).toBeGreaterThan(0)
    expect(scanTextForForbidden('decades of combined experience').length).toBeGreaterThan(0)
    expect(scanTextForForbidden('$5M in dollar bounties').length).toBeGreaterThan(0)
  })
  it('passes legitimate copy', () => {
    expect(scanTextForForbidden('17 findings, 8 High, 1,430 EXP')).toEqual([])
    expect(scanTextForForbidden('AgilePM Practitioner')).toEqual([]) // NOT PMP/PRINCE2-Practitioner
    // The legit owner-attested delivery claim mentions "decades" but is NOT the forbidden
    // "combined experience" trope — the precise pattern must let it through.
    expect(scanTextForForbidden('Two decades of water-infrastructure delivery across 7 countries')).toEqual([])
    expect(scanTextForForbidden('Neo4j Certified Professional')).toEqual([]) // real cert ≠ the fake GDS one
  })

  // Structural guard (portfolio-evidence): the regex blocklist must ENFORCE every item the
  // register declares forbidden. This is the check that catches a declared-but-unenforced
  // forbidden claim — exactly the gap the compliance-officer substitute left open.
  it('enforces every forbidden item the register declares', () => {
    for (const item of register.forbidden ?? []) {
      expect(scanTextForForbidden(item).length, `not enforced: "${item}"`).toBeGreaterThan(0)
    }
  })
})

describe('validateRegister', () => {
  it('passes a well-formed register', () => {
    const r = { claims: [{ id: 'a', value: '1', label: 'l', status: 'cleared', evidence_pointer: 'https://e' }] }
    expect(validateRegister(r).ok).toBe(true)
  })
  it('FAILS a cleared claim with no evidence pointer', () => {
    const r = { claims: [{ id: 'a', value: '1', label: 'l', status: 'cleared' }] }
    const v = validateRegister(r)
    expect(v.ok).toBe(false)
    expect(v.errors.some((e) => /evidence_pointer/.test(e))).toBe(true)
  })
  it('FAILS a forbidden value that was marked cleared', () => {
    const r = { claims: [{ id: 'a', value: '$5M TVL secured', label: 'l', status: 'cleared', evidence_pointer: 'https://e' }] }
    expect(validateRegister(r).ok).toBe(false)
  })
  it('FAILS duplicate ids + bad status', () => {
    const r = { claims: [
      { id: 'a', value: '1', label: 'l', status: 'cleared', evidence_pointer: 'https://e' },
      { id: 'a', value: '2', label: 'l', status: 'bogus' },
    ] }
    const v = validateRegister(r)
    expect(v.ok).toBe(false)
    expect(v.errors.some((e) => /duplicate/.test(e))).toBe(true)
    expect(v.errors.some((e) => /status must be/.test(e))).toBe(true)
  })
  it('EDGE: non-array claims', () => expect(validateRegister({}).ok).toBe(false))
})

describe('runtime register (seeded starter)', () => {
  it('CodeHawks #124 record is present + cleared', () => {
    const c = getClaim('codehawks-valid-submissions')
    expect(c).toBeTruthy()
    expect(isClaimCleared(c)).toBe(true)
  })
  it('unknown id → null', () => expect(getClaim('nope')).toBeNull())
})

/*
 * ✎ 2026-08-23 — the rank rotted in public.
 *
 * "#124" was live on the homepage for months after it stopped being true. Nothing had gone wrong
 * in the codebase: a CodeHawks leaderboard rank is RELATIVE, so it moves when other researchers
 * earn EXP and the holder does nothing at all (#137 Nov 2025 -> #124 Jan 2026 -> #152 Aug 2026).
 * No gate could catch it, because every gate was checking that the site matched the register and
 * it did. The register was simply stale, and a stale relative number reads as a current fact.
 *
 * The fix that generalises: a claim whose truth depends on other people's activity must carry its
 * as-of date IN THE VALUE, so a reader sees a snapshot rather than a standing claim.
 */
describe('relative claims must be date-stamped', () => {
  const RELATIVE = /(^|\s)#\d+/ // a leaderboard position

  it('every rank-shaped claim value carries an as-of', () => {
    const stamped = /\((?:[A-Z][a-z]{2}\s)?\d{4}\)|\b\d{4}-\d{2}\b/
    for (const claim of register.claims.filter((c) => RELATIVE.test(c.value))) {
      expect(
        stamped.test(claim.value),
        `${claim.id} = "${claim.value}" is a position relative to other people and will go stale ` +
          'without anyone touching it. Put the as-of in the value.',
      ).toBe(true)
    }
  })

  it('the CodeHawks rank is the one this was written for', () => {
    const rank = register.claims.find((c) => c.id === 'codehawks-rank')
    expect(rank.value).toMatch(/^#\d+ \([A-Z][a-z]{2} \d{4}\)$/)
    // And the id must not re-embed the number: "codehawks-124-rank" outlived the 124.
    expect(register.claims.some((c) => /\d{3}/.test(c.id))).toBe(false)
  })
})
