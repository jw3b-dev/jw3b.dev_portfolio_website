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
