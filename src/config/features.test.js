import { describe, it, expect } from 'vitest'
import { resolveFlag, FEATURE_DEFAULTS, FEATURES, isEnabled } from './features.js'

describe('feature-flag defaults (P1-21)', () => {
  it('ships the P1 MVP posture: book-a-call ON, every provisioning-gated rail OFF', () => {
    expect(FEATURE_DEFAULTS.bookACall).toBe(true)
    expect(FEATURE_DEFAULTS.escrow).toBe(false)
    expect(FEATURE_DEFAULTS.unlock).toBe(false)
    expect(FEATURE_DEFAULTS.ctf).toBe(false)
    expect(FEATURE_DEFAULTS.xmtp).toBe(false)
    // The resolved live set matches — no rail is silently lit.
    expect(FEATURES.ctf).toBe(false)
    expect(isEnabled('ctf')).toBe(false)
    expect(isEnabled('bookACall')).toBe(true)
  })

  it('resolves the correct VITE_FEATURE_<NAME> env key (camelCase → SNAKE)', () => {
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: 'true' })).toBe(true)
    expect(resolveFlag('bookACall', { VITE_FEATURE_BOOK_A_CALL: 'false' })).toBe(false)
  })

  it('only the literal string "true"/"false" overrides — a typo falls back to the default', () => {
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: '1' })).toBe(false) // not "true" → default OFF
    expect(resolveFlag('ctf', { VITE_FEATURE_CTF: 'TRUE' })).toBe(false)
    expect(resolveFlag('escrow', {})).toBe(false)
    expect(resolveFlag('bookACall', {})).toBe(true)
  })

  it('an unknown flag with no default resolves OFF (fail-closed)', () => {
    expect(resolveFlag('nope', {})).toBe(false)
  })
})
