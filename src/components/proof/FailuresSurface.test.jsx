import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import FailuresSurface from './FailuresSurface.jsx'
import { FAILURES } from '../../data/recorded-runs/failures/index.js'

describe('FailuresSurface — first-class radical-honesty surface (FR-045 / OBJ-04)', () => {
  it('renders at least one failure artifact with its real log, failure, and fix', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    expect(FAILURES.length).toBeGreaterThanOrEqual(1)

    const f = FAILURES[0]
    const surface = screen.getByRole('region', { name: /what failed, and why/i })
    expect(within(surface).getByText(f.title)).toBeInTheDocument()
    // the real log (load-bearing "real logs" of FR-045)
    expect(within(surface).getByText(/Real log/i)).toBeInTheDocument()
    expect(within(surface).getByText(new RegExp(f.log[0].slice(0, 20).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeInTheDocument()
    // the failure and the fix are both shown (exact label — avoids matching the h2)
    expect(within(surface).getByText('What failed & why')).toBeInTheDocument()
    expect(within(surface).getByText(f.failure)).toBeInTheDocument()
    expect(within(surface).getByText(f.fix)).toBeInTheDocument()
  })

  it('exposes the reproducible input so the failure can be checked, not just asserted', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    // the flagship artifact carries an input; its disclosure summary is present
    expect(screen.getByText(/Reproduce it/i)).toBeInTheDocument()
  })
})

describe('reproducing a failure is operable, not an instruction', () => {
  it('links each audit failure into the live console to replay its exact input', () => {
    render(<MemoryRouter><FailuresSurface /></MemoryRouter>)
    const f = FAILURES.find((x) => x.surface === 'audit')
    const link = screen.getByRole('link', { name: /run it in \/audit/i })
    expect(link).toHaveAttribute('href', `/audit?case=${f.id}`)
  })
})
