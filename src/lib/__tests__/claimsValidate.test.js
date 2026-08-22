/*
 * The forbidden blocklist (brief 02, next-need 2 — now rendered on /evidence).
 *
 * The list of claims this site refuses to make is shown to visitors, with a reason per rule. That
 * creates a trap the tests here close: a REASON that itself trips its own pattern would fail the
 * claims gate the instant the /evidence page rendered. So every `why` is scanned by the real
 * scanner, and the derived `FORBIDDEN_PATTERNS` is proven to be exactly the rules' patterns — one
 * source, not two hand-maintained lists that drift.
 */
import { describe, it, expect } from 'vitest'
import { FORBIDDEN_RULES, FORBIDDEN_PATTERNS, scanTextForForbidden } from '../claimsValidate.js'

describe('FORBIDDEN_RULES — the blocklist can be RENDERED without tripping itself', () => {
  it('no reason text matches any forbidden pattern — or the /evidence page would fail the gate it explains', () => {
    for (const r of FORBIDDEN_RULES) {
      const hits = scanTextForForbidden(r.why)
      expect(hits, `reason for ${r.pattern} trips [${hits}]`).toEqual([])
    }
  })
  it('every rule has a reason a reader can use', () => {
    for (const r of FORBIDDEN_RULES) expect(r.why.trim().length).toBeGreaterThan(20)
  })
  it('FORBIDDEN_PATTERNS is derived from the rules, not a second list', () => {
    expect(FORBIDDEN_PATTERNS).toHaveLength(FORBIDDEN_RULES.length)
    FORBIDDEN_PATTERNS.forEach((p, i) => expect(p).toBe(FORBIDDEN_RULES[i].pattern))
  })
})
