import { describe, it, expect } from 'vitest'
import { fixesFor, applyFixAndVerify, FIXES } from '../auditFixes.js'
import { auditSolidity, SAMPLE_CONTRACT } from '../auditHeuristics.js'

/*
 * The bar for a remediation is not "it produced different text" — it is that RE-SCREENING the
 * result with the real detector shows the finding gone. Every positive case below proves the fix
 * against auditSolidity itself, so a fix can never drift away from the rule that raised it.
 *
 * The negative cases matter just as much: a fix that can't be expressed safely must not be
 * offered. A missing button is honest; a button that mangles someone's contract is not.
 */

const screen = (src) => auditSolidity(src).findings
const idsIn = (src) => screen(src).map((f) => f.id)
const fixFor = (src, id) => fixesFor(screen(src), src).find((f) => f.findingId === id)

const REENTRANT = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract Vault {
    mapping(address => uint256) public balances;

    function withdraw() external {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "nothing");
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok, "transfer failed");
        balances[msg.sender] = 0;
    }
}
`

const TX_ORIGIN = `pragma solidity 0.8.20;
contract A {
    address owner;
    function setOwner(address next) external {
        require(tx.origin == owner, "not owner");
        owner = next;
    }
    function drain() external {
        require(tx.origin == owner);
    }
}
`

describe('auditFixes — reentrancy (checks-effects-interactions)', () => {
  it('hoists the balance write above the external call and the finding clears', () => {
    const fix = fixFor(REENTRANT, 'reentrancy')
    expect(fix).toBeTruthy()
    const r = applyFixAndVerify(fix, REENTRANT)

    expect(r.changed).toBe(true)
    expect(r.cleared).toBe(true)
    expect(r.before).toBe(1)
    expect(r.after).toBe(0)
    // The write really is above the call now — the ORDER is the fix, not a comment about it.
    const lines = r.source.split('\n')
    expect(lines.findIndex((l) => /balances\[msg\.sender\] = 0;/.test(l))).toBeLessThan(
      lines.findIndex((l) => /\.call\{value/.test(l)),
    )
    // ...and nothing else was disturbed: same statements, same count.
    expect(r.source.split('\n').length).toBe(REENTRANT.split('\n').length)
    expect(r.source).toContain('require(ok, "transfer failed");')
  })

  it('handles a `-=` write whose amount was computed before the call', () => {
    const src = `pragma solidity 0.8.20;
contract V {
    mapping(address => uint256) public balances;
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount);
        (bool ok, ) = msg.sender.call{value: amount}("");
        require(ok);
        balances[msg.sender] -= amount;
    }
}
`
    expect(idsIn(src)).toContain('reentrancy')
    const r = applyFixAndVerify(fixFor(src, 'reentrancy'), src)
    expect(r.cleared).toBe(true)
  })

  it('is NOT offered when the write depends on a value computed after the call', () => {
    // `remaining` only exists below the call, so hoisting the write would not compile.
    const src = `pragma solidity 0.8.20;
contract V {
    mapping(address => uint256) public balances;
    function withdraw() external {
        (bool ok, ) = msg.sender.call{value: 1}("");
        uint256 remaining = computeRemaining();
        balances[msg.sender] = remaining;
    }
    function computeRemaining() internal pure returns (uint256) { return 0; }
}
`
    expect(idsIn(src)).toContain('reentrancy')
    expect(fixFor(src, 'reentrancy')).toBeUndefined()
  })

  it('offers the fix for an identifier containing `$` — a legal Solidity name, not a regex anchor', () => {
    // Audit finding S-1. The scope check used to build `new RegExp('\\b' + id + '\\b')` from a
    // name lifted out of the visitor's own contract. `$` is an ANCHOR in a pattern, so `\b$amt\b`
    // matched nothing and the fix was silently withheld from a contract that qualified for it —
    // a security tool quietly declining to help. Identifiers are tokenised now, never compiled.
    const src = `pragma solidity 0.8.20;
contract V {
  mapping(address => uint256) public balances;
  function withdraw() external {
    uint256 $amt = balances[msg.sender];
    (bool ok,) = msg.sender.call{value: $amt}("");
    require(ok);
    balances[msg.sender] = $amt;
  }
}`
    expect(idsIn(src)).toContain('reentrancy')
    const fix = fixFor(src, 'reentrancy')
    expect(fix).toBeTruthy()
    expect(applyFixAndVerify(fix, src).cleared).toBe(true)
  })

  it('still withholds the fix when a `$` identifier really is defined after the call', () => {
    // The negative half: tokenising must not turn the scope check into a rubber stamp.
    const src = `pragma solidity 0.8.20;
contract V {
  mapping(address => uint256) public balances;
  function withdraw() external {
    (bool ok,) = msg.sender.call{value: 1}("");
    uint256 $later = 7;
    balances[msg.sender] = $later;
  }
}`
    expect(idsIn(src)).toContain('reentrancy')
    expect(fixFor(src, 'reentrancy')).toBeUndefined()
  })

  it('is NOT offered when the balance write shares a line with other statements', () => {
    // The rule fires, but the write is not a clean standalone statement — moving the whole line
    // would drag `require(ok)` above the call with it. Conservative: offer nothing.
    const src = `pragma solidity 0.8.20;
contract V {
    mapping(address => uint256) public balances;
    function withdraw() external {
        (bool ok, ) = msg.sender.call{value: 1}("");
        require(ok); balances[msg.sender] = 0;
    }
}
`
    expect(idsIn(src)).toContain('reentrancy')
    expect(fixFor(src, 'reentrancy')).toBeUndefined()
  })

  it('hoists a write whose right-hand side has no identifiers at all', () => {
    const src = `pragma solidity 0.8.20;
contract V {
    mapping(address => uint256) public balances;
    function withdraw() external {
        (bool ok, ) = msg.sender.call{value: 1}("");
        require(ok);
        balances[msg.sender] = 1 - 1;
    }
}
`
    const r = applyFixAndVerify(fixFor(src, 'reentrancy'), src)
    expect(r.cleared).toBe(true)
  })

  it('is NOT offered when there is no balance write after the call', () => {
    const src = `pragma solidity 0.8.20;
contract V {
    function pay(address to) external { (bool ok, ) = to.call{value: 1}(""); require(ok); }
}
`
    expect(fixFor(src, 'reentrancy')).toBeUndefined()
  })
})

describe('auditFixes — tx.origin', () => {
  it('replaces every occurrence with msg.sender and clears all of them at once', () => {
    expect(screen(TX_ORIGIN).filter((f) => f.id === 'tx-origin')).toHaveLength(2)
    const r = applyFixAndVerify(fixFor(TX_ORIGIN, 'tx-origin'), TX_ORIGIN)
    expect(r.before).toBe(2)
    expect(r.after).toBe(0)
    expect(r.cleared).toBe(true)
    expect(r.source).not.toContain('tx.origin')
    expect(r.source.match(/msg\.sender/g)).toHaveLength(2)
  })

  it('offers ONE fix for many findings of the same rule', () => {
    const offered = fixesFor(screen(TX_ORIGIN), TX_ORIGIN).filter((f) => f.findingId === 'tx-origin')
    expect(offered).toHaveLength(1)
  })
})

describe('auditFixes — floating pragma', () => {
  it('pins a single caret constraint and clears the finding', () => {
    expect(idsIn(SAMPLE_CONTRACT)).toContain('floating-pragma')
    const r = applyFixAndVerify(fixFor(SAMPLE_CONTRACT, 'floating-pragma'), SAMPLE_CONTRACT)
    expect(r.cleared).toBe(true)
    expect(r.source).toContain('pragma solidity 0.8.20;')
    expect(r.source).not.toContain('^0.8.20')
  })

  it('pins a single >= constraint', () => {
    const src = 'pragma solidity >=0.8.4;\ncontract C {}\n'
    const r = applyFixAndVerify(fixFor(src, 'floating-pragma'), src)
    expect(r.cleared).toBe(true)
    expect(r.source).toContain('pragma solidity 0.8.4;')
  })

  it('is NOT offered for a compound range — there is no single right answer', () => {
    const src = 'pragma solidity >=0.8.0 <0.9.0;\ncontract C {}\n'
    expect(idsIn(src)).toContain('floating-pragma')
    expect(fixFor(src, 'floating-pragma')).toBeUndefined()
  })
})

describe('auditFixes — offering rules', () => {
  it('offers nothing for a clean screen', () => {
    const src = 'pragma solidity 0.8.20;\ncontract Safe { uint256 public t; function add(uint256 n) external { t += n; } }\n'
    expect(screen(src)).toHaveLength(0)
    expect(fixesFor(screen(src), src)).toHaveLength(0)
  })

  it('tolerates junk input instead of throwing (it runs on every keystroke)', () => {
    expect(fixesFor(null, null)).toEqual([])
    expect(fixesFor([{ id: 'not-a-rule' }], 'contract C {}')).toEqual([])
    expect(fixesFor([{}], 'contract C {}')).toEqual([])
  })

  it('applies from the source it is GIVEN, not the one it was built from', () => {
    // The console may hand a fix a newer draft; it must transform that, not a stale snapshot.
    const fix = fixFor(TX_ORIGIN, 'tx-origin')
    const other = 'contract B { function f() external { require(tx.origin == msg.sender); } }'
    expect(fix.apply(other)).toBe('contract B { function f() external { require(msg.sender == msg.sender); } }')
  })

  it('returns the source untouched when a fix no longer applies to it', () => {
    const fix = fixFor(TX_ORIGIN, 'tx-origin')
    const clean = 'contract B {}'
    expect(fix.apply(clean)).toBe(clean)
    const r = applyFixAndVerify(fix, clean)
    expect(r.changed).toBe(false)
    expect(r.cleared).toBe(false) // nothing was there to clear — never report success
  })

  it('reports no clearance for a malformed fix rather than throwing', () => {
    expect(applyFixAndVerify(null, TX_ORIGIN)).toEqual({ source: TX_ORIGIN, changed: false, cleared: false, before: 0, after: 0 })
    expect(applyFixAndVerify({ apply: 'nope' }, TX_ORIGIN).changed).toBe(false)
  })

  it('every catalogued fix names the rule it remediates and explains the change', () => {
    for (const [ruleId, spec] of Object.entries(FIXES)) {
      expect(spec.id).toMatch(/^fix-/)
      expect(spec.label.length).toBeGreaterThan(0)
      expect(spec.description.length).toBeGreaterThan(20) // an explanation, not a slogan
      expect(typeof spec.build).toBe('function')
      expect(ruleId).toBeTruthy()
    }
  })

  it('survives being handed nothing at all — it runs on live editor state', () => {
    const fix = fixFor(TX_ORIGIN, 'tx-origin')
    expect(fix.apply(null)).toBe('')
    expect(fix.apply(undefined)).toBe('')
    // A rule whose builder declines (returns null) hands back the source unchanged, never null.
    const pragmaFix = fixFor(SAMPLE_CONTRACT, 'floating-pragma')
    expect(pragmaFix.apply('contract NoPragma {}')).toBe('contract NoPragma {}')
    expect(applyFixAndVerify(pragmaFix, null).source).toBe('')
  })

  it('a fix that returns a non-string is treated as inapplicable', () => {
    // fixReentrancy/fixFloatingPragma return null when unsafe — the guard must hold generally.
    const src = 'contract C {}'
    expect(fixesFor([{ id: 'reentrancy' }], src)).toEqual([])
    expect(fixesFor([{ id: 'floating-pragma' }], src)).toEqual([])
  })
})
