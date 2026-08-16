import { describe, it, expect } from 'vitest'
import { auditSolidity as clientAudit, SAMPLE_CONTRACT } from '../auditHeuristics.js'
import {
  auditSolidity as workerAudit,
  formatFindingsText,
  AUDIT_DISCLAIMER,
  SEVERITY_LABEL,
} from '../../../workers/portfolio-agent/src/auditHeuristics.js'
import { scanTextForForbidden } from '../claimsValidate.js'

const TX_ORIGIN = 'pragma solidity ^0.8.0;\ncontract A { function f() external { require(tx.origin == owner); } }'
const CLEAN = 'pragma solidity 0.8.20;\ncontract Ok { uint256 x; }'

describe('worker↔client heuristics parity (drift = CI fail)', () => {
  for (const [name, src] of [
    ['sample reentrancy contract', SAMPLE_CONTRACT],
    ['tx.origin auth', TX_ORIGIN],
    ['clean pinned contract', CLEAN],
    ['empty', ''],
  ]) {
    it(`identical findings: ${name}`, () => {
      expect(workerAudit(src)).toEqual(clientAudit(src))
    })
  }
})

describe('worker heuristics detectors (FR-008)', () => {
  it('flags the sample reentrancy as HIGH', () => {
    const r = workerAudit(SAMPLE_CONTRACT)
    expect(r.findings[0]).toMatchObject({ id: 'reentrancy', severity: 'high' })
    expect(r.clean).toBe(false)
  })
  it('reports a clean pinned contract as clean', () => {
    expect(workerAudit(CLEAN)).toMatchObject({ empty: false, clean: true })
  })
})

describe('formatFindingsText — streamed severity table', () => {
  it('renders a severity-labelled block for findings', () => {
    const text = formatFindingsText(workerAudit(SAMPLE_CONTRACT))
    expect(text).toContain(SEVERITY_LABEL.high)
    expect(text).toMatch(/line \d+/)
    expect(text).toContain('finding(s):')
  })
  it('handles empty + clean states', () => {
    expect(formatFindingsText(workerAudit(''))).toBe('No source provided.')
    expect(formatFindingsText(workerAudit(CLEAN))).toMatch(/no common-pattern issues/i)
  })
})

describe('AUDIT_DISCLAIMER (BR-10) — public-claim safe', () => {
  it('is present and carries no forbidden/determinism language', () => {
    expect(AUDIT_DISCLAIMER).toMatch(/not a substitute for a full manual audit/i)
    expect(scanTextForForbidden(AUDIT_DISCLAIMER)).toEqual([])
    expect(AUDIT_DISCLAIMER).not.toMatch(/\bguarantee|100%|approved by\b/i)
  })
})
