import { describe, it, expect } from 'vitest'
import { splitSections, sectionId } from '../markdownSections.js'

// Shaped like the real /audit output: a document title, several ## parts, and Solidity
// samples full of comments — the case that motivated this.
const AUDIT = `# Treasury Contract Security Analysis

The inline BUG comment is accurate.

## Critical Finding: Missing Access Control

The \`sweep()\` function has no access control.

### The Vulnerability

Any caller can drain it.

## Concrete Fix

\`\`\`solidity
// SPDX-License-Identifier: MIT
# this hash is inside a fence and must NOT split
contract Treasury {}
\`\`\`

## Summary

One required fix.`

describe('splitSections', () => {
  it('returns nothing for empty or non-string input', () => {
    for (const bad of ['', '   ', null, undefined, 42]) expect(splitSections(bad)).toEqual([])
  })

  it('splits on ## when a lone # title would swallow the document', () => {
    const s = splitSections(AUDIT)
    expect(s.map((x) => x.title)).toEqual([
      'Overview',
      'Critical Finding: Missing Access Control',
      'Concrete Fix',
      'Summary',
    ])
  })

  it('keeps the lede before the first heading as its own section', () => {
    const s = splitSections(AUDIT)
    expect(s[0].title).toBe('Overview')
    expect(s[0].body).toContain('inline BUG comment')
  })

  it('NEVER splits on a # inside a fenced code block', () => {
    const fix = splitSections(AUDIT).find((x) => x.title === 'Concrete Fix')
    expect(fix.body).toContain('this hash is inside a fence')
    expect(splitSections(AUDIT).some((x) => x.title.includes('this hash'))).toBe(false)
  })

  it('keeps deeper headings inside their parent section rather than making tabs of them', () => {
    const crit = splitSections(AUDIT).find((x) => x.title.startsWith('Critical Finding'))
    expect(crit.body).toContain('### The Vulnerability')
  })

  it('drops the heading line from the body — the tab label already carries it', () => {
    const sum = splitSections(AUDIT).find((x) => x.title === 'Summary')
    expect(sum.body).toBe('One required fix.')
  })

  it('returns a single section for a document with no headings at all', () => {
    const s = splitSections('just a plain paragraph')
    expect(s).toHaveLength(1)
    expect(s[0].body).toBe('just a plain paragraph')
  })

  it('handles a document whose only headings are one level', () => {
    const s = splitSections('## A\nalpha\n## B\nbeta')
    expect(s.map((x) => x.title)).toEqual(['A', 'B'])
  })

  it('falls back to the single available level when only one heading exists', () => {
    const s = splitSections('# Only\nbody text')
    expect(s).toHaveLength(1)
    expect(s[0].title).toBe('Only')
    expect(s[0].body).toBe('body text')
  })

  it('tolerates unclosed fences without hanging or splitting inside them', () => {
    const s = splitSections('## A\n```\n# not a heading\nstill code')
    expect(s.map((x) => x.title)).toEqual(['A'])
  })

  it('gives every section a unique id', () => {
    const s = splitSections('## Same\nx\n## Same\ny')
    expect(new Set(s.map((x) => x.id)).size).toBe(s.length)
  })

  it('keeps a section id STABLE as later sections stream in', () => {
    // A reader's open tab must survive the document growing underneath them.
    const early = splitSections('## Finding\nbody\n## Fix\nbody')
    const later = splitSections('## Finding\nbody\n## Fix\nbody\n## Summary\nmore')
    const idOf = (secs, t) => secs.find((x) => x.title === t).id
    expect(idOf(early, 'Finding')).toBe(idOf(later, 'Finding'))
    expect(idOf(early, 'Fix')).toBe(idOf(later, 'Fix'))
  })

  it('honours a custom preamble title', () => {
    const s = splitSections('lede\n## A\nx', { preambleTitle: 'Summary' })
    expect(s[0].title).toBe('Summary')
  })
})

describe('sectionId', () => {
  it('slugifies a title and stays unique by index', () => {
    expect(sectionId('Concrete Fix!', 2)).toBe('concrete-fix')
    expect(sectionId('  Spaced  ', 0)).toBe('spaced')
  })
  it('falls back for titles with no usable characters', () => {
    expect(sectionId('###', 1)).toBe('section-1')
    expect(sectionId('', 3)).toBe('section-3')
    expect(sectionId(null, 4)).toBe('section-4')
  })
})
