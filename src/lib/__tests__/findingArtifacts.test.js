import { describe, it, expect } from 'vitest'
import {
  OWNER_HANDLE,
  slugFromPath,
  locate,
  publishable,
  buildArtifact,
  buildIndex,
} from '../findingArtifacts.js'
import { CONTESTS, selectedByJohn } from '../../data/codehawks-contests.js'

/*
 * The publishing rule is the whole module.
 *
 * A CodeHawks finding is credited to everyone who validly reported it; Cyfrin publishes ONE
 * write-up as canonical. Only when that one is John's is the prose his to republish.
 * mas/facts/PORTFOLIO_REFERENCE.md §1b asserted a contest report was "publishable as a sample
 * audit report" when it was ~70 researchers' work — acting on that sentence would have put two
 * other people's findings on this site under his name. These tests are that near-miss, frozen.
 */
const BODY = '## Root + Impact\n\nSomething true about a bug.'

describe('slugFromPath', () => {
  it('takes the basename and drops the extension', () => {
    expect(slugFromPath('../content/findings/50-L-01.md')).toBe('50-L-01')
    expect(slugFromPath('50-L-01.MD')).toBe('50-L-01')
  })
  it('survives an empty or odd path rather than throwing', () => {
    expect(slugFromPath()).toBe('')
    expect(slugFromPath('/')).toBe('')
  })
})

describe('locate — metadata comes from the register-backed data, never from the markdown', () => {
  it('resolves a real contest + finding', () => {
    const found = locate('50-L-01')
    expect(found.contest.flight).toBe(50)
    expect(found.finding.id).toBe('L-01')
  })
  it('is case-insensitive on the finding id', () => {
    expect(locate('50-l-01').finding.id).toBe('L-01')
  })
  it('rejects a malformed slug', () => {
    for (const s of ['', 'nonsense', '50', 'L-01', '50-X-01', '50-L-1x']) {
      expect(locate(s)).toBeNull()
    }
  })
  it('rejects a contest that is not in the record', () => {
    expect(locate('99-H-01')).toBeNull()
  })
  it('rejects a finding that contest does not have', () => {
    expect(locate('50-H-99')).toBeNull()
  })
})

describe('publishable — the rule', () => {
  const selected = selectedByJohn()[0]
  const other = CONTESTS.flatMap((c) => c.findings).find((f) => f.selected !== OWNER_HANDLE)

  it('publishes a finding whose selected submission is John’s', () => {
    expect(publishable({ body: BODY, finding: selected })).toBe(true)
  })

  it('REFUSES a finding selected from another researcher, however real the finding is', () => {
    // John validly reported every one of these. That makes the FINDING his; it does not make the
    // published WRITE-UP his, and this page publishes prose.
    expect(other.selected).not.toBe(OWNER_HANDLE)
    expect(publishable({ body: BODY, finding: other })).toBe(false)
  })

  it('refuses an empty body — an artifact page with no artifact is theatre', () => {
    expect(publishable({ body: '', finding: selected })).toBe(false)
    expect(publishable({ body: '   \n  ', finding: selected })).toBe(false)
  })

  it('refuses a null entry rather than throwing', () => {
    expect(publishable(null)).toBe(false)
    expect(publishable(undefined)).toBe(false)
  })
})

describe('buildArtifact', () => {
  it('builds a publishable artifact with metadata from the data module', () => {
    const a = buildArtifact('../content/findings/50-L-01.md', BODY)
    expect(a.slug).toBe('50-L-01')
    expect(a.severity).toBe('Low')
    expect(a.contest.flight).toBe(50)
    expect(a.title).toMatch(/^L-01 — /)
    expect(a.body).toBe(BODY)
  })

  it('returns null for an unlocatable slug', () => {
    expect(buildArtifact('../content/findings/whatever.md', BODY)).toBeNull()
  })

  it('returns null for a finding John did not have selected', () => {
    const notHis = CONTESTS.flatMap((c) => c.findings.map((f) => ({ c, f })))
      .find(({ f }) => f.selected !== OWNER_HANDLE)
    expect(buildArtifact(`${notHis.c.flight}-${notHis.f.id}.md`, BODY)).toBeNull()
  })

  it('treats a missing body as unpublishable', () => {
    expect(buildArtifact('50-L-01.md', undefined)).toBeNull()
  })
})

describe('buildIndex', () => {
  it('is empty for no modules — which registers no route at all', () => {
    expect(buildIndex()).toEqual([])
    expect(buildIndex({})).toEqual([])
  })

  it('drops unpublishable entries and keeps the rest', () => {
    const idx = buildIndex({
      '../content/findings/50-L-01.md': BODY,
      '../content/findings/42-H-01.md': BODY, // selected by nomadic_bear — must not publish
      '../content/findings/bogus.md': BODY,
    })
    expect(idx.map((a) => a.slug)).toEqual(['50-L-01'])
  })

  it('sorts newest contest first so ordering does not depend on the filesystem', () => {
    // Only ONE finding is currently selected-by-John, so two distinct paths resolving to the same
    // finding is the only way to exercise the comparator today. Stated plainly rather than dressed
    // up: this asserts the ordering INVARIANT holds, and it starts discriminating for real the
    // moment a second contest's write-up is published (#43 / #48 / #53 are still to be fetched).
    const idx = buildIndex({
      'a/50-L-01.md': BODY,
      'b/50-L-01.md': BODY,
    })
    expect(idx).toHaveLength(2)
    expect(idx.every((a, i, all) => i === 0 || all[i - 1].contest.flight >= a.contest.flight)).toBe(true)
  })
})

describe('the shipped content', () => {
  it('every published artifact is one John had selected', async () => {
    // Guards the real glob, not a fixture: if a markdown file is ever added for a finding that is
    // not his, the site must not carry it.
    const { ARTIFACTS } = await import('../findingArtifactsIndex.js')
    expect(ARTIFACTS.length).toBeGreaterThan(0)
    for (const a of ARTIFACTS) expect(a.finding.selected).toBe(OWNER_HANDLE)
  })
})
