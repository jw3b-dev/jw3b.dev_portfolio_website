import { describe, it, expect } from 'vitest'
import { parseContractName, extractFunctions, buildFuzzHarness, splitHarness } from '../fuzzHarness.js'

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

/*
 * W3 — the harness must be USABLE, not just displayed (PRODUCT_AUDIT #15).
 *
 * buildFuzzHarness returns Markdown because the Worker's /fuzz route streams it to a markdown
 * renderer. The /audit tool rendered that same string inside a <pre>, so visitors read the
 * literal ``` fences as text and had no way to copy or save the result — a code generator whose
 * output you cannot use. splitHarness lets the tool present code as code without changing the
 * Worker's contract.
 */
describe('splitHarness — code out of the markdown, contract unchanged', () => {
  const md = buildFuzzHarness('contract Vault { function deposit() external payable {} }')

  it('returns Solidity with no markdown fences left in it', () => {
    const { code } = splitHarness(md)
    expect(code).not.toContain('```')
    expect(code).toContain('pragma solidity')
    expect(code).toContain('contract VaultFuzzTest')
  })

  it('keeps the honest framing as prose, separate from the code', () => {
    const { prose } = splitHarness(md)
    expect(prose).toMatch(/not a proof of correctness/i)
    expect(prose).not.toContain('```')
  })

  it('names the file the way Foundry expects, from the test contract', () => {
    expect(splitHarness(md).filename).toBe('VaultFuzzTest.t.sol')
  })

  it('degrades without throwing when there is no fenced block', () => {
    expect(splitHarness('just prose')).toEqual({ prose: 'just prose', code: '', filename: 'Fuzz.t.sol' })
    expect(splitHarness('')).toEqual({ prose: '', code: '', filename: 'Fuzz.t.sol' })
    expect(splitHarness(null).code).toBe('')
  })

  it('leaves buildFuzzHarness itself untouched — the Worker still gets markdown', () => {
    expect(md).toContain('```solidity')
  })
})
