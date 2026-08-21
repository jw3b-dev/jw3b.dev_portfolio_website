import { describe, it, expect } from 'vitest'
import { isRealAddress, escrowProvisioned, ESCROW, PROVIDER_WALLET, USDC_ADDRESS, unlockLockFor, unlockProvisioned } from './contracts.js'

describe('contracts config — provisioning gate (P2-04 / FR-032)', () => {
  it('isRealAddress accepts a real 40-hex address', () => {
    expect(isRealAddress('0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913')).toBe(true)
  })

  it('isRealAddress rejects null, the zero address, wrong length, and non-strings', () => {
    expect(isRealAddress(null)).toBe(false)
    expect(isRealAddress('0x0000000000000000000000000000000000000000')).toBe(false) // zero ≠ deployed
    expect(isRealAddress('0x1234')).toBe(false)
    expect(isRealAddress(123)).toBe(false)
  })

  it('escrow IS provisioned (deployed 2026-08-21) and points at a real address + payee', () => {
    expect(isRealAddress(ESCROW.address)).toBe(true)
    expect(isRealAddress(PROVIDER_WALLET)).toBe(true)
    expect(escrowProvisioned()).toBe(true)
  })

  it('escrow is wired to a TESTNET chain with its matching USDC — honesty is structural', () => {
    // The deployed escrow is Base Sepolia; the UI badge derives from this chainId alone
    // (fundsPolicy → TESTNET), so no surface can label it "mainnet" by accident. A mainnet
    // swap must change BOTH the address and the chainId, and this test is the tripwire.
    expect(ESCROW.chainId).toBe(84532)
    expect(isRealAddress(USDC_ADDRESS[ESCROW.chainId])).toBe(true)
  })

  it('Unlock is NOT provisioned until a real lock is set (offer hides → floor)', () => {
    expect(unlockLockFor('anything')).toBeNull()
    expect(unlockProvisioned()).toBe(false)
  })
})
