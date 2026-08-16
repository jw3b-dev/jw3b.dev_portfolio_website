import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/*
 * EscrowCheckout seam test (P2-04). The screen renders by the phase useEscrow derives; we
 * stub the hook to drive each phase and assert the right honest surface — most importantly
 * that an unprovisioned rail (the shipped default) drops to the book-a-call floor, never a
 * dead-end (SC-1/SC-2), and that a live phase shows the funding UI with an honest label.
 */
let escrowState
vi.mock('../../hooks/useEscrow.js', () => ({ useEscrow: () => escrowState }))
// Stub the wallet button (RainbowKit) so the seam test needs no wagmi provider.
vi.mock('../wallet/ConnectButton.jsx', () => ({ default: () => <button type="button">Connect wallet</button> }))

const { default: EscrowCheckout } = await import('./EscrowCheckout.jsx')

const TESTNET = { label: 'TESTNET', isTestnet: true, movesRealFunds: false }
const loadout = { tier: { id: 't-pro', name: 'Pro', price: null } }

const renderCheckout = () =>
  render(
    <MemoryRouter>
      <EscrowCheckout selection={{ objective: 'audit' }} loadout={loadout} />
    </MemoryRouter>,
  )

beforeEach(() => {
  escrowState = { phase: 'unprovisioned', reason: null, degrade: true, funds: TESTNET, txHash: null, fund: vi.fn(), recordEngagement: vi.fn() }
})

describe('EscrowCheckout — state set + degrade-to-floor', () => {
  it('unprovisioned → renders the book-a-call floor with an honest note (SC-2)', () => {
    renderCheckout()
    expect(screen.getByText(/isn’t live yet/i)).toBeInTheDocument()
    // BookACall floor is present (its email field is the tell).
    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument()
  })

  it('a blocked simulation degrades to the floor AND surfaces the revert reason', () => {
    escrowState = { ...escrowState, phase: 'blocked', reason: 'insufficient allowance', degrade: true }
    renderCheckout()
    expect(screen.getByText(/insufficient allowance/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument()
  })

  it('ready → shows the Fund button and the honest network label', () => {
    escrowState = { ...escrowState, phase: 'ready', degrade: false }
    renderCheckout()
    expect(screen.getByRole('button', { name: /fund escrow/i })).toBeInTheDocument()
    expect(screen.getByText('TESTNET')).toBeInTheDocument()
  })

  it('funded → success + records the engagement exactly once', () => {
    const recordEngagement = vi.fn()
    escrowState = { ...escrowState, phase: 'funded', degrade: false, txHash: '0xabc', recordEngagement }
    renderCheckout()
    expect(screen.getByText(/escrow funded/i)).toBeInTheDocument()
    expect(recordEngagement).toHaveBeenCalledTimes(1)
  })
})
