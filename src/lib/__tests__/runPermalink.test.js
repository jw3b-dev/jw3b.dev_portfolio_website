/*
 * runPermalink (brief 05, next-need 2).
 *
 * The property the whole design rests on: a link is SELF-VERIFYING — it carries the source, so the
 * recipient re-derives the findings rather than trusting a list. So the round-trip must be exact,
 * and anything it cannot carry must refuse loudly instead of truncating (a shortened contract
 * screens differently from the one the sender saw, which is the worst possible failure here).
 */
import { describe, it, expect } from 'vitest'
import {
  encodeRun, decodeRun, permalinkFor, runFromHash, permalinkRefusal, PERMALINK_CAP, PERMALINK_PARAM,
} from '../runPermalink.js'

const CONTRACT = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
contract Vault { function withdraw() external { } }
`

describe('round trip — exact, or nothing', () => {
  it('restores the source byte for byte', () => {
    expect(decodeRun(encodeRun(CONTRACT))).toBe(CONTRACT)
  })

  it('survives non-ASCII, which btoa alone would throw on', () => {
    const src = '// © 2026 — naïve “quotes” and an emoji 🔒\ncontract A {}'
    expect(decodeRun(encodeRun(src))).toBe(src)
  })

  it('produces a URL-safe payload needing no escaping', () => {
    const enc = encodeRun(CONTRACT)
    expect(enc).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(enc).not.toContain('=')
  })
})

describe('refusals — a bad link must never yield a partial contract', () => {
  it('refuses empty or whitespace source', () => {
    expect(encodeRun('')).toBeNull()
    expect(encodeRun('   ')).toBeNull()
    expect(encodeRun(null)).toBeNull()
  })

  it('refuses source over the cap rather than truncating it', () => {
    const big = 'a'.repeat(PERMALINK_CAP + 1)
    expect(encodeRun(big)).toBeNull()
    expect(permalinkFor(big, 'https://jw3b.dev/audit')).toBeNull()
    expect(permalinkRefusal(big)).toMatch(/too large/i)
  })

  it('accepts source exactly at the cap — an off-by-one here silently drops valid links', () => {
    expect(encodeRun('a'.repeat(PERMALINK_CAP))).toBeTruthy()
  })

  it('decodes malformed input to null, not to garbage', () => {
    expect(decodeRun('!!!not base64!!!')).toBeNull()
    expect(decodeRun('')).toBeNull()
    expect(decodeRun(null)).toBeNull()
  })

  it('states a reason only when there IS one', () => {
    expect(permalinkRefusal(CONTRACT)).toBeNull()
    expect(permalinkRefusal('')).toMatch(/nothing to link/i)
  })
})

describe('permalinkFor / runFromHash', () => {
  it('builds a fragment URL — the fragment is the part no server ever receives', () => {
    const url = permalinkFor(CONTRACT, 'https://jw3b.dev/audit')
    expect(url.startsWith(`https://jw3b.dev/audit#${PERMALINK_PARAM}=`)).toBe(true)
    // Everything after '#' — nothing lands in the path or the query, where it would be logged.
    expect(url.split('#')[0]).toBe('https://jw3b.dev/audit')
  })

  it('replaces an existing fragment rather than appending a second one', () => {
    const url = permalinkFor(CONTRACT, 'https://jw3b.dev/audit#stale')
    expect(url.split('#')).toHaveLength(2)
  })

  it('reads the run back out of a hash, with or without the leading #', () => {
    const enc = encodeRun(CONTRACT)
    expect(runFromHash(`#${PERMALINK_PARAM}=${enc}`)).toBe(CONTRACT)
    expect(runFromHash(`${PERMALINK_PARAM}=${enc}`)).toBe(CONTRACT)
  })

  it('ignores other fragment keys and returns null when ours is absent', () => {
    const enc = encodeRun(CONTRACT)
    expect(runFromHash(`#contact&${PERMALINK_PARAM}=${enc}`)).toBe(CONTRACT)
    expect(runFromHash('#contact')).toBeNull()
    expect(runFromHash('')).toBeNull()
  })
})

describe('encodeRun — fails closed if the platform encoder throws', () => {
  it('returns null rather than propagating', () => {
    // A link that cannot be built must produce NO link. Throwing here would take down the run
    // panel over a share button.
    const real = globalThis.TextEncoder
    globalThis.TextEncoder = class { encode() { throw new Error('no encoder') } }
    try {
      expect(encodeRun('contract A {}')).toBeNull()
      expect(permalinkFor('contract A {}', 'https://jw3b.dev/audit')).toBeNull()
    } finally {
      globalThis.TextEncoder = real
    }
  })
})
