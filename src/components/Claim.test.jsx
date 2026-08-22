/*
 * <Claim> — FR-043, the verified-claim primitive.
 *
 * The behaviour worth pinning is the DISTINCTION. Before this, a figure backed by a public
 * CodeHawks profile and a figure backed by "owner-attested — …" rendered identically, so the
 * register's own honesty never reached the reader. Portfolio-evidence allows attested figures and
 * requires them to be marked as attested — these tests are what stop that regressing to a bare
 * number, which is the failure mode that costs a portfolio its credibility.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Claim from './Claim.jsx'
import { allClaims, isClaimCleared, evidenceKind } from '../lib/claimsRegister.js'

const firstOfKind = (kind) => allClaims().find((c) => isClaimCleared(c) && evidenceKind(c) === kind)

describe('Claim — gating', () => {
  it('renders nothing for an unknown id', () => {
    const { container } = render(<Claim id="does-not-exist" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the fallback for an uncleared inline claim', () => {
    render(<Claim value="99" label="x" fallback={<span>withheld</span>} />)
    expect(screen.getByText('withheld')).toBeInTheDocument()
  })
})

describe('Claim — an attested figure must not look like a verified one', () => {
  it('a VERIFIED claim gets a receipt link and NO attested marker', () => {
    const c = firstOfKind('verified')
    render(<Claim id={c.id} />)
    const link = screen.getByRole('link', { name: new RegExp(`Evidence for`, 'i') })
    expect(link).toHaveAttribute('href', c.evidence_pointer)
    expect(screen.queryByText('attested')).toBeNull()
  })

  it('an ATTESTED claim is marked, and marked visibly', () => {
    const c = firstOfKind('attested')
    render(<Claim id={c.id} />)
    expect(screen.getByText(c.value, { exact: false })).toBeInTheDocument()
    expect(screen.getByText('attested')).toBeInTheDocument()
    // No receipt link, because there is no receipt to open — that is the whole point.
    expect(screen.queryByRole('link')).toBeNull()
  })

  it('an attested claim is INSPECTABLE — the pointer text is exposed, not just labelled', () => {
    const c = firstOfKind('attested')
    render(<Claim id={c.id} />)
    // Screen-reader text carries the provenance; the title attribute carries it for pointer users.
    expect(screen.getByText(new RegExp(`owner-attested, not independently verified`, 'i'))).toBeInTheDocument()
    expect(screen.getByText('attested').closest('span[title]')).toHaveAttribute('title', c.evidence_pointer)
  })

  it('the two kinds render differently — the regression this file exists to catch', () => {
    const v = render(<Claim id={firstOfKind('verified').id} />)
    const verifiedHtml = v.container.innerHTML
    v.unmount()
    const a = render(<Claim id={firstOfKind('attested').id} />)
    expect(a.container.innerHTML).not.toBe(verifiedHtml)
    expect(verifiedHtml).not.toMatch(/attested/)
  })
})
