import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import FailuresSurface from './FailuresSurface.jsx'
import { FAILURES } from '../../data/recorded-runs/failures/index.js'

describe('FailuresSurface — first-class radical-honesty surface (FR-045 / OBJ-04)', () => {
  it('renders at least one failure artifact with its real log, failure, and fix', () => {
    render(<FailuresSurface />)
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
    render(<FailuresSurface />)
    // the flagship artifact carries an input; its disclosure summary is present
    expect(screen.getByText(/Reproduce it/i)).toBeInTheDocument()
  })
})
