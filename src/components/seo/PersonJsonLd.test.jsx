import { describe, it, expect } from 'vitest'
import { PERSON_LD, STUDIO_URL, CODEHAWKS_URL } from './PersonJsonLd.jsx'
import { getClaim } from '../../lib/claimsRegister.js'

describe('PersonJsonLd — structured data + cross-link (FR-054/FR-044)', () => {
  it('is a valid schema.org Person', () => {
    expect(PERSON_LD['@context']).toBe('https://schema.org')
    expect(PERSON_LD['@type']).toBe('Person')
    expect(PERSON_LD.name).toBe('John Wellard')
    expect(PERSON_LD.alternateName).toMatch(/JW3B/)
    expect(PERSON_LD.url).toMatch(/^https:\/\/jw3b\.dev/)
    expect(() => JSON.stringify(PERSON_LD)).not.toThrow()
  })

  it('cross-links the studio (person↔AgileGypsy) via sameAs + worksFor', () => {
    expect(STUDIO_URL).toBe('https://agilegypsy.com')
    expect(PERSON_LD.sameAs).toContain(STUDIO_URL)
    expect(PERSON_LD.worksFor.url).toBe(STUDIO_URL)
  })

  it('deep-links CodeHawks #124 from the register (completes FR-044 2nd surface)', () => {
    expect(CODEHAWKS_URL).toBe(getClaim('codehawks-124-rank').evidence_pointer)
    expect(PERSON_LD.sameAs).toContain(CODEHAWKS_URL)
  })

  it('asserts no numeric claim (numbers live in the gated <Claim> surfaces)', () => {
    expect(JSON.stringify(PERSON_LD)).not.toMatch(/\b\d[\d,]*\s*(findings?|EXP|tests?|audits?|users?)\b/i)
  })
})
