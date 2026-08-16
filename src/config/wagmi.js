import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'
import { http } from 'viem'

// Wallet + chain config (P0-09, full-stack-integrator role via frontend-engineer).
// wagmi 2 / viem 2 floor — NEVER wagmi 3: RainbowKit ships no wagmi-3 release, and
// forcing it breaks the wallet UI and the Buffer polyfill main.jsx depends on
// (ACTIVE_STACK.md). viem is imported by named export (`http`) — tree-shake rule.
//
// Chains:
//  • Base mainnet   (8453 )  — primary network + USDC payments (MAINNET, real funds)
//  • Base Sepolia   (84532)  — the CTF + escrow demos (TESTNET, no real funds)
// Testnet vs mainnet must be labelled honestly wherever a chain surfaces
// (FR-042 / BR-09) — never let a visitor mistake a testnet demo for real value.

export const config = getDefaultConfig({
  appName: 'jw3b.dev',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  ssr: false,
})

// The set of chains the app supports — the single source for "is this chain supported?".
export const SUPPORTED_CHAINS = [base, baseSepolia]
export const SUPPORTED_CHAIN_IDS = SUPPORTED_CHAINS.map((c) => c.id)

// Honest per-chain metadata (FR-042). `isTestnet` drives the TESTNET/MAINNET badge;
// `fundsWarning` copy is surfaced wherever value could be at stake.
export const CHAIN_META = {
  [base.id]: {
    label: 'Base',
    network: 'MAINNET',
    isTestnet: false,
    fundsWarning: 'Real funds — transactions on Base mainnet move real USDC.',
  },
  [baseSepolia.id]: {
    label: 'Base Sepolia',
    network: 'TESTNET',
    isTestnet: true,
    fundsWarning: 'Testnet only — no real funds are ever at risk here.',
  },
}

/** Metadata for a chain id, or a safe "unsupported" descriptor for anything off-list. */
export function chainMeta(chainId) {
  return (
    CHAIN_META[chainId] || {
      label: 'Unsupported network',
      network: 'UNSUPPORTED',
      isTestnet: false,
      fundsWarning: 'Switch to Base or Base Sepolia to continue.',
    }
  )
}

export const isSupportedChain = (chainId) => SUPPORTED_CHAIN_IDS.includes(chainId)
