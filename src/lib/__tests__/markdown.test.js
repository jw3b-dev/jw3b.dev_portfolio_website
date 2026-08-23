import { describe, it, expect } from 'vitest'
import { parseMarkdown } from '../markdown.js'

describe('parseMarkdown — content subset parser', () => {
  it('returns [] for empty / default input', () => {
    expect(parseMarkdown()).toEqual([])
    expect(parseMarkdown('')).toEqual([])
    expect(parseMarkdown('\n\n  \n')).toEqual([])
  })

  it('parses headings at three levels', () => {
    expect(parseMarkdown('# Title\n## Section\n### Sub')).toEqual([
      { type: 'h1', text: 'Title' },
      { type: 'h2', text: 'Section' },
      { type: 'h3', text: 'Sub' },
    ])
  })

  it('joins wrapped lines into a single paragraph and separates on a blank line', () => {
    const out = parseMarkdown('one\ntwo\n\nthree')
    expect(out).toEqual([
      { type: 'p', text: 'one two' },
      { type: 'p', text: 'three' },
    ])
  })

  it('groups consecutive bullets into one list and closes it on the next block', () => {
    const out = parseMarkdown('- a\n- b\ntail')
    expect(out).toEqual([
      { type: 'ul', items: ['a', 'b'] },
      { type: 'p', text: 'tail' },
    ])
  })

  it('handles CRLF and flushes a pending paragraph before a heading/list', () => {
    const out = parseMarkdown('intro\r\n# H\r\npara\n- item')
    expect(out).toEqual([
      { type: 'p', text: 'intro' },
      { type: 'h1', text: 'H' },
      { type: 'p', text: 'para' },
      { type: 'ul', items: ['item'] },
    ])
  })
})

/*
 * ✎ 2026-08-23 — fenced code, `*` bullets, loose lists.
 *
 * Added to publish a real audit write-up (Foundry PoC, Solidity root cause, remediation diff).
 * Through the old parser every fenced line would have been joined into a paragraph with the ```
 * markers printed as text — product-audit finding 15, on the strongest proof surface on the site.
 */
describe('fenced code blocks', () => {
  it('captures a fence as one code block with its language', () => {
    const out = parseMarkdown('para\n\n```solidity\nuint256 a = 1;\n```\n\nafter')
    expect(out.map((b) => b.type)).toEqual(['p', 'code', 'p'])
    expect(out[1]).toMatchObject({ type: 'code', lang: 'solidity', text: 'uint256 a = 1;' })
  })

  it('records no language when the fence declares none', () => {
    expect(parseMarkdown('```\nplain\n```')[0]).toMatchObject({ lang: null, text: 'plain' })
  })

  it('does NOT parse markdown syntax inside a fence', () => {
    // The whole point: a `#` comment in Solidity is not a heading and a `*` is not a bullet.
    const out = parseMarkdown('```solidity\n# not a heading\n* not a bullet\n- also not\n```')
    expect(out).toHaveLength(1)
    expect(out[0].type).toBe('code')
    expect(out[0].text).toBe('# not a heading\n* not a bullet\n- also not')
  })

  it('preserves indentation inside a fence but trims the ends', () => {
    const out = parseMarkdown('```\n\nfunction f() {\n    return 1;\n}\n\n```')
    expect(out[0].text).toBe('function f() {\n    return 1;\n}')
  })

  it('renders an UNTERMINATED fence as code rather than dropping it', () => {
    // Silently deleting content is the worst option; half a PoC shown as prose is the second worst.
    const out = parseMarkdown('```solidity\nuint256 a = 1;')
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ type: 'code', lang: 'solidity', text: 'uint256 a = 1;' })
  })

  it('never leaks a fence marker into rendered text', () => {
    const out = parseMarkdown('# H\n\n```js\nconst x = 1\n```\n\ntail')
    expect(out.every((b) => !(b.text || '').includes('```'))).toBe(true)
  })

  it('closes an open list and paragraph when a fence opens', () => {
    const out = parseMarkdown('- one\n```\ncode\n```')
    expect(out.map((b) => b.type)).toEqual(['ul', 'code'])
  })
})

describe('list handling', () => {
  it('accepts `*` bullets as well as `-`', () => {
    expect(parseMarkdown('* one\n* two')).toEqual([{ type: 'ul', items: ['one', 'two'] }])
  })

  it('keeps a blank-line-separated (loose) list as ONE list', () => {
    // The audit write-up separates its Risk bullets with blank lines; flushing on blank turned
    // four bullets into four one-item lists.
    expect(parseMarkdown('* one\n\n* two\n\n* three')).toEqual([
      { type: 'ul', items: ['one', 'two', 'three'] },
    ])
  })

  it('still ends the list at the next non-bullet block', () => {
    const out = parseMarkdown('- one\n\nprose')
    expect(out.map((b) => b.type)).toEqual(['ul', 'p'])
  })
})
