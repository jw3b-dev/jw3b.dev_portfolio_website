import { describe, it, expect } from 'vitest'
import { unlockOfferable, unlockCheckoutConfig, isUnlockedEvent, UNLOCK_SCRIPT_SRC } from '../unlockPaywall.js'

const lock = { address: '0xabc0000000000000000000000000000000000001', chainId: 8453, network: 8453 }

describe('unlockOfferable — offer only on a real lock (FR-034)', () => {
  it('true only when enabled AND a lock is present', () => {
    expect(unlockOfferable({ enabled: true, lock })).toBe(true)
  })
  it('false when disabled, lock missing, or args absent', () => {
    expect(unlockOfferable({ enabled: false, lock })).toBe(false)
    expect(unlockOfferable({ enabled: true, lock: null })).toBe(false)
    expect(unlockOfferable({ enabled: true, lock: {} })).toBe(false)
    expect(unlockOfferable()).toBe(false)
  })
})

describe('unlockCheckoutConfig — window.unlockProtocol.loadCheckoutModal payload', () => {
  it('builds a pessimistic config keyed by the lock address + network', () => {
    const cfg = unlockCheckoutConfig(lock, { title: 'Pro' })
    expect(cfg.pessimistic).toBe(true)
    expect(cfg.title).toBe('Pro')
    expect(cfg.locks[lock.address]).toEqual({ network: 8453 })
  })
  it('falls back to chainId when network is absent, and omits icon unless given', () => {
    const cfg = unlockCheckoutConfig({ address: lock.address, chainId: 84532 })
    expect(cfg.locks[lock.address]).toEqual({ network: 84532 })
    expect('icon' in cfg).toBe(false)
    expect(unlockCheckoutConfig(lock, { icon: 'x.png' }).icon).toBe('x.png')
  })
  it('throws rather than build a config for a missing lock', () => {
    expect(() => unlockCheckoutConfig(null)).toThrow()
    expect(() => unlockCheckoutConfig({})).toThrow()
  })
})

describe('unlock state event + script', () => {
  it('isUnlockedEvent is true only for a confirmed unlock', () => {
    expect(isUnlockedEvent('unlocked')).toBe(true)
    expect(isUnlockedEvent('locked')).toBe(false)
    expect(isUnlockedEvent(undefined)).toBe(false)
  })
  it('points at the official Unlock paywall script (CSP-allowed host)', () => {
    expect(UNLOCK_SCRIPT_SRC).toMatch(/^https:\/\/paywall\.unlock-protocol\.com\//)
  })
})
