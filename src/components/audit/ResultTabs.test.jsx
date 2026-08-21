import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ResultTabs from './ResultTabs.jsx'

const DOC = `# Report

lede text

## Finding

the finding body

## Concrete Fix

the fix body`

describe('ResultTabs', () => {
  it('renders nothing for empty input', () => {
    const { container } = render(<ResultTabs source="" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a single section plainly, with no lone tab strip', () => {
    render(<ResultTabs source="just a paragraph" />)
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    expect(screen.getByText('just a paragraph')).toBeInTheDocument()
  })

  it('makes one tab per heading and shows only the active panel', () => {
    render(<ResultTabs source={DOC} />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent.replace(/\s*▍$/, ''))).toEqual(['Overview', 'Finding', 'Concrete Fix'])
    expect(screen.getByText('the fix body')).toBeVisible() // last section active by default
    expect(screen.queryByText('the finding body')).not.toBeInTheDocument()
  })

  it('switches panes on click', () => {
    render(<ResultTabs source={DOC} />)
    fireEvent.click(screen.getByRole('tab', { name: /finding/i }))
    expect(screen.getByText('the finding body')).toBeVisible()
    expect(screen.queryByText('the fix body')).not.toBeInTheDocument()
  })

  it('moves between tabs with the arrow keys (WAI-ARIA tabs pattern)', () => {
    render(<ResultTabs source={DOC} />)
    fireEvent.click(screen.getByRole('tab', { name: /^overview/i }))
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowRight' })
    expect(screen.getByText('the finding body')).toBeVisible()
    fireEvent.keyDown(screen.getByRole('tablist'), { key: 'ArrowLeft' })
    expect(screen.getByText('lede text')).toBeVisible()
  })

  it('marks the still-writing section while streaming, and stops when done', () => {
    const { rerender } = render(<ResultTabs source={DOC} streaming />)
    expect(screen.getByRole('tab', { name: /concrete fix/i }).textContent).toMatch(/▍/)
    rerender(<ResultTabs source={DOC} streaming={false} />)
    expect(screen.getByRole('tab', { name: /concrete fix/i }).textContent).not.toMatch(/▍/)
  })

  it('does NOT yank the reader away once they have chosen a tab mid-stream', () => {
    const { rerender } = render(<ResultTabs source={DOC} streaming />)
    fireEvent.click(screen.getByRole('tab', { name: /finding/i }))
    // More text arrives, adding a new trailing section.
    rerender(<ResultTabs source={`${DOC}\n\n## Summary\n\nthe summary body`} streaming />)
    expect(screen.getByText('the finding body')).toBeVisible()
    expect(screen.queryByText('the summary body')).not.toBeInTheDocument()
  })
})
