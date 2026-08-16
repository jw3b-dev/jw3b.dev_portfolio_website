import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

/*
 * CheckoutStateMachine test (P2-07). Proves the routing → rail wiring and, above all, that
 * there is NO dead-end (OBJ-01): the default (both rails off) lands on the book-a-call floor,
 * and each provisioned+enabled rail routes to its own checkout. Child rails are stubbed so
 * the test isolates the orchestration (no wagmi / Unlock script needed).
 */
let escrowOn, escrowOk, unlockOn, unlockOk
vi.mock('../../config/features.js', () => ({ isEnabled: (n) => (n === 'escrow' ? escrowOn : n === 'unlock' ? unlockOn : false) }))
vi.mock('../../config/contracts.js', () => ({
  escrowProvisioned: () => escrowOk,
  unlockProvisioned: () => unlockOk,
}))
vi.mock('./EscrowCheckout.jsx', () => ({ default: () => <div>ESCROW RAIL</div> }))
vi.mock('../pricing/UnlockPaywall.jsx', () => ({ default: () => <div>UNLOCK RAIL</div> }))
vi.mock('./BookACall.jsx', () => ({ default: () => <div>BOOK A CALL FLOOR</div> }))

const { default: CheckoutStateMachine } = await import('./CheckoutStateMachine.jsx')

const renderSM = (engagement) =>
  render(<CheckoutStateMachine selection={{ engagement, tier: { id: 't' } }} loadout={{ tier: { id: 't', name: 'Pro' } }} />)

beforeEach(() => {
  escrowOn = escrowOk = unlockOn = unlockOk = false
})

describe('CheckoutStateMachine — route to a rail, never a dead-end (OBJ-01)', () => {
  it('default (both rails off) → the book-a-call floor', () => {
    renderSM('project')
    expect(screen.getByText('BOOK A CALL FLOOR')).toBeInTheDocument()
  })

  it('retainer/project + escrow live → escrow rail', () => {
    escrowOn = escrowOk = true
    renderSM('project')
    expect(screen.getByText('ESCROW RAIL')).toBeInTheDocument()
  })

  it('escrow enabled but NOT provisioned → still the floor (degrade)', () => {
    escrowOn = true
    escrowOk = false
    renderSM('retainer')
    expect(screen.getByText('BOOK A CALL FLOOR')).toBeInTheDocument()
  })

  it('low-ticket fixed-price + unlock live → unlock rail', () => {
    unlockOn = unlockOk = true
    renderSM('fixed')
    expect(screen.getByText('UNLOCK RAIL')).toBeInTheDocument()
  })
})
