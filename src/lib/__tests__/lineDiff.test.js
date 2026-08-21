import { describe, it, expect } from 'vitest'
import { diffLines, collapseUnchanged, DIFF_TYPE, DIFF_LINE_CAP } from '../lineDiff.js'

const types = (rows) => rows.map((r) => r.type).join('')
const textOf = (rows, type) => rows.filter((r) => r.type === type).map((r) => r.text)

describe('diffLines', () => {
  it('reports nothing changed for identical sources', () => {
    const d = diffLines('a\nb\nc', 'a\nb\nc')
    expect(d).toMatchObject({ added: 0, removed: 0, truncated: false })
    expect(types(d.rows)).toBe('ctxctxctx')
  })

  it('finds an inserted line and keeps the surrounding context', () => {
    const d = diffLines('a\nc', 'a\nb\nc')
    expect(d.added).toBe(1)
    expect(d.removed).toBe(0)
    expect(textOf(d.rows, DIFF_TYPE.ADD)).toEqual(['b'])
  })

  it('finds a removed line', () => {
    const d = diffLines('a\nb\nc', 'a\nc')
    expect(d.removed).toBe(1)
    expect(textOf(d.rows, DIFF_TYPE.DEL)).toEqual(['b'])
  })

  it('reads a MOVED line as one removal and one addition — the CEI fix in miniature', () => {
    const before = 'call();\nbalances = 0;'
    const after = 'balances = 0;\ncall();'
    const d = diffLines(before, after)
    // Assert the PROPERTY, not which of the two equally-minimal answers the LCS happens to pick:
    // a pure move is one removal and one addition of the SAME line. Pinning it to `balances = 0;`
    // would have been asserting an implementation detail — the table is just as entitled to move
    // `call();` instead, and does.
    expect(d.added).toBe(1)
    expect(d.removed).toBe(1)
    expect(textOf(d.rows, DIFF_TYPE.ADD)).toEqual(textOf(d.rows, DIFF_TYPE.DEL))
  })

  it('carries 1-based line numbers on each side', () => {
    const d = diffLines('a\nb', 'a\nB')
    const ctx = d.rows.find((r) => r.type === DIFF_TYPE.CTX)
    expect(ctx).toMatchObject({ before: 1, after: 1 })
    expect(d.rows.find((r) => r.type === DIFF_TYPE.DEL)).toMatchObject({ before: 2, after: null })
    expect(d.rows.find((r) => r.type === DIFF_TYPE.ADD)).toMatchObject({ before: null, after: 2 })
  })

  it('drains trailing lines when one side simply stops', () => {
    expect(diffLines('a\nb\nc', 'a').removed).toBe(2) // tail deletions
    expect(diffLines('a', 'a\nb\nc').added).toBe(2) // tail additions
  })

  it('handles an empty side in both directions', () => {
    expect(diffLines('', 'a\nb').added).toBe(2)
    expect(diffLines('a\nb', '').removed).toBe(2)
    expect(diffLines(null, undefined)).toMatchObject({ added: 0, removed: 0 })
  })

  it('reports a summary instead of building a table for a pathological paste', () => {
    const huge = Array.from({ length: DIFF_LINE_CAP + 1 }, (_, i) => `line ${i}`).join('\n')
    const d = diffLines(huge, huge + '\nmore')
    expect(d.truncated).toBe(true)
    expect(d.rows).toEqual([])
  })
})

describe('collapseUnchanged', () => {
  const many = (n, tag) => Array.from({ length: n }, (_, i) => ({ type: DIFF_TYPE.CTX, text: `${tag}${i}` }))

  it('keeps context either side of a change and elides the rest behind a counted marker', () => {
    const rows = [...many(10, 'a'), { type: DIFF_TYPE.ADD, text: 'new' }, ...many(10, 'b')]
    const out = collapseUnchanged(rows, 2)
    expect(out.filter((r) => r.type === 'gap')).toHaveLength(2)
    expect(out.filter((r) => r.type === 'gap').map((r) => r.gap)).toEqual([8, 8])
    expect(out.filter((r) => r.type === DIFF_TYPE.ADD)).toHaveLength(1)
    // Nothing vanishes silently: every elided line is counted in a marker.
    const shown = out.filter((r) => r.type !== 'gap').length
    const elided = out.filter((r) => r.type === 'gap').reduce((n, r) => n + r.gap, 0)
    expect(shown + elided).toBe(rows.length)
  })

  it('collapses an all-unchanged diff to a single marker', () => {
    expect(collapseUnchanged(many(6, 'x'), 2)).toEqual([{ type: 'gap', gap: 6 }])
  })

  it('returns an empty list untouched', () => {
    expect(collapseUnchanged([], 2)).toEqual([])
  })
})
