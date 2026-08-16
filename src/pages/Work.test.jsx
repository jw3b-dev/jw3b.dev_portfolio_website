import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import Work from './Work.jsx'

/*
 * Work route (FR-004). The four-flagship showcase gets its own destination. The page must
 * carry a single <h1> (accessibility) and render all four flagship headliners.
 */
const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Work />
      </MemoryRouter>
    </HelmetProvider>,
  )

describe('Work route — the flagship showcase destination (FR-004)', () => {
  it('renders a single page-level h1', () => {
    renderPage()
    const h1s = screen.getAllByRole('heading', { level: 1 })
    expect(h1s).toHaveLength(1)
    expect(h1s[0]).toHaveTextContent(/four flagships/i)
  })

  it('surfaces all four flagship headliners', () => {
    renderPage()
    expect(screen.getAllByText(/^flagship ·/i)).toHaveLength(4)
  })
})
