import { describe, it, expect } from 'vitest'
import { auditSolidity, SAMPLE_CONTRACT, SEVERITY_META } from '../auditHeuristics.js'

describe('auditSolidity heuristics', () => {
  it('empty source → empty flag, no findings', () => {
    const r = auditSolidity('')
    expect(r.empty).toBe(true)
    expect(r.findings).toEqual([])
  })

  it('reproduces the reentrancy + floating pragma in the sample contract', () => {
    const { findings } = auditSolidity(SAMPLE_CONTRACT)
    const ids = findings.map((f) => f.id)
    expect(ids).toContain('reentrancy')
    expect(ids).toContain('floating-pragma')
    const reentrancy = findings.find((f) => f.id === 'reentrancy')
    expect(reentrancy.severity).toBe('high')
    expect(reentrancy.line).toBeGreaterThan(0)
  })

  it('sorts high severity first', () => {
    expect(auditSolidity(SAMPLE_CONTRACT).findings[0].severity).toBe('high')
  })

  it('flags tx.origin authorization as medium', () => {
    const src = 'pragma solidity 0.8.20;\ncontract A { function f() public { require(tx.origin == owner); } }'
    const f = auditSolidity(src).findings.find((x) => x.id === 'tx-origin')
    expect(f).toBeTruthy()
    expect(f.severity).toBe('medium')
  })

  it('does not flag a pinned pragma', () => {
    const src = 'pragma solidity 0.8.20;\ncontract A {}'
    expect(auditSolidity(src).findings.some((f) => f.id === 'floating-pragma')).toBe(false)
  })

  it('clean contract → clean flag', () => {
    const src = 'pragma solidity 0.8.20;\ncontract A { uint x; function set(uint v) external { x = v; } }'
    const r = auditSolidity(src)
    expect(r.clean).toBe(true)
    expect(r.findings).toEqual([])
  })

  it('exposes severity metadata for every severity it emits', () => {
    for (const sev of ['high', 'medium', 'low']) expect(SEVERITY_META[sev]).toBeTruthy()
  })
})
