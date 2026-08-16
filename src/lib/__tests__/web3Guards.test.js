import { describe, it, expect } from 'vitest'
import { simulateGate, revertReason, toUsdcBaseUnits, formatUsdc, fundsPolicy, USDC_DECIMALS } from '../web3Guards.js'

describe('simulateGate — simulate-first law (FR-027 / BR-04)', () => {
  it('blocks when there is no simulation at all', () => {
    for (const bad of [undefined, null, 0, 'x']) {
      const g = simulateGate(bad)
      expect(g.ready).toBe(false)
      expect(g.request).toBeNull()
      expect(g.reason).toMatch(/simulate-first/i)
    }
  })

  it('blocks and surfaces the revert reason when the simulation errored', () => {
    const g = simulateGate({ error: { shortMessage: 'ERC20: insufficient allowance' } })
    expect(g.ready).toBe(false)
    expect(g.reason).toBe('ERC20: insufficient allowance')
  })

  it('blocks while the simulation is still pending (no request yet)', () => {
    expect(simulateGate({ data: undefined }).ready).toBe(false)
    expect(simulateGate({ data: {} }).reason).toMatch(/pending/i)
  })

  it('is ready and returns the request only on a successful simulation', () => {
    const request = { address: '0xabc', functionName: 'fund' }
    const g = simulateGate({ data: { request } })
    expect(g.ready).toBe(true)
    expect(g.request).toBe(request)
    expect(g.reason).toBeNull()
  })
})

describe('revertReason — never a blank failure', () => {
  it('falls through shortMessage → details → message → String', () => {
    expect(revertReason(null)).toBe('unknown revert')
    expect(revertReason({ shortMessage: 'short' })).toBe('short')
    expect(revertReason({ details: 'details' })).toBe('details')
    expect(revertReason({ message: 'message' })).toBe('message')
    expect(revertReason('raw string error')).toBe('raw string error')
  })
})

describe('toUsdcBaseUnits — 6-decimal BigInt, never a float (BR-06)', () => {
  it('rejects a Number outright (float precision hazard)', () => {
    expect(() => toUsdcBaseUnits(2499.99)).toThrow(TypeError)
  })

  it('rejects malformed strings: letters, sign, exponent, too many decimals', () => {
    for (const bad of ['abc', '-5', '1e3', '1.2345678', '', '1.']) {
      expect(() => toUsdcBaseUnits(bad), bad).toThrow(RangeError)
    }
  })

  it('rejects zero and below', () => {
    expect(() => toUsdcBaseUnits('0')).toThrow(/greater than zero/)
    expect(() => toUsdcBaseUnits('0.000000')).toThrow(/greater than zero/)
  })

  it('converts valid amounts to base units (6-dec)', () => {
    expect(toUsdcBaseUnits('1500')).toBe(1_500_000000n)
    expect(toUsdcBaseUnits('2499.99')).toBe(2_499_990000n)
    expect(toUsdcBaseUnits(' 0.000001 ')).toBe(1n) // trims, 1 base unit
    expect(USDC_DECIMALS).toBe(6)
  })
})

describe('formatUsdc — BigInt in, display string out', () => {
  it('requires a BigInt', () => {
    expect(() => formatUsdc(1500000)).toThrow(TypeError)
  })
  it('formats base units back to a human string (round-trips)', () => {
    expect(formatUsdc(1_500_000000n)).toBe('1500')
    expect(formatUsdc(toUsdcBaseUnits('2499.99'))).toBe('2499.99')
  })
})

describe('fundsPolicy — testnet honesty (BR-09 / FR-042)', () => {
  it('labels Base mainnet as MAINNET moving real funds', () => {
    const p = fundsPolicy(8453)
    expect(p).toMatchObject({ label: 'MAINNET', isTestnet: false, movesRealFunds: true })
    expect(p.warning).toMatch(/real/i)
  })
  it('labels Base Sepolia as TESTNET, no real funds', () => {
    const p = fundsPolicy(84532)
    expect(p).toMatchObject({ label: 'TESTNET', isTestnet: true, movesRealFunds: false })
    expect(p.warning).toMatch(/no real funds/i)
  })
  it('labels an unsupported chain honestly (never silently "mainnet")', () => {
    const p = fundsPolicy(1)
    expect(p.label).toBe('UNSUPPORTED')
    expect(p.movesRealFunds).toBe(false)
  })
})
