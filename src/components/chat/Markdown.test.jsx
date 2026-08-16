import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Markdown, { parseBlocks, renderInline } from './Markdown.jsx'

/*
 * The concierge emits markdown; the widget must RENDER it (not show raw syntax) — bold, headings,
 * lists, fenced code, tables, links — safely (React elements, no dangerouslySetInnerHTML).
 */
describe('parseBlocks — markdown → block tree', () => {
  it('recognises headings, lists, tables, and fenced code', () => {
    const src = '# Title\n\n- one\n- two\n\n```solidity\ncontract A {}\n```\n\n| A | B |\n|---|---|\n| 1 | 2 |'
    const types = parseBlocks(src).map((b) => b.type)
    expect(types).toContain('heading')
    expect(types).toContain('list')
    expect(types).toContain('code')
    expect(types).toContain('table')
  })

  it('parses a table into header + rows', () => {
    const [t] = parseBlocks('| Sev | Line |\n|---|---|\n| High | 8 |')
    expect(t).toMatchObject({ type: 'table', header: ['Sev', 'Line'], rows: [['High', '8']] })
  })

  it('degrades gracefully on an unterminated fence mid-stream (no throw)', () => {
    expect(() => parseBlocks('```solidity\ncontract A {')).not.toThrow()
    expect(parseBlocks('```\ncode')[0].type).toBe('code')
  })
})

describe('renderInline — inline markdown, XSS-safe links', () => {
  it('bold + inline code render as elements', () => {
    render(<p>{renderInline('John is **#124** with `1430` EXP')}</p>)
    expect(screen.getByText('#124').tagName).toBe('STRONG')
    expect(screen.getByText('1430').tagName).toBe('CODE')
  })

  it('renders a safe http link but drops a javascript: URL', () => {
    const { container } = render(<p>{renderInline('[ok](https://x.io) and [bad](javascript:alert(1))')}</p>)
    const links = container.querySelectorAll('a')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', 'https://x.io')
    expect(links[0]).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(container.textContent).toContain('bad') // still shown as text, not a link
  })
})

describe('Markdown component — renders, does not show raw syntax', () => {
  it('renders bold text without the ** markers', () => {
    render(<Markdown source={'John is **#124** on CodeHawks.'} />)
    expect(screen.getByText('#124').tagName).toBe('STRONG')
    // the raw ** markers are gone
    expect(screen.queryByText(/\*\*#124\*\*/)).toBeNull()
  })

  it('renders a table and a code block', () => {
    const { container } = render(<Markdown source={'| Sev | Line |\n|---|---|\n| High | 8 |\n\n```\nx = 1\n```'} />)
    expect(container.querySelector('table')).toBeInTheDocument()
    expect(container.querySelector('pre code')).toHaveTextContent('x = 1')
  })
})
