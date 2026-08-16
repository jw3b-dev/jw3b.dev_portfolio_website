import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

/*
 * ConnectButton seam test (P0-09 · full-stack-integrator). The button wraps RainbowKit's
 * headless `ConnectButton.Custom` render-prop, so the seam is: given a wallet/chain state,
 * does it render the right honest surface? We stub RainbowKit to feed controlled states and
 * assert each branch — disconnected, wrong-network, and connected — plus the honest
 * network label (BR-09: a Base Sepolia demo must never masquerade as mainnet value).
 */

// Controlled render-prop args; each test overrides before importing the component.
let customArgs
vi.mock('@rainbow-me/rainbowkit', () => ({
  // config/wagmi.js (pulled in transitively via chainMeta) calls getDefaultConfig at load.
  getDefaultConfig: () => ({}),
  ConnectButton: {
    Custom: ({ children }) => children(customArgs),
  },
}))

const { default: ConnectButton } = await import('./ConnectButton.jsx')

const base = {
  openAccountModal: () => {},
  openChainModal: () => {},
  openConnectModal: () => {},
  authenticationStatus: undefined,
  mounted: true,
}

describe('ConnectButton — wallet seam states (P0-09 / BR-09)', () => {
  it('disconnected → "Connect wallet"', () => {
    customArgs = { ...base, account: null, chain: null }
    render(<ConnectButton />)
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
  })

  it('wrong network → "Wrong network" (routes to the chain switcher)', () => {
    customArgs = { ...base, account: { displayName: '0xabc…123' }, chain: { id: 1, unsupported: true } }
    render(<ConnectButton />)
    expect(screen.getByRole('button', { name: /wrong network/i })).toBeInTheDocument()
  })

  it('connected on Base Sepolia → honest TESTNET label, not mainnet value', () => {
    customArgs = {
      ...base,
      account: { displayName: '0xabc…123', displayBalance: '1.2 ETH' },
      chain: { id: 84532, name: 'Base Sepolia', unsupported: false },
    }
    render(<ConnectButton />)
    expect(screen.getByText('0xabc…123')).toBeInTheDocument()
    // BR-09: the network badge labels the testnet honestly — never blank, never "MAINNET".
    expect(screen.getByText(/testnet/i)).toBeInTheDocument()
    expect(screen.queryByText(/^mainnet$/i)).toBeNull()
  })
})
