import { describe, it, expect } from 'vitest'
import { isRealAddress, escrowProvisioned, ESCROW, PROVIDER_WALLET } from './contracts.js'

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

  it('escrow is NOT provisioned until a real address is set (degrade-to-floor default)', () => {
    // Ships unprovisioned by design — the rail degrades to book-a-call until John deploys.
    expect(ESCROW.address).toBeNull()
    expect(PROVIDER_WALLET).toBeNull()
    expect(escrowProvisioned()).toBe(false)
  })
})
