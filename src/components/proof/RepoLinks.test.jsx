/*
 * P3-07 — GitHub ↔ site reinforcement (FR-056): real public repos linked from the flagship
 * surface; closed-source flagships honestly labelled; no forbidden repos (bets/DecentX).
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RepoLinks from './RepoLinks.jsx'

describe('RepoLinks (P3-07 · FR-056)', () => {
  it('links the GitHub profile with rel=me identity cross-link', () => {
    render(<RepoLinks />)
    const profile = screen.getByRole('link', { name: 'github.com/jw3b-dev' })
    expect(profile).toHaveAttribute('href', 'https://github.com/jw3b-dev')
    expect(profile.getAttribute('rel')).toContain('me')
    expect(profile.getAttribute('rel')).toContain('noopener')
  })

  it('links the four verified public repos, all under the jw3b-dev account', () => {
    render(<RepoLinks />)
    for (const name of ['solidity-audits', 'jw3b.dev_portfolio_website', 'development_agent', 'cyfrin-updraft-track']) {
      const link = screen.getByText(name).closest('a')
      expect(link).toHaveAttribute('href', `https://github.com/jw3b-dev/${name}`)
      expect(link).toHaveAttribute('target', '_blank')
      expect(link.getAttribute('rel')).toContain('noopener')
    }
  })

  it('states the closed-source status of the commercial flagships (honesty, not hiding)', () => {
    render(<RepoLinks />)
    expect(screen.getByText(/commercial systems/i)).toBeInTheDocument()
  })

  it('renders no forbidden repos (bets / DecentX)', () => {
    const { container } = render(<RepoLinks />)
    expect(container.textContent).not.toMatch(/bets|DecentX/i)
  })
})
