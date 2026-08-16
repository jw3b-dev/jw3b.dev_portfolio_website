import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import HireSpine from './HireSpine.jsx'

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <HireSpine />
    </MemoryRouter>,
  )

describe('HireSpine — the persistent hire spine (FR-002 / SC-1)', () => {
  // Every route in the app mounts the spine via RootLayout, so proving the CTA + home
  // link render on each of them proves "≤ 1 click from every route" and "no dead-ends".
  const ROUTES = ['/', '/audit', '/ctf', '/hire-me', '/messages', '/privacy', '/does-not-exist']

  it.each(ROUTES)('exposes the hire CTA to /hire-me on %s', (path) => {
    renderAt(path)
    const cta = screen.getByRole('link', { name: /hire john/i })
    expect(cta).toHaveAttribute('href', '/hire-me')
  })

  it.each(ROUTES)('exposes a home link on %s (no terminal dead-end)', (path) => {
    renderAt(path)
    const home = screen.getByRole('link', { name: /jw3b/i })
    expect(home).toHaveAttribute('href', '/')
  })

  it('links each operable surface out of the current route', () => {
    renderAt('/')
    // Rendered twice (desktop nav + mobile disclosure) — assert the targets exist.
    for (const [label, href] of [
      ['Work', '/work'],
      ['Audit', '/audit'],
      ['CTF', '/ctf'],
      ['Messages', '/messages'],
    ]) {
      const links = screen.getAllByRole('link', { name: new RegExp(`^${label}$`, 'i') })
      expect(links.length).toBeGreaterThan(0)
      expect(links[0]).toHaveAttribute('href', href)
    }
  })
})
