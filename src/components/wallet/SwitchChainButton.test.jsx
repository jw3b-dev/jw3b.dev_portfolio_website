/*
 * Regression guard for the owner-reported bug: the wrong-chain state used to render the
 * generic chain picker, whose first entry is Base MAINNET — so "switch to Base Sepolia" sent
 * people to the wrong network. The switch must target the surface's chain EXACTLY, and its
 * label must come from chainMeta so copy can't drift from the configured chain again.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

let switchState
const switchChain = vi.fn()
vi.mock('wagmi', () => ({ useSwitchChain: () => switchState }))
vi.mock('./ConnectButton.jsx', () => ({ default: () => <button type="button">Wallet menu</button> }))

const { default: SwitchChainButton } = await import('./SwitchChainButton.jsx')

const BASE_SEPOLIA = 84532
const BASE_MAINNET = 8453

beforeEach(() => {
  switchChain.mockClear()
  switchState = { switchChain, isPending: false, error: null }
})

describe('SwitchChainButton', () => {
  it('switches to the EXACT chain the surface requires — not whatever is first in the list', () => {
    render(<SwitchChainButton chainId={BASE_SEPOLIA} />)
    fireEvent.click(screen.getByRole('button', { name: /switch to base sepolia/i }))
    expect(switchChain).toHaveBeenCalledTimes(1)
    expect(switchChain).toHaveBeenCalledWith({ chainId: BASE_SEPOLIA })
    expect(switchChain).not.toHaveBeenCalledWith({ chainId: BASE_MAINNET })
  })

  it('labels a testnet from chainMeta and carries its no-real-funds warning', () => {
    render(<SwitchChainButton chainId={BASE_SEPOLIA} />)
    expect(screen.getByRole('button', { name: /switch to base sepolia/i })).toBeInTheDocument()
    expect(screen.getByText(/no real funds/i)).toBeInTheDocument()
  })

  it('labels mainnet from chainMeta and warns that real funds are at stake', () => {
    render(<SwitchChainButton chainId={BASE_MAINNET} />)
    expect(screen.getByRole('button', { name: /switch to base$/i })).toBeInTheDocument()
    expect(screen.getByText(/real funds/i)).toBeInTheDocument()
  })

  it('shows a pending state and cannot be double-fired while the wallet prompt is open', () => {
    switchState = { switchChain, isPending: true, error: null }
    render(<SwitchChainButton chainId={BASE_SEPOLIA} />)
    const btn = screen.getByRole('button', { name: /confirm in your wallet/i })
    expect(btn).toBeDisabled()
    fireEvent.click(btn)
    expect(switchChain).not.toHaveBeenCalled()
  })

  it('on a rejected switch, explains it and still offers the wallet menu — never a dead end', () => {
    switchState = { switchChain, isPending: false, error: new Error('User rejected') }
    render(<SwitchChainButton chainId={BASE_SEPOLIA} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/didn’t switch networks/i)
    expect(screen.getByRole('button', { name: /wallet menu/i })).toBeInTheDocument()
  })
})
