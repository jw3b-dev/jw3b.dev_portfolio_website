---
name: web3-blockchain
description: jw3b.dev v2 client-side web3 — wagmi 2 / viem 2 / RainbowKit 2 wallet connect and contract calls, simulate-first transactions, USDC-6dec handling, chain guards, and degrade-to-book-a-call. Use for the escrow checkout (P2-04), Unlock paywall (P2-05), CTF interactions, or any on-chain client flow. jw3b-retargeted override of the user-scope web3-blockchain.
---

# Web3 / Blockchain (client) — jw3b.dev v2

Project override. Generic charter (simulate-first law, integer base units, full tx state
set, degrade-don't-dead-end) at user scope; this pins it to the repo.

## Stack (pinned — do NOT bump)

- **wagmi 2.x · viem 2.x · RainbowKit 2.x. NEVER wagmi v3** — RainbowKit peer-requires
  `wagmi ^2.9`, there is no RainbowKit-for-wagmi-3, and forcing v3 breaks the wallet UI and
  drops the `buffer` polyfill `main.jsx` imports. (`CLAUDE.md` dependency constraints.)
- Config: `src/config/wagmi.js` (chains + `CHAIN_META`, honest testnet/mainnet labels).
  Custom connect UI: `src/components/wallet/ConnectButton.jsx` (built P0-09, mounts at P2-04/05).
- Chains: **Base** 8453 (primary) · **Base Sepolia** 84532 · Mainnet/Polygon per config.

## The rules that bite here

- **Simulate → Write → Wait**, always: `useSimulateContract` → `writeContract` →
  `useWaitForTransactionReceipt`. No write path without a preceding successful simulate
  (FR-027/033). Read with `useReadContract` (not legacy `useContractRead`).
- **USDC is 6-dec:** `parseUnits(x, 6)` → BigInt for amounts, format with the inverse. No
  `Number`, no `* 1e6`. **Price provenance = `src/data/retainer.json` only; the client never
  sends or invents a price** (BR-12).
- **Tree-shake viem:** `import { parseUnits } from 'viem'`, never whole-object imports.
- **Degrade, don't dead-end:** consume the ABI from `src/config/abis/`; if the flag is off
  (`src/config/features.js` — escrow/unlock/ctf default false) or an address is absent,
  degrade to the **book-a-call floor**, never a broken/disabled button (SC-1/SC-2). Label
  testnet vs mainnet on every on-chain surface.
- **CSP:** `connect-src` in `public/_headers` allows the Base RPCs + WalletConnect + Unlock;
  add a host there if a new endpoint is genuinely needed. Anthropic stays absent (worker-only).

## Boundary

Consume the ABI the smart-contract-engineer exports; do NOT edit `contracts/*`. Coordinate
with the worker (backend) for anything a server must own. No private keys in frontend —
public `VITE_*` values only (e.g. `VITE_WALLETCONNECT_PROJECT_ID`).
