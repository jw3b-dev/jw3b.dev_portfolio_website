import { describe, it, expect } from 'vitest'
import { isCleared, validateRegister, scanTextForForbidden } from '../claimsValidate.js'
import { getClaim, isClaimCleared } from '../claimsRegister.js'

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
  it('passes legitimate copy', () => {
    expect(scanTextForForbidden('17 findings, 8 High, 1,430 EXP')).toEqual([])
    expect(scanTextForForbidden('AgilePM Practitioner')).toEqual([]) // NOT PMP/PRINCE2-Practitioner
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
    const c = getClaim('codehawks-124-findings')
    expect(c).toBeTruthy()
    expect(isClaimCleared(c)).toBe(true)
  })
  it('unknown id → null', () => expect(getClaim('nope')).toBeNull())
})
