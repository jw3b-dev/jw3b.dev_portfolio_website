import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import FourHats from './FourHats.jsx'
import { HATS } from '../../constants/index.js'

describe('FourHats — four-hat identity (FR-003 / BR-07)', () => {
  it('shows all four hats together on one surface', () => {
    render(<FourHats />)
    for (const h of HATS) {
      expect(screen.getByRole('button', { name: new RegExp(h.label, 'i') })).toBeInTheDocument()
    }
    expect(screen.getAllByRole('button')).toHaveLength(HATS.length)
  })

  it('filtering DIMS the non-selected hats but never removes them from the DOM (BR-07)', () => {
    render(<FourHats />)
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
    render(<FourHats />)
    const auditor = screen.getByRole('button', { name: /auditor/i })
    fireEvent.click(auditor)
    fireEvent.click(auditor)
    for (const h of HATS) {
      expect(screen.getByRole('button', { name: new RegExp(h.label, 'i') }).className).toContain('opacity-100')
    }
  })

  it('renders each hat with its distinct grounded blurb', () => {
    render(<FourHats />)
    const list = screen.getByRole('list')
    for (const h of HATS) {
      expect(within(list).getByText(h.blurb)).toBeInTheDocument()
    }
  })
})
