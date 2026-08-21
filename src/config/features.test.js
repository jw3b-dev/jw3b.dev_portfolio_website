import { describe, it, expect } from 'vitest'
import { resolveFlag, FEATURE_DEFAULTS, FEATURES, isEnabled } from './features.js'

describe('feature-flag defaults (P1-21)', () => {
  it('ships the current posture: floor + live CTF ON, money rails OFF', () => {
    expect(FEATURE_DEFAULTS.bookACall).toBe(true)
    // CTF went live 2026-08-21: its Base Sepolia vault is deployed and its bait topped up.
    expect(FEATURE_DEFAULTS.ctf).toBe(true)
    expect(FEATURES.ctf).toBe(true)
    expect(isEnabled('ctf')).toBe(true)
    expect(isEnabled('bookACall')).toBe(true)
  })

  it('keeps every MONEY rail off — a testnet escrow must never take a real engagement', () => {
    // The escrow contract IS deployed, but only on TESTNET; lighting this flag in production
    // would route a paying client through a demo. Unlock still has no real locks. This test is
    // the guard: flipping either on must be a deliberate edit here, with mainnet provisioning.
    expect(FEATURE_DEFAULTS.escrow).toBe(false)
    expect(FEATURE_DEFAULTS.unlock).toBe(false)
    expect(FEATURE_DEFAULTS.xmtp).toBe(false)
    expect(isEnabled('escrow')).toBe(false)
    expect(isEnabled('unlock')).toBe(false)
  })

  it('resolves the correct VITE_FEATURE_<NAME> env key (camelCase → SNAKE)', () => {
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: 'true' })).toBe(true)
    expect(resolveFlag('bookACall', { VITE_FEATURE_BOOK_A_CALL: 'false' })).toBe(false)
  })

  it('only the literal string "true"/"false" overrides — a typo falls back to the default', () => {
    // Checked in BOTH directions, so the assertion holds whatever a flag's default becomes:
    // a malformed value never flips a rail on, and never silently turns a live one off.
    expect(resolveFlag('escrow', { VITE_FEATURE_ESCROW: '1' })).toBe(false) // not "true" → default OFF
    expect(resolveFlag('escrow', { VITE_FEATURE_ESCROW: 'TRUE' })).toBe(false)
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: '0' })).toBe(true) // not "false" → default ON
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: 'FALSE' })).toBe(true)
    expect(resolveFlag('escrow', {})).toBe(false)
    expect(resolveFlag('bookACall', {})).toBe(true)
  })

  it('an unknown flag with no default resolves OFF (fail-closed)', () => {
    expect(resolveFlag('nope', {})).toBe(false)
  })
})
