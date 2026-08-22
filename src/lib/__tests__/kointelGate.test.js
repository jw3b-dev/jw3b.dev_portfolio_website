/*
 * kointelGate — the rule Kointel fails its build on, made runnable.
 *
 * The tests carry the same burden as the audit examples: a demo whose detector has quietly stopped
 * firing is a demo of nothing, and this one sits under a claim about a real product's engineering.
 * So the shipped examples are asserted against the real gate in BOTH directions — the failing one
 * must fail, and the compliant one must pass — rather than being trusted to still be what their
 * titles say.
 */
import { describe, it, expect } from 'vitest'
import { runKointelGate, GATE_RULES, GATE_EXAMPLES } from '../kointelGate.js'

const ids = (src) => runKointelGate(src).violations.map((v) => v.id)

describe('runKointelGate — the banned capabilities', () => {
  it('fails a module that broadcasts a transaction', () => {
    expect(ids('export const go = () => wallet.sendTransaction({ to, value })')).toContain('send-transaction')
  })

  it('fails a module that signs', () => {
    expect(ids('await signer.signMessage(msg)')).toContain('sign')
    expect(ids('await signer.signTransaction(tx)')).toContain('sign')
  })

  it('fails an RPC signing method even though it is written as a STRING', () => {
    /*
     * This is the case that forced the two scan surfaces. Stripping string literals is what keeps
     * the gate from firing on its own documentation — but an RPC call names its capability inside
     * a string, so a blanket strip made the detector blind to the most direct form of the ban.
     */
    expect(ids('provider.request({ method: "eth_sign" })')).toContain('rpc-signing-method')
    expect(ids("provider.request({ method: 'eth_sendTransaction' })")).toContain('rpc-signing-method')
    expect(ids('await p.request({ method: "personal_sign", params })')).toContain('rpc-signing-method')
  })

  it('still does not fire on an RPC method named in a COMMENT', () => {
    expect(runKointelGate('// eth_sendTransaction is banned in this layer').passed).toBe(true)
  })

  it('fails a module that touches key material', () => {
    expect(ids('const account = privateKeyToAccount(process.env.PRIVATE_KEY)')).toContain('private-key')
    expect(ids('Wallet.fromPhrase(mnemonic)')).toContain('private-key')
  })

  it('fails a state-changing contract call — the ban follows the capability, not the vocabulary', () => {
    expect(ids('await writeContract(config, { abi, functionName: "transfer" })')).toContain('write-contract')
  })

  it('fails an allowance grant — funds leave without a transfer in this module', () => {
    expect(ids('await token.approve(spender, amount)')).toContain('approve-spend')
    expect(ids('await token.increaseAllowance(spender, amount)')).toContain('approve-spend')
  })

  it('reports the line and the reason, not just a verdict', () => {
    const { violations } = runKointelGate('const a = 1\nconst b = 2\nawait wallet.sendTransaction(tx)')
    expect(violations[0].line).toBe(3)
    expect(violations[0].why).toMatch(/moves funds/i)
    expect(violations[0].snippet).toContain('sendTransaction')
  })
})

describe('runKointelGate — what must NOT fail', () => {
  it('passes a read-only module', () => {
    const src = `import { createPublicClient } from 'viem'
export const balance = (a) => client.getBalance({ address: a })`
    expect(runKointelGate(src).passed).toBe(true)
  })

  it('does not fire on the word "sign" inside a COMMENT', () => {
    // A gate that fails on its own documentation trains people to delete the documentation.
    expect(runKointelGate('// we never signTransaction here\nconst x = 1').passed).toBe(true)
  })

  it('does not fire on a capability named inside a STRING', () => {
    expect(runKointelGate('const err = "signTransaction is banned in this layer"').passed).toBe(true)
  })

  it('does not fire on a block comment', () => {
    expect(runKointelGate('/* privateKey must never appear below */\nconst x = 1').passed).toBe(true)
  })

  it('treats an empty module as "nothing scanned", not as a pass', () => {
    const r = runKointelGate('')
    expect(r.empty).toBe(true)
    expect(r.passed).toBe(false) // an empty input has not been proven compliant
    expect(runKointelGate(null).empty).toBe(true)
  })
})

describe('the shipped examples must still be what their titles claim', () => {
  it('the compliant example passes the real gate', () => {
    const ex = GATE_EXAMPLES.find((e) => e.id === 'compliant')
    const r = runKointelGate(ex.source)
    expect(r.passed, `compliant example raised [${r.violations.map((v) => v.id)}]`).toBe(true)
  })

  it('the violating example fails, and on more than one rule', () => {
    const ex = GATE_EXAMPLES.find((e) => e.id === 'violating')
    const r = runKointelGate(ex.source)
    expect(r.passed).toBe(false)
    // It reads a key AND broadcasts — the realistic shape of "just one helper".
    expect(r.violations.map((v) => v.id)).toEqual(expect.arrayContaining(['private-key', 'send-transaction']))
  })

  it('both examples do the same job, so the pair proves the rule is satisfiable', () => {
    for (const ex of GATE_EXAMPLES) {
      expect(ex.source).toMatch(/getBalance/)
      expect(ex.title.trim()).not.toBe('')
      expect(ex.blurb.trim()).not.toBe('')
    }
    expect(GATE_EXAMPLES).toHaveLength(2)
  })
})

describe('GATE_RULES — the list the UI renders', () => {
  it('exposes every rule with a reason, and never a raw regex', () => {
    expect(GATE_RULES.length).toBeGreaterThanOrEqual(5)
    for (const r of GATE_RULES) {
      expect(r.id).toBeTruthy()
      expect(r.rule).toBeTruthy()
      expect(r.why).toBeTruthy()
      expect(r.pattern).toBeUndefined()
    }
  })

  it('every rule id is reachable by at least one example or test above', () => {
    // A rule nobody can trigger is a rule nobody can check — the reachability argument, applied
    // to the detector itself.
    const violating = runKointelGate(GATE_EXAMPLES.find((e) => e.id === 'violating').source)
    const covered = new Set([
      ...violating.violations.map((v) => v.id),
      ...ids('await signer.signMessage(m)'),
      ...ids('await writeContract(c, {})'),
      ...ids('await token.approve(s, a)'),
      ...ids('p.request({ method: "eth_sign" })'),
    ])
    for (const r of GATE_RULES) expect(covered.has(r.id), `${r.id} is unreachable`).toBe(true)
  })
})
