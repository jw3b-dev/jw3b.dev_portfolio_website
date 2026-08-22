/*
 * /evidence — the register, readable.
 *
 * The tests that matter are about HONESTY, not layout. This page's whole justification is that a
 * reader can weigh the claims themselves — so it must show every cleared claim, must not invent a
 * figure of its own, and must state the verified/attested split rather than implying every number
 * is checkable. A register page that flattered the register would be worse than no page.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import Evidence from './Evidence.jsx'
import { allClaims, isClaimCleared, evidenceKind } from '../lib/claimsRegister.js'

const cleared = allClaims().filter(isClaimCleared)
const renderPage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Evidence />
      </MemoryRouter>
    </HelmetProvider>,
  )

/** Claim rows only — every <li> inside a source section, excluding the blocklist below. */
const registerRows = () =>
  screen.getAllByRole('listitem').filter((li) => li.closest('section')?.id !== 'refused-claims-section')

describe('/evidence — completeness', () => {
  it('lists EVERY cleared claim — a partial register is a curated one', () => {
    renderPage()
    // Scoped to the REGISTER sections. The refused-claims blocklist below is also a list, and a
    // page-wide count conflates "claims we make" with "claims we refuse to make" — two opposite
    // things that must never be summed.
    const rows = registerRows()
    expect(rows).toHaveLength(cleared.length)
  })

  it('shows each claim label', () => {
    renderPage()
    // getAllByText, not getByText: several certificates legitimately share a label
    // ("Neo4j GraphAcademy — course certificate"), so uniqueness is not the property here.
    for (const c of cleared) expect(screen.getAllByText(c.label).length).toBeGreaterThan(0)
  })

  it('groups by source system, and every source appears', () => {
    renderPage()
    const sources = new Set(cleared.map((c) => c.source_system || 'Other'))
    for (const s of sources) {
      expect(screen.getByRole('heading', { name: s })).toBeInTheDocument()
    }
  })
})

describe('/evidence — it does not flatter the register', () => {
  it('states the verified/attested split, computed not written', () => {
    const verified = cleared.filter((c) => evidenceKind(c) === 'verified').length
    const attested = cleared.length - verified
    renderPage()
    expect(screen.getByText(String(cleared.length))).toBeInTheDocument()
    expect(screen.getByText(String(verified))).toBeInTheDocument()
    expect(screen.getByText(String(attested))).toBeInTheDocument()
    // The disclaimer itself, because the numbers alone do not tell a reader what they mean.
    expect(screen.getByText(/Attested is not verified/i)).toBeInTheDocument()
  })

  it('gives every VERIFIED claim an openable link to its own pointer', () => {
    renderPage()
    const links = screen.getAllByRole('link', { name: /check it/i })
    const verified = cleared.filter((c) => evidenceKind(c) === 'verified')
    expect(links).toHaveLength(verified.length)
    for (const c of verified) {
      expect(links.some((l) => l.getAttribute('href') === c.evidence_pointer)).toBe(true)
    }
  })

  it('labels every ATTESTED claim in words, and never gives it a fake receipt link', () => {
    renderPage()
    const attested = cleared.filter((c) => evidenceKind(c) === 'attested')
    // Scope to the ROWS. The summary prose also contains the exact string "owner-attested",
    // so counting page-wide overcounts by one — which is what this assertion first did.
    const rowMarkers = registerRows().filter((li) => within(li).queryByText(/^owner-attested$/i))
    expect(rowMarkers).toHaveLength(attested.length)
    for (const c of attested) {
      expect(screen.queryByRole('link', { name: c.evidence_pointer })).toBeNull()
    }
  })

  it('writes no figure of its own — every number shown traces to the register', () => {
    const { container } = renderPage()
    const registerValues = new Set(cleared.map((c) => String(c.value)))
    const counts = new Set([String(cleared.length), String(cleared.filter((c) => evidenceKind(c) === 'verified').length),
      String(cleared.length - cleared.filter((c) => evidenceKind(c) === 'verified').length)])
    // Any standalone number rendered in a mono/tabular cell must be a register value or a count.
    const monoNumbers = [...container.querySelectorAll('.tabular-nums, .font-mono')]
      .map((n) => n.textContent.trim())
      .filter((t) => /^[\d,]+$/.test(t))
    for (const n of monoNumbers) {
      expect(registerValues.has(n) || counts.has(n), `unsourced figure rendered: ${n}`).toBe(true)
    }
  })
})

describe('/evidence — reachable', () => {
  it('points at the gate demo so a reader can try the blocklist themselves', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /zero-trust validator/i })
    expect(link).toHaveAttribute('href', '/thesis/zero-trust-validator')
  })

  it('renders a single h1 and one section heading per source', () => {
    renderPage()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    const sources = new Set(cleared.map((c) => c.source_system || 'Other'))
    // One h2 per evidence source, PLUS the refused-claims blocklist section — that section is a
    // peer of the sources, not a source, so it is named here rather than folded into the count.
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(sources.size + 1)
    expect(screen.getByRole('heading', { level: 2, name: /refuse|refused|never claim/i })).toBeInTheDocument()
  })
})
