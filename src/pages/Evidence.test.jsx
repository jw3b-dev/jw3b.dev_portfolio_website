import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Evidence from './Evidence.jsx'
import { allClaims, isClaimCleared, evidenceKind, firstSentence } from '../lib/claimsRegister.js'
import { FORBIDDEN_RULES } from '../lib/claimsValidate.js'

vi.mock('../config/embeds.js', () => ({ workerOriginAllowed: () => false }))

/*
 * /evidence — the register, and the times it was wrong.
 *
 * The corrections section is the point of this page. Any site can list claims it believes; a site
 * that publishes the occasions its own numbers were wrong is making a checkable statement about how
 * it is maintained. "#152 (Aug 2026)" is worth less than the note recording that it read "#124"
 * here for months while every gate passed.
 */
const view = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Evidence />
      </MemoryRouter>
    </HelmetProvider>,
  )

const cleared = allClaims().filter(isClaimCleared)
const corrected = cleared.filter((c) => c.reconciliation_note)

describe('Evidence page', () => {
  it('renders one <section>, not a nested <main>', () => {
    // The layout already provides <main>. This page wrapped in another one — invalid HTML and an
    // ambiguous landmark — and /evidence was not in the E2E route list, so nothing caught it.
    const { container } = view()
    expect(container.querySelectorAll('main')).toHaveLength(0)
    expect(screen.getByRole('heading', { level: 1, name: /evidence register/i })).toBeInTheDocument()
  })

  it('states the verified/attested split from the register, not from prose', () => {
    view()
    const verified = cleared.filter((c) => evidenceKind(c) === 'verified').length
    expect(screen.getAllByText(String(verified)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(String(cleared.length)).length).toBeGreaterThan(0)
  })

  it('publishes EVERY correction the register carries', () => {
    view()
    expect(corrected.length).toBeGreaterThan(0)
    const section = screen.getByRole('region', { name: /corrections/i })
    for (const c of corrected) {
      // getAllBy: a single-sentence note is its own summary, so it appears twice (collapsed and
      // expanded). Presence is the assertion, not uniqueness.
      expect(within(section).getAllByText(firstSentence(c.reconciliation_note)).length).toBeGreaterThan(0)
    }
  })

  it('shows the count as a fraction of the whole register — not a bare number', () => {
    // "11 corrections" invites "out of how many?". The ratio is the honest figure.
    view()
    expect(screen.getByRole('heading', { name: new RegExp(`${corrected.length} of ${cleared.length}`) }))
      .toBeInTheDocument()
  })

  it('keeps the full note available, not just the summary', () => {
    view()
    const section = screen.getByRole('region', { name: /corrections/i })
    const longest = corrected.reduce((a, b) =>
      (a.reconciliation_note.length > b.reconciliation_note.length ? a : b))
    expect(within(section).getByText(longest.reconciliation_note)).toBeInTheDocument()
  })

  it('derives the blocklist from the register rather than hardcoding it', () => {
    // ✎ My first version of this asserted the page never shows those phrases. Wrong: the page
    // deliberately RENDERS the blocklist, and that is the point — a reader can see what the site
    // refuses to say. The real invariant is that the list is DERIVED, so it cannot drift from the
    // register and cannot be a literal in this component (which is what the claims gate scans for).
    view()
    const section = screen.getByRole('region', { name: /claims this site refuses to make/i })
    expect(FORBIDDEN_RULES.length).toBeGreaterThan(0)
    for (const rule of FORBIDDEN_RULES) {
      expect(within(section).getByText(rule.why)).toBeInTheDocument()
    }
  })
})
