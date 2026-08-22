import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FourHats from './FourHats.jsx'
import { workForHat } from '../../lib/hatWork.js'
import { HATS } from '../../constants/index.js'

describe('FourHats — four-hat identity (FR-003 / BR-07)', () => {
  it('shows all four hats together on one surface', () => {
    render(<MemoryRouter><FourHats /></MemoryRouter>)
    for (const h of HATS) {
      expect(screen.getByRole('button', { name: new RegExp(h.label, 'i') })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button')).toHaveLength(HATS.length)
  })

  it('filtering DIMS the non-selected hats but never removes them from the DOM (BR-07)', () => {
    render(<MemoryRouter><FourHats /></MemoryRouter>)
    const engineer = screen.getByRole('button', { name: /engineer/i })
    fireEvent.click(engineer)

    // selected hat is pressed and at full opacity
    expect(engineer).toHaveAttribute('aria-pressed', 'true')
    expect(engineer.className).toContain('opacity-100')

    // every other hat is still present, just dimmed — never hidden
    for (const h of HATS.filter((x) => x.key !== 'engineer')) {
      const btn = screen.getByRole('button', { name: new RegExp(h.label, 'i') })
      expect(btn).toBeInTheDocument()
      expect(btn).toHaveAttribute('aria-pressed', 'false')
      expect(btn.className).toContain('opacity-40')
    }
  })

  it('re-selecting the active hat clears the filter (all back to full weight)', () => {
    render(<MemoryRouter><FourHats /></MemoryRouter>)
    const auditor = screen.getByRole('button', { name: /auditor/i })
    fireEvent.click(auditor)
    fireEvent.click(auditor)
    for (const h of HATS) {
      expect(screen.getByRole('button', { name: new RegExp(h.label, 'i') }).className).toContain('opacity-100')
    }
  })

  it('renders each hat with its distinct grounded blurb', () => {
    render(<MemoryRouter><FourHats /></MemoryRouter>)
    const list = screen.getByRole('list')
    for (const h of HATS) {
      expect(within(list).getByText(h.blurb)).toBeInTheDocument()
    }
  })
})

describe('FourHats — the hats NAVIGATE, not just colour (brief 03, next-need 1)', () => {
  const render4 = () => render(<MemoryRouter><FourHats /></MemoryRouter>)

  it('shows no work list until a hat is chosen — all four at once is a sitemap, not a filter', () => {
    render4()
    expect(screen.queryByText(/the work behind it/i)).toBeNull()
  })

  it('surfaces the selected hat’s work, as links', () => {
    render4()
    fireEvent.click(screen.getByRole('button', { name: /auditor/i }))
    expect(screen.getByText(/auditor — the work behind it/i)).toBeInTheDocument()
    for (const item of workForHat('auditor')) {
      const link = screen.getByRole('link', { name: new RegExp(item.label, 'i') })
      expect(link).toHaveAttribute('href', expect.stringContaining(item.href.split('#')[0] || '/'))
    }
  })

  it('the PM hat reaches the delivery record — FR-060 keeps it apart, not orphaned', () => {
    render4()
    fireEvent.click(screen.getByRole('button', { name: /\bPM\b/i }))
    expect(screen.getByRole('link', { name: /delivery record/i })).toBeInTheDocument()
  })

  it('clearing the filter removes the work list again', () => {
    render4()
    fireEvent.click(screen.getByRole('button', { name: /auditor/i }))
    expect(screen.getByText(/the work behind it/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /show all/i }))
    expect(screen.queryByText(/the work behind it/i)).toBeNull()
  })
})
