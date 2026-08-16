import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import SiteFooter from './SiteFooter.jsx'

const renderFooter = () =>
  render(
    <MemoryRouter>
      <SiteFooter />
    </MemoryRouter>,
  )

// PRIVACY-01 (P1-GATE compliance) — the privacy notice must be reachable from every PII
// collection point. RootLayout mounts this footer on every route, so proving the footer
// exposes a /privacy link proves reachability from the book-a-call form, chat, and audit
// console. This test is the executable guard against the notice going unlinked again.
describe('SiteFooter — global privacy reachability (GDPR Art.13 / POPIA §18)', () => {
  it('is a contentinfo landmark carrying a link to the privacy notice', () => {
    renderFooter()
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    const privacy = screen.getByRole('link', { name: /privacy/i })
    expect(privacy).toHaveAttribute('href', '/privacy')
  })
})
