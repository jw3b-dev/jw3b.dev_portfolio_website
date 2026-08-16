import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import SystemsAreGraphs from './SystemsAreGraphs.jsx'
import ZeroTrustValidator from './ZeroTrustValidator.jsx'

/* P3-06 · FR-055 — the /thesis/* explainer pages render and are never orphans (link to the console). */
const renderPage = (ui) =>
  render(
    <HelmetProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </HelmetProvider>,
  )

describe('thesis explainer pages', () => {
  it('Systems are graphs: heading + a route into the audit console', () => {
    renderPage(<SystemsAreGraphs />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/systems are graphs/i)
    expect(screen.getByRole('link', { name: /audit console/i }).getAttribute('href')).toBe('/audit')
    // cross-links to the sibling thesis page (internal-link SEO, no orphan)
    expect(screen.getByRole('link', { name: /zero-trust/i }).getAttribute('href')).toBe('/thesis/zero-trust-validator')
  })

  it('Zero-trust validator: heading + a route into the audit console', () => {
    renderPage(<ZeroTrustValidator />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toMatch(/reproduce the finding/i)
    expect(screen.getByRole('link', { name: /\/audit/i }).getAttribute('href')).toBe('/audit')
    expect(screen.getByRole('link', { name: /systems are graphs/i }).getAttribute('href')).toBe('/thesis/systems-are-graphs')
  })
})
