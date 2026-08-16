import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import DeliveryAnchor from './DeliveryAnchor.jsx'
import CodeHawksLink from './CodeHawksLink.jsx'
import { getClaim } from '../../lib/claimsRegister.js'

describe('DeliveryAnchor — PM/Founder seniority anchor (FR-060)', () => {
  it('renders the delivery record and AgilePM cert straight from cleared claims', () => {
    render(<DeliveryAnchor />)
    // Values come from the register, not free-typed copy.
    expect(screen.getByText(getClaim('delivery-plants-countries').value)).toBeInTheDocument()
    expect(screen.getByText(getClaim('agilepm-practitioner').value)).toBeInTheDocument()
  })

  it('frames itself as a seniority anchor, not a flagship system slot', () => {
    render(<DeliveryAnchor />)
    expect(screen.getByText(/seniority anchor/i)).toBeInTheDocument()
  })
})

describe('CodeHawksLink — CodeHawks #124 public deep-link (FR-044)', () => {
  it('deep-links to the public Cyfrin profile from the register evidence pointer', () => {
    render(<CodeHawksLink />)
    const link = screen.getByRole('link', { name: /public record on cyfrin/i })
    expect(link).toHaveAttribute('href', getClaim('codehawks-124-rank').evidence_pointer)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
  })

  it('shows the #124 rank / findings / EXP figures via cleared claims', () => {
    render(<CodeHawksLink />)
    const section = screen.getByRole('region', { name: /codehawks competitive audit/i })
    expect(within(section).getByText(getClaim('codehawks-124-rank').value)).toBeInTheDocument()
    expect(within(section).getByText(getClaim('codehawks-124-findings').value)).toBeInTheDocument()
  })
})
