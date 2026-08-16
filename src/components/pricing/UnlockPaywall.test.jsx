import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

/*
 * UnlockPaywall seam test (P2-05). FR-034: the paywall appears only on a real lock; with no
 * lock it must HIDE and hand over the book-a-call floor (SC-1/SC-2). When offered, the
 * button drives window.unlockProtocol.loadCheckoutModal (FR-041). We stub the flag + lock
 * lookup to drive both branches without a real Unlock deployment.
 */
let flagOn = false
let lock = null
vi.mock('../../config/features.js', () => ({ isEnabled: () => flagOn }))
vi.mock('../../config/contracts.js', () => ({ unlockLockFor: () => lock }))

const { default: UnlockPaywall } = await import('./UnlockPaywall.jsx')

const REAL_LOCK = { address: '0xabc0000000000000000000000000000000000001', chainId: 8453, network: 8453 }
const renderPaywall = () =>
  render(
    <MemoryRouter>
      <UnlockPaywall lockKey="pro" title="Pro" selection={{ objective: 'audit' }} loadout={{ tier: { id: 'pro' } }} />
    </MemoryRouter>,
  )

beforeEach(() => {
  flagOn = false
  lock = null
})
afterEach(() => {
  delete window.unlockProtocol
})

describe('UnlockPaywall — offer only on a real lock, else the floor (FR-034)', () => {
  it('no lock / flag off → hides the paywall and renders the book-a-call floor', () => {
    renderPaywall()
    expect(screen.getByText(/isn’t live yet/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/you@company.com/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /unlock membership/i })).toBeNull()
  })

  it('flag on + real lock → offers the paywall and drives window.unlockProtocol (FR-041)', () => {
    flagOn = true
    lock = REAL_LOCK
    const loadCheckoutModal = vi.fn()
    window.unlockProtocol = { loadCheckoutModal }

    renderPaywall()
    const btn = screen.getByRole('button', { name: /unlock membership/i })
    fireEvent.click(btn)

    expect(loadCheckoutModal).toHaveBeenCalledTimes(1)
    const cfg = loadCheckoutModal.mock.calls[0][0]
    expect(cfg.pessimistic).toBe(true)
    expect(cfg.locks[REAL_LOCK.address]).toEqual({ network: 8453 })
  })
})
