import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, baseSepolia } from 'wagmi/chains'

// Skeleton wallet config (P0-01). wagmi 2 / viem 2 floor — NEVER wagmi 3:
// RainbowKit has no wagmi-3 release, and forcing it breaks the wallet UI and the
// Buffer polyfill main.jsx depends on (ACTIVE_STACK.md).
//
// Chains: Base mainnet (id 8453 — primary + USDC payments) and Base Sepolia
// (id 84532 — the testnet CTF + escrow demos). Testnet vs mainnet must be
// labelled honestly wherever a chain surfaces (FR-042 / BR-09).
//
// P0-09 (full-stack-integrator) extends this with the custom RainbowKit
// ConnectButton (connect / wrong-network / account+chain states).
export const config = getDefaultConfig({
  appName: 'jw3b.dev',
  projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo',
  chains: [base, baseSepolia],
  ssr: false,
})
