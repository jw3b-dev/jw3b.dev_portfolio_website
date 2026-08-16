import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import CodeHawksLink from './CodeHawksLink.jsx'
import DeliveryAnchor from './DeliveryAnchor.jsx'
import { FORBIDDEN_PATTERNS } from '../../lib/claimsValidate.js'

/*
 * P1-22 — claims-render integration guard (portfolio-evidence, compliance-officer sub).
 *
 * The P1-22 sweep confirmed every on-page figure already routes through <Claim>. This
 * test freezes that audit as an executable invariant so a future edit can't quietly
 * hardcode a figure past the gate: on the credibility surfaces (a) every rendered figure
 * carries a [data-claim] provenance hook (FR-043 — Claim-routed, not raw text), (b) no
 * forbidden determinism/credential term appears (FR-046, BR-02), and (c) no bare
 * zero-value counter is shown (SC-3 / OBJ-05).
 */
const renderSurface = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('P1 credibility surfaces render claims through <Claim> (FR-043/046/047)', () => {
  it('CodeHawksLink: every figure is Claim-routed, none free-typed', () => {
    const { container } = renderSurface(<CodeHawksLink />)
    const claims = container.querySelectorAll('[data-claim]')
    // rank · findings · exp — three cleared figures, each a provenance-hooked <Claim>.
    expect(claims.length).toBe(3)
    const hooks = [...claims].map((n) => n.getAttribute('data-claim'))
    expect(hooks).toEqual(
      expect.arrayContaining(['codehawks-124-rank', 'codehawks-124-findings', 'codehawks-124-exp']),
    )
  })

  it('DeliveryAnchor: the record + credential are Claim-routed', () => {
    const { container } = renderSurface(<DeliveryAnchor />)
    const hooks = [...container.querySelectorAll('[data-claim]')].map((n) => n.getAttribute('data-claim'))
    expect(hooks).toEqual(
      expect.arrayContaining(['delivery-plants-countries', 'agilepm-practitioner']),
    )
  })

  it('neither surface renders a forbidden term or a bare zero-value counter', () => {
    for (const ui of [<CodeHawksLink key="c" />, <DeliveryAnchor key="d" />]) {
      const { container } = renderSurface(ui)
      const text = container.textContent
      for (const pattern of FORBIDDEN_PATTERNS) {
        expect(text).not.toMatch(pattern)
      }
      // No zero-value counter (e.g. "0 audits" / "0 findings") — SC-3.
      expect(text).not.toMatch(/\b0\s+(audits?|findings?|projects?|users?|plants?|tests?)\b/i)
    }
  })
})
