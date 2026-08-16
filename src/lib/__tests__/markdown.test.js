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
