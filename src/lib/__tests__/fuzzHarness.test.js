import { describe, it, expect } from 'vitest'
import { parseContractName, extractFunctions, buildFuzzHarness } from '../fuzzHarness.js'

const SRC = `pragma solidity ^0.8.20;
contract Vault {
  mapping(address => uint256) public balances;
  function deposit() external payable {}
  function withdraw(uint256 amount) external { }
  function setOwner(address who) public {}
  function toggle(bool on) external {}
  function totalHeld() external view returns (uint256) {}
}`

describe('fuzzHarness — deterministic Foundry harness generator (FR-009)', () => {
  it('parses the contract name (default when absent)', () => {
    expect(parseContractName(SRC)).toBe('Vault')
    expect(parseContractName('')).toBe('Target')
  })

  it('extracts external/public state-changing functions, excludes view/pure', () => {
    const fns = extractFunctions(SRC).map((f) => f.name)
    expect(fns).toContain('withdraw')
    expect(fns).toContain('setOwner')
    expect(fns).toContain('deposit')
    expect(fns).not.toContain('totalHeld') // view excluded
  })

  it('builds a Foundry fuzz skeleton: testFuzz per fn, bound() on numerics, honest framing', () => {
    const h = buildFuzzHarness(SRC)
    expect(h).toContain('contract VaultFuzzTest is Test')
    expect(h).toContain('function testFuzz_withdraw(uint256 amount)')
    expect(h).toContain('bound(amount,') // numeric param is bounded
    expect(h).toContain('vm.assume(who != address(0))') // address param guarded
    expect(h).toMatch(/not a proof/i) // honest scaffold framing
    expect(h).toContain('```solidity')
  })

  it('is deterministic (same source → identical harness)', () => {
    expect(buildFuzzHarness(SRC)).toBe(buildFuzzHarness(SRC))
  })

  it('EDGE: no target function → a generic invariant skeleton, still valid', () => {
    const h = buildFuzzHarness('contract Empty {}')
    expect(h).toContain('contract EmptyFuzzTest is Test')
    expect(h).toContain('testFuzz_invariant')
  })
})
