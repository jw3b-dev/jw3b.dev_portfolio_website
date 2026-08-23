/*
 * drift-gate — the rules, tested in BOTH directions.
 *
 * The gate exists because this project kept finding stale planning rows by reading carefully, and
 * that detection method failed four times. A gate nobody has watched fail is the same kind of
 * comfort: it passes today, and nothing proves it would have caught the thing it was written for.
 *
 * So each rule is asserted to FIRE on the exact line that got through, and to stay quiet on the
 * lines that previously produced false positives — the two-out-of-two that forced rule one to be
 * tightened on its first run.
 */
import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
import { isCheckablePath, absenceClaims, metRequirements, statusDrift, scan } from '../../../scripts/drift-gate.mjs'

// Passed explicitly rather than relying on the module's own ROOT: under a Vite transform this file
// is served over http, and the derived root came back as "/@fs/…" — every scan found zero files
// and still reported a pass. The assertions below are what caught it.
const REPO = join(__dirname, '..', '..', '..')

const always = () => true

describe('isCheckablePath — only unambiguous repo paths', () => {
  it('accepts a real source path', () => {
    expect(isCheckablePath('src/lib/notes.js')).toBe(true)
  })

  it('rejects a bare code symbol, which is what prose usually means', () => {
    expect(isCheckablePath('writeContract')).toBe(false)
  })

  it('rejects globs, prose and URLs', () => {
    expect(isCheckablePath('src/components/audit/*')).toBe(false)
    expect(isCheckablePath('a file that does not exist')).toBe(false)
    expect(isCheckablePath('https://example.com/x.js')).toBe(false)
  })

  it('rejects a path with no source extension', () => {
    expect(isCheckablePath('src/lib/notes')).toBe(false)
  })
})

describe('absenceClaims (rule 1) — a planning row claiming a file is absent', () => {
  it('fires on the phrasing that actually shipped stale', () => {
    expect(absenceClaims('OPEN — there is no `src/lib/notes.js` yet.', always)).toEqual(['src/lib/notes.js'])
  })

  it('fires on the trailing form too', () => {
    expect(absenceClaims('`src/lib/notes.js` does not exist.', always)).toEqual(['src/lib/notes.js'])
  })

  it('stays quiet when the file really is absent', () => {
    expect(absenceClaims('there is no `src/lib/notes.js`', () => false)).toEqual([])
  })

  /*
   * The two false positives that forced the tightening. Both put an unrelated "no" earlier in the
   * line than a valid path; two bad findings out of two is a gate that gets switched off.
   */
  it('does not bind an unrelated negation to a later path across a table cell', () => {
    expect(absenceClaims('runs locally (no AI spend). `docs/OPS.md` documents it', always)).toEqual([])
    expect(absenceClaims('| no network calls | `src/lib/auditHeuristics.js` |', always)).toEqual([])
  })

  it('ignores a line marked as a visible correction', () => {
    expect(absenceClaims('✎ there is no `src/lib/notes.js`', always)).toEqual([])
    expect(absenceClaims('~~there is no `src/lib/notes.js`~~', always)).toEqual([])
  })
})

describe('metRequirements — reading MET out of REQUIREMENTS.md', () => {
  it('collects an FR whose row records it as met', () => {
    const md = '| **FR-066 ★** | …operate every surface | tests · **MET 2026-08-22.** | 04 | MUST |'
    expect([...metRequirements(md)]).toEqual(['FR-066'])
  })

  it('does not collect an FR that is merely listed', () => {
    const md = '| **FR-067 ★** | …zero console errors | `e2e/journeys.spec.js` | 03 | MUST |'
    expect(metRequirements(md).size).toBe(0)
  })

  it('survives empty or missing input rather than throwing', () => {
    expect(metRequirements('').size).toBe(0)
    expect(metRequirements(undefined).size).toBe(0)
  })
})

describe('statusDrift (rule 2) — a row calling a MET requirement open', () => {
  const met = new Set(['FR-066'])

  // The exact row that got through: P5-06 sat at "OPEN — owner-gated" for a day while both of its
  // surfaces were shipped and tested, and rule 1 could not see it because it names no file.
  it('fires on the row that got through', () => {
    const row = '| **P5-06** Live ecosystem data | **OPEN — owner-gated.** The same item as FR-066. | FR-066 |'
    expect(statusDrift(row, met)).toBe('FR-066')
    expect(absenceClaims(row, always)).toEqual([])
  })

  it('fires on BLOCKED as well as OPEN', () => {
    expect(statusDrift('- **status:** **BLOCKED** — needs an endpoint. FR-066', met)).toBe('FR-066')
  })

  it('stays quiet for an FR that is not marked met', () => {
    expect(statusDrift('**BLOCKED** on funding. FR-067', met)).toBe(null)
  })

  it('stays quiet on prose that merely mentions a met FR', () => {
    expect(statusDrift('FR-066 was blocked for a month on a misdiagnosis.', met)).toBe(null)
  })

  it('ignores a line marked as a visible correction', () => {
    expect(statusDrift('✎ **OPEN — owner-gated.** FR-066', met)).toBe(null)
    expect(statusDrift('~~**BLOCKED** FR-066~~', met)).toBe(null)
  })
})

describe('scan — the repo as it stands', () => {
  it('is clean, and read REQUIREMENTS.md to get there', () => {
    const { met, violations, stale } = scan(REPO)
    // An empty met-set would make rule 2 vacuous while still reporting a pass.
    expect(met.size).toBeGreaterThan(0)
    expect(violations).toEqual([])
    expect(stale).toEqual([])
  })
})
