/*
 * P5-04 — the notes content pipeline.
 *
 * The point of this module is that publishing becomes a file rather than an engineering task, so
 * the assertions worth having are about what happens when a file is WRONG: no title, a draft
 * flag, a malformed date, an empty body. Each of those must drop the note rather than ship a
 * half-rendered page, because a broken note is worse than an unpublished one.
 */
import { describe, it, expect } from 'vitest'
import { parseFrontmatter, slugFromPath, buildNote, buildIndex, noteBySlug, noteJsonLd } from '../notes.js'

const note = (extra = '') => `---
title: A Real Note
date: 2026-08-01
description: What it is about.
${extra}---

# Heading

Body text.`

describe('P5-04: frontmatter parsing', () => {
  it('splits metadata from body', () => {
    const { meta, body } = parseFrontmatter(note())
    expect(meta).toEqual({ title: 'A Real Note', date: '2026-08-01', description: 'What it is about.' })
    expect(body).toMatch(/^# Heading/)
  })

  it('treats a file with no frontmatter as pure body', () => {
    expect(parseFrontmatter('just text')).toEqual({ meta: {}, body: 'just text' })
    expect(parseFrontmatter()).toEqual({ meta: {}, body: '' })
  })

  it('ignores unknown keys instead of rendering them', () => {
    const { meta } = parseFrontmatter('---\ntitle: T\nonclick: alert(1)\nauthor: someone\n---\nbody')
    expect(meta).toEqual({ title: 'T' })
    expect(meta.onclick).toBeUndefined()
  })

  it('strips surrounding quotes and tolerates CRLF', () => {
    const { meta } = parseFrontmatter('---\r\ntitle: "Quoted"\r\n---\r\nbody')
    expect(meta.title).toBe('Quoted')
  })

  it('skips malformed lines rather than failing the file', () => {
    const { meta } = parseFrontmatter('---\ntitle: T\nnot a pair\n: novalue\n---\nbody')
    expect(meta).toEqual({ title: 'T' })
  })
})

describe('P5-04: a wrong file is DROPPED, never half-published', () => {
  it('builds a complete note', () => {
    expect(buildNote('../content/notes/my-piece.md', note())).toMatchObject({
      slug: 'my-piece', title: 'A Real Note', date: '2026-08-01', path: '/notes/my-piece',
    })
  })

  it('drops a note with no title — there is nothing to put in <title> or the sitemap', () => {
    expect(buildNote('x/a.md', '---\ndate: 2026-08-01\n---\nbody')).toBeNull()
    expect(buildNote('x/a.md', '---\ntitle:   \n---\nbody')).toBeNull()
  })

  it('drops an explicit draft', () => {
    expect(buildNote('x/a.md', note('draft: true\n'))).toBeNull()
    expect(buildNote('x/a.md', note('draft: TRUE\n'))).toBeNull()
    expect(buildNote('x/a.md', note('draft: false\n'))).not.toBeNull()
  })

  it('drops an empty body', () => {
    expect(buildNote('x/a.md', '---\ntitle: T\n---\n')).toBeNull()
  })

  it('drops a malformed date rather than rendering garbage', () => {
    expect(buildNote('x/a.md', '---\ntitle: T\ndate: not-a-date\n---\nbody').date).toBeNull()
  })

  it('derives the slug from the filename regardless of glob shape', () => {
    expect(slugFromPath('../content/notes/deep/a-b.md')).toBe('a-b')
    expect(slugFromPath('a.MD')).toBe('a')
    expect(slugFromPath('')).toBe('')
  })
})

describe('P5-04: the index', () => {
  const mods = {
    'n/old.md': '---\ntitle: Old\ndate: 2026-01-01\n---\nbody',
    'n/new.md': '---\ntitle: New\ndate: 2026-08-01\n---\nbody',
    'n/undated.md': '---\ntitle: Undated\n---\nbody',
    'n/broken.md': '---\ndate: 2026-08-02\n---\nbody',
  }

  it('publishes only valid notes, newest first, undated last', () => {
    expect(buildIndex(mods).map((n) => n.slug)).toEqual(['new', 'old', 'undated'])
  })

  it('accepts both raw strings and module objects with .default', () => {
    expect(buildIndex({ 'n/a.md': { default: note() } })).toHaveLength(1)
  })

  it('drops an entry whose contents are null/undefined rather than throwing', () => {
    expect(buildIndex({ 'n/a.md': null, 'n/b.md': undefined, 'n/c.md': {} })).toEqual([])
  })

  it('ZERO notes is a first-class state — an empty list, never a placeholder', () => {
    expect(buildIndex({})).toEqual([])
    expect(buildIndex()).toEqual([])
  })

  it('keeps a dated note above an undated one whichever order they are declared in', () => {
    // Both directions, because the comparator has a branch per side and the glob's key order
    // decides which one runs — the fixtures above only ever exercised one of them.
    expect(buildIndex({ 'n/d.md': '---\ntitle: D\ndate: 2026-05-05\n---\nx', 'n/u.md': '---\ntitle: U\n---\nx' })
      .map((n) => n.title)).toEqual(['D', 'U'])
    expect(buildIndex({ 'n/u.md': '---\ntitle: U\n---\nx', 'n/d.md': '---\ntitle: D\ndate: 2026-05-05\n---\nx' })
      .map((n) => n.title)).toEqual(['D', 'U'])
  })

  it('sorts undated notes by title so the order is stable', () => {
    const two = buildIndex({ 'n/b.md': '---\ntitle: B\n---\nx', 'n/a.md': '---\ntitle: A\n---\nx' })
    expect(two.map((n) => n.title)).toEqual(['A', 'B'])
  })

  it('looks up by slug and returns null for a bad URL rather than throwing', () => {
    const idx = buildIndex(mods)
    expect(noteBySlug(idx, 'new').title).toBe('New')
    expect(noteBySlug(idx, 'nope')).toBeNull()
  })
})

describe('P5-04: SEO', () => {
  it('emits JSON-LD with only the fields the note has', () => {
    const n = buildNote('n/a.md', note())
    expect(noteJsonLd(n)).toMatchObject({
      '@type': 'BlogPosting', headline: 'A Real Note', url: 'https://jw3b.dev/notes/a',
      datePublished: '2026-08-01', description: 'What it is about.',
    })
  })

  it('omits date and description when absent', () => {
    const n = buildNote('n/a.md', '---\ntitle: T\n---\nbody')
    const ld = noteJsonLd(n)
    expect(ld.datePublished).toBeUndefined()
    expect(ld.description).toBeUndefined()
  })

  it('returns null for no note', () => {
    expect(noteJsonLd(null)).toBeNull()
  })
})
