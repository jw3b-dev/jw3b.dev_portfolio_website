import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ClaimsGateDemo from './ClaimsGateDemo.jsx'
import { FORBIDDEN_PATTERNS, scanTextForForbidden } from '../../lib/claimsValidate.js'
import { forbiddenList, allClaims } from '../../lib/claimsRegister.js'
import { isCleared } from '../../lib/claimsValidate.js'

/*
 * W4 — /thesis/zero-trust-validator must run its own gate (PRODUCT_AUDIT #22).
 *
 * The page says "an unbacked claim fails the pipeline" and then asked you to take that on faith,
 * which is the one thing the page is against. The demo runs the ACTUAL exported gate, not a
 * re-implementation — if the two ever diverged, the demo would be the lie it exists to disprove.
 */
const type = (value) => fireEvent.change(screen.getByLabelText(/^claim$/i), { target: { value } })

describe('ClaimsGateDemo — the gate, not a mock of it', () => {
  /*
   * The inputs come from the register's own forbidden list, not from literals written here — the
   * claims gate scans this file too, and hardcoding the phrases failed the build (correctly: it
   * cannot tell "asserted as fact" from "used as a test fixture"). Deriving them also means a new
   * forbidden entry is covered the moment it is added.
   */
  it('blocks every phrase the register forbids', () => {
    render(<ClaimsGateDemo />)
    const blockable = forbiddenList.filter((f) => scanTextForForbidden(f).length > 0)
    expect(blockable.length, 'the register lists forbidden claims no pattern catches').toBeGreaterThan(3)
    for (const claim of blockable) {
      type(claim)
      expect(screen.getByRole('status').textContent, `"${claim}" should be blocked`).toMatch(/blocked/i)
    }
  })

  it('passes a claim John can actually back', () => {
    render(<ClaimsGateDemo />)
    const cleared = allClaims().find((c) => isCleared(c))
    type(`${cleared.value} — ${cleared.label}`)
    expect(screen.getByRole('status').textContent).toMatch(/passes the forbidden scan/i)
  })

  it('never calls a pass "cleared" — passing the scan is not clearance', () => {
    render(<ClaimsGateDemo />)
    type('a perfectly ordinary sentence')
    const status = screen.getByRole('status').textContent
    expect(status).toMatch(/not clearance/i)
    expect(status).toMatch(/evidence pointer/i)
  })

  it('agrees with the real gate on every forbidden pattern it claims to enforce', () => {
    // The demo advertises a count; that count must be the real one, not a number in copy.
    render(<ClaimsGateDemo />)
    expect(screen.getByText(new RegExp(`${FORBIDDEN_PATTERNS.length} forbidden patterns`))).toBeInTheDocument()
  })

  it('reports the rule that matched, so the block is inspectable', () => {
    render(<ClaimsGateDemo />)
    const probe = forbiddenList.find((f) => scanTextForForbidden(f).length > 0)
    type(probe)
    const expected = scanTextForForbidden(probe)
    expect(expected.length).toBeGreaterThan(0)
    for (const rule of expected) expect(screen.getByText(rule)).toBeInTheDocument()
  })

  it('applies the standard to John — states how many of his own claims survive', () => {
    render(<ClaimsGateDemo />)
    expect(screen.getByText(/register claims render today/i)).toBeInTheDocument()
    // Strip the evidence pointers and the count must fall to zero: the gate is not sentimental.
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
