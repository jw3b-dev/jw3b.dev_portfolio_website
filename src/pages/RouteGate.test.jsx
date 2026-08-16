import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import Ctf from './Ctf.jsx'
import Messages from './Messages.jsx'

const renderPage = (ui) =>
  render(
    <HelmetProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </HelmetProvider>,
  )

// SC-2: 0 hard-broken states. An unprovisioned route (flag OFF) must render an honest,
// titled surface with the guaranteed floor one click away (SC-1) — never a bare
// placeholder. Both provisioning-gated rails default OFF, so both show the gate now.
describe('provisioning-gated routes wear the honest gate (P1-21 / SC-2)', () => {
  it('/ctf renders a titled gate that routes to the book-a-call floor', () => {
    renderPage(<Ctf />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/wired up/i)
    const cta = screen.getByRole('link', { name: /book a call/i })
    expect(cta).toHaveAttribute('href', '/hire-me')
    // Not a dead-end: home is also reachable.
    expect(screen.getByRole('link', { name: /back to the console/i })).toHaveAttribute('href', '/')
  })

  it('/messages renders a titled gate that routes to the book-a-call floor', () => {
    renderPage(<Messages />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/messaging/i)
    expect(screen.getByRole('link', { name: /book a call/i })).toHaveAttribute('href', '/hire-me')
  })
})
