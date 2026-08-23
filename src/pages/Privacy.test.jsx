import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import Privacy from './Privacy.jsx'

const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/privacy']}>
        <Privacy />
      </MemoryRouter>
    </HelmetProvider>,
  )

describe('Privacy notice (FR-057 / NFR-07)', () => {
  it('renders the titled notice from the canonical source', () => {
    renderPage()
    expect(screen.getByRole('heading', { level: 1, name: /privacy notice/i })).toHaveAttribute(
      'id',
      'privacy-title',
    )
  })

  /*
   * Added 2026-08-23 after the live apex was found setting a cookie this notice never mentioned.
   * The notice opens by promising it "reflects what the code actually does — not an aspiration",
   * and for a month it did not: Cloudflare Bot Fight Mode stores `cf_clearance` on every visit.
   * `e2e-zone/zone-posture.spec.js` allows that cookie ONLY while this section names it, so the
   * two checks hold each other up — this one proves the words reach the page, that one proves the
   * words still match the live site.
   */
  it('discloses the security cookie the zone actually sets', () => {
    renderPage()
    expect(screen.getByRole('heading', { name: /cookies and browser storage/i })).toBeInTheDocument()
    expect(screen.getByText(/cf_clearance/)).toBeInTheDocument()
    // The legal basis must be stated, not merely implied — security is why no banner is required.
    expect(screen.getByText(/set for security/i)).toBeInTheDocument()
  })

  it('covers the three mandated disclosures: analytics, connected-wallet data, engagement PII', () => {
    renderPage()
    // Analytics — the concierge/audit/rate-limit collection.
    expect(screen.getByRole('heading', { name: /analytics/i })).toBeInTheDocument()
    expect(screen.getByText(/one-way hash of the contract/i)).toBeInTheDocument()
    // Connected-wallet data.
    expect(screen.getByRole('heading', { name: /connected-wallet data/i })).toBeInTheDocument()
    // Engagement-request PII.
    expect(screen.getByRole('heading', { name: /engagement requests/i })).toBeInTheDocument()
    expect(screen.getByText(/your contact — the email or handle/i)).toBeInTheDocument()
  })

  it('states the erasure/access right and a contact route (present, not a stub)', () => {
    renderPage()
    expect(screen.getByText(/ask for it to be deleted/i)).toBeInTheDocument()
    // Contact email appears (in the rights section and the contact block).
    expect(screen.getAllByText(/john@agilegypsy\.com/).length).toBeGreaterThan(0)
    expect(screen.getByText(/last updated/i)).toBeInTheDocument()
  })
})
