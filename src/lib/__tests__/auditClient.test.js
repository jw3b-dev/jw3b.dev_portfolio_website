import { describe, it, expect } from 'vitest'
import { validateAuditSource, AUDIT_DISCLAIMER, SOURCE_CAP } from '../auditClient.js'
import { AUDIT_DISCLAIMER as WORKER_DISCLAIMER } from '../../../workers/portfolio-agent/src/auditHeuristics.js'

describe('validateAuditSource — mirrors the Worker gate (FR-013)', () => {
  it('rejects empty and oversize with a specific message', () => {
    expect(validateAuditSource('   ').ok).toBe(false)
    expect(validateAuditSource('   ').error).toMatch(/Paste a Solidity contract/)
    const over = validateAuditSource('x'.repeat(SOURCE_CAP + 1))
    expect(over.ok).toBe(false)
    expect(over.error).toMatch(/exceeds/)
  })
  it('accepts a normal contract', () => {
    expect(validateAuditSource('contract A {}')).toEqual({ ok: true })
  })
})

describe('AUDIT_DISCLAIMER parity (FR-014) — client matches the Worker verbatim', () => {
  it('is identical to the Worker copy (drift = CI fail)', () => {
    expect(AUDIT_DISCLAIMER).toBe(WORKER_DISCLAIMER)
  })
})
