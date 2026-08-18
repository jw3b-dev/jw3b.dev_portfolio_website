/*
 * P3-04 — CheckoutTerms gate (FR-059): paid children are STRUCTURALLY unreachable until the
 * visitor accepts the real terms text; back exits; the acknowledgment needs the checkbox.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CheckoutTerms from './CheckoutTerms.jsx'

describe('CheckoutTerms (P3-04 · FR-059)', () => {
  it('renders the real terms content, not the child, before acceptance', () => {
    render(
      <CheckoutTerms>
        <div>PAID RAIL</div>
      </CheckoutTerms>,
    )
    expect(screen.getByRole('heading', { name: 'Engagement terms' })).toBeInTheDocument()
    expect(screen.getByText(/settled in USDC/)).toBeInTheDocument() // real terms.md text
    expect(screen.getByText(/cancellation period/)).toBeInTheDocument() // cooling-off clause
    expect(screen.queryByText('PAID RAIL')).not.toBeInTheDocument()
  })

  it('keeps continue disabled until the checkbox is ticked, then reveals the child', () => {
    render(
      <CheckoutTerms>
        <div>PAID RAIL</div>
      </CheckoutTerms>,
    )
    const btn = screen.getByRole('button', { name: 'Accept and continue' })
    expect(btn).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    expect(screen.getByText('PAID RAIL')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Engagement terms' })).not.toBeInTheDocument()
  })

  it('offers a back exit', () => {
    const onBack = vi.fn()
    render(
      <CheckoutTerms onBack={onBack}>
        <div>PAID RAIL</div>
      </CheckoutTerms>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
