import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import DeliveryAnchor from './DeliveryAnchor.jsx'
import CodeHawksLink from './CodeHawksLink.jsx'
import { getClaim, evidenceKind } from '../../lib/claimsRegister.js'

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

describe('CodeHawksLink — the CodeHawks #124 record (FR-044)', () => {
  // ✎ REWRITTEN 2026-08-23. This asserted the deep-link is always present. It is not, and should
  // not be: the public Cyfrin profile stopped showing the record (logged-out it reads "Unranked",
  // "High 0 Med 0 Low 0"), so the pointer was downgraded to attested and the link correctly
  // disappeared — the component was built for that. What the test should pin is the RULE, which
  // holds either way: the link tracks the evidence tier, and so does the wording beside it.
  const tier = () => evidenceKind(getClaim('codehawks-124-rank'))

  it('links only when the pointer is a real URL, and never to prose', () => {
    render(<CodeHawksLink />)
    const link = screen.queryByRole('link', { name: /public record on cyfrin/i })
    if (tier() === 'verified') {
      expect(link).toHaveAttribute('href', getClaim('codehawks-124-rank').evidence_pointer)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
    } else {
      expect(link).not.toBeInTheDocument()
    }
  })

  it('never says "verified record" over evidence that is merely attested', () => {
    // The failure this guards: three figures silently became attested while the eyebrow above them
    // still read "verified record" — the site asserting a standard of proof it no longer met.
    render(<CodeHawksLink />)
    const section = screen.getByRole('region', { name: /codehawks competitive audit/i })
    if (tier() === 'verified') {
      expect(within(section).getByText(/verified record/i)).toBeInTheDocument()
    } else {
      expect(within(section).queryByText(/verified record/i)).not.toBeInTheDocument()
      expect(within(section).getByText(/competitive-audit record/i)).toBeInTheDocument()
    }
  })

  it('states where an attested record IS evidenced rather than showing bare numbers', () => {
    render(<CodeHawksLink />)
    if (tier() !== 'verified') {
      // <Claim> already emits an sr-only "owner-attested, not independently verified" note per
      // figure, so match the VISIBLE provenance line specifically — the point of this assertion is
      // that a sighted reader sees where the record comes from, not only a screen-reader user.
      const visible = screen
        .getAllByText(/owner-attested/i)
        .filter((el) => !el.className.includes('sr-only'))
      expect(visible.length).toBeGreaterThan(0)
    }
  })

  it('shows the #124 rank / findings / EXP figures via cleared claims', () => {
    render(<CodeHawksLink />)
    const section = screen.getByRole('region', { name: /codehawks competitive audit/i })
    expect(within(section).getByText(getClaim('codehawks-124-rank').value)).toBeInTheDocument()
    expect(within(section).getByText(getClaim('codehawks-124-findings').value)).toBeInTheDocument()
  })
})
