import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Kointel, { KOINTEL_URL } from './Kointel.jsx'

/*
 * Kointel test (P2-12). Verifies the flagship links to the live external product, carries the
 * Auditor + Founder dimensions, and shows NO unbacked stat (proof, not promises — there is no
 * cleared Kointel metric in the register).
 */
describe('Kointel flagship (P2-12)', () => {
  it('links to the live external product', () => {
    render(<Kointel />)
    const link = screen.getByRole('link', { name: /open kointel/i })
    expect(link).toHaveAttribute('href', KOINTEL_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('carries the Auditor + Founder dimensions', () => {
    render(<Kointel />)
    const dims = screen.getByRole('list', { name: /dimensions/i })
    expect(dims).toHaveTextContent(/auditor/i)
    expect(dims).toHaveTextContent(/founder/i)
  })

  it('shows no numeric stat (no cleared Kointel claim → proof, not promises)', () => {
    const { container } = render(<Kointel />)
    // no bare metric counters like "1,345 tests" / "13-phase" appear on this card
    expect(container.textContent).not.toMatch(/\b\d[\d,]*\s*(tests?|users?|phase|audits?)\b/i)
  })
})
