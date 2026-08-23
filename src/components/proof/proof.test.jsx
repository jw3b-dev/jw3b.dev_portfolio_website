import { describe, it, expect } from 'vitest'
import { render as rtlRender, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import DeliveryAnchor from './DeliveryAnchor.jsx'
import CodeHawksLink from './CodeHawksLink.jsx'
import { getClaim, evidenceKind } from '../../lib/claimsRegister.js'
import { CONTESTS, VALIDATED, summary, selectedByJohn } from '../../data/codehawks-contests.js'

// CodeHawksLink now links to the published finding, so these surfaces need router context.
const render = (ui) => rtlRender(<MemoryRouter>{ui}</MemoryRouter>)

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

  it('names every validated finding — and never claims John WROTE the published write-ups', () => {
    // The record's public receipt broke, so the specific replaced the aggregate: two named findings
    // in a named contest. Cyfrin credits agilegypsy as a validated SUBMITTER on H-01 and M-01 and
    // published nomadic_bear's and robercano's prose. Any wording implying authorship of those
    // write-ups is a misattribution — mas/facts/PORTFOLIO_REFERENCE.md 1b was corrected for exactly
    // that, and this is the guard that keeps it corrected.
    render(<CodeHawksLink />)
    const section = screen.getByRole('region', { name: /codehawks competitive audit/i })
    expect(within(section).getByText(getClaim('codehawks-validated-findings').value)).toBeInTheDocument()
    expect(within(section).getByText(/validated submissions/i)).toBeInTheDocument()

    // Every finding in the data module must reach the screen — a record that silently renders a
    // subset is the aggregate problem again, one level down.
    for (const f of VALIDATED) {
      expect(within(section).getByText(f.title)).toBeInTheDocument()
    }
    for (const c of CONTESTS) {
      // The claims' sr-only provenance notes also name the contests, so require a VISIBLE row —
      // a sighted reader must see the contest, not only a screen-reader user.
      const visible = within(section)
        .getAllByText(new RegExp(`First Flight #${c.flight}`))
        .filter((el) => !el.className.includes('sr-only'))
      expect(visible.length).toBeGreaterThan(0)
    }

    // The register's summary string is generated from the same rows, so a finding added to the
    // data module without re-generating the claim would desync silently. Pin them together.
    expect(getClaim('codehawks-validated-findings').value).toBe(summary())

    expect(section.textContent).not.toMatch(/\b(wrote|authored|my report|his report)\b/i)
  })

  it('separates SELECTED from merely validated — they are different claims', () => {
    // Validated = the finding was real. Selected = Cyfrin published John's write-up as the
    // canonical version. Collapsing them would promote ten findings to the standing of one.
    render(<CodeHawksLink />)
    const section = screen.getByRole('region', { name: /codehawks competitive audit/i })
    const selected = selectedByJohn()
    expect(selected.length).toBeGreaterThan(0)
    expect(within(section).getAllByText(/selected submission/i).length).toBeGreaterThan(0)
    for (const f of selected) {
      // The sentence spans several elements (John's is emphasised), so match the section's flat
      // textContent rather than a single node.
      expect(section.textContent).toMatch(new RegExp(`published\\s*John.s\\s*write-up of ${f.id}`, 'i'))
      expect(section.textContent).toMatch(new RegExp(`First Flight #${f.flight}`))
    }
    // ...and the count claim must NOT absorb it.
    expect(getClaim('codehawks-selected-writeup').value).not.toBe(getClaim('codehawks-validated-findings').value)
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
