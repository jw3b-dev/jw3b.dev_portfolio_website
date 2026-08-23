import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import FindingArtifact from './FindingArtifact.jsx'
import { ARTIFACTS } from '../../lib/findingArtifactsIndex.js'
import { getClaim } from '../../lib/claimsRegister.js'

/*
 * The published finding. This surface exists because the record's only public receipt started
 * showing "Unranked · High 0" — so the site stopped asking readers to trust a number and started
 * showing them the actual audit.
 */
const artifact = ARTIFACTS[0]

const at = (slug) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[`/findings/${slug}`]}>
        <Routes>
          <Route path="/findings/:slug" element={<FindingArtifact />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  )

describe('FindingArtifact — a published audit finding', () => {
  it('renders the finding with its severity and contest', () => {
    at(artifact.slug)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(artifact.finding.id)
    expect(screen.getByText(new RegExp(`${artifact.severity} severity`, 'i'))).toBeInTheDocument()
    // The <Claim> provenance note names the contest too, so assert presence, not uniqueness.
    expect(screen.getAllByText(new RegExp(`First Flight #${artifact.contest.flight}`)).length).toBeGreaterThan(0)
  })

  it('renders fenced code as CODE, never as prose with backticks', () => {
    // Product-audit finding 15 was exactly this defect on the fuzz output. Repeating it here would
    // put an unreadable Foundry test on the strongest proof page on the site.
    const { container } = at(artifact.slug)
    const blocks = container.querySelectorAll('pre code')
    expect(blocks.length).toBeGreaterThan(0)
    expect(container.textContent).not.toContain('```')
    // The PoC and the remediation diff both have to survive.
    expect(container.textContent).toMatch(/forge-std\/Test\.sol/)
    expect(container.textContent).toMatch(/faucetToken\.balanceOf\(address\(this\)\) < faucetDrip/)
  })

  it('states that the write-up is John’s and that Cyfrin selected it', () => {
    at(artifact.slug)
    expect(screen.getByText(/publishes one write-up as the canonical version/i)).toBeInTheDocument()
    expect(screen.getByText(getClaim('codehawks-selected-writeup').value)).toBeInTheDocument()
  })

  it('attributes severity to Cyfrin, not to the submitter', () => {
    // He filed it as a Medium; they published it as a Low. Rendering his own severity would be
    // quietly inflating the finding.
    at(artifact.slug)
    expect(screen.getByText(/severity is cyfrin.s classification/i)).toBeInTheDocument()
  })

  it('links out to the contest so the provenance is checkable', () => {
    at(artifact.slug)
    const link = screen.getByRole('link', { name: /contest on codehawks/i })
    expect(link).toHaveAttribute('href', `https://codehawks.cyfrin.io/c/${artifact.contest.slug}`)
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('shows a real not-found state for an unknown slug', () => {
    at('99-H-01')
    expect(screen.getByRole('heading', { name: /finding not found/i })).toBeInTheDocument()
  })

  it('refuses a finding John did not have selected, even by direct URL', () => {
    // 42-H-01 is real and he reported it — but Cyfrin published nomadic_bear's write-up, so there
    // is no artifact and the page must not invent one.
    at('42-H-01')
    expect(screen.getByRole('heading', { name: /finding not found/i })).toBeInTheDocument()
  })
})
