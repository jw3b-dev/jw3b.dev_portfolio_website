/*
 * jw3b.dev v2 — On-chain contract config (P2-04).  ·  web3-blockchain / full-stack-integrator
 * The single source of the deployed addresses the client talks to. Everything here is
 * OWNER-PROVISIONED: until John deploys MilestoneEscrow (P2-01) to Base and pastes its
 * address, `ESCROW.address` is null and the escrow rail degrades to the book-a-call floor
 * (FR-032/OD-03). No `0x000…0` placeholder that could masquerade as a live deployment.
 */
import MilestoneEscrowAbi from './abis/MilestoneEscrow.json'
import AttackerAbi from './abis/Attacker.json'
import { ATTACKER_BYTECODE } from './abis/Attacker.bytecode.js'

// Base mainnet USDC (6-decimal) — the settlement token for escrow payments (BR-06).
export const USDC_ADDRESS = {
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Base mainnet
}

// MilestoneEscrow — owner-deployed to Base at deal-close. `address: null` until then.
export const ESCROW = Object.freeze({
  address: null, // ← replace with the deployed 0x… address (owner-provisioned)
  chainId: 8453, // Base mainnet (real USDC)
  abi: MilestoneEscrowAbi,
})

// The escrow payee — John's business wallet (a PUBLIC address; safe in client config). Null
// until provisioned; the rail degrades to book-a-call while it or ESCROW.address is missing.
export const PROVIDER_WALLET = null // ← replace with John's receiving 0x… address

// Unlock Protocol locks (P2-05). Keyed by tier/offer id → the deployed lock. Empty until
// John deploys real locks; an offer with no real lock is HIDDEN → book-a-call (FR-034).
//   [key]: { address: '0x…', chainId: 8453, network: 8453 }
export const UNLOCK_LOCKS = Object.freeze({})

/** The deployed lock for a key, or null when it isn't a real provisioned lock (→ hide). */
export function unlockLockFor(key) {
  const lock = UNLOCK_LOCKS[key]
  return lock && isRealAddress(lock.address) ? lock : null
}

/** True only when at least one real Unlock lock is deployed. */
export function unlockProvisioned() {
  return Object.values(UNLOCK_LOCKS).some((l) => isRealAddress(l?.address))
}

// CTF (P2-09) — the ReentrantVault on Base Sepolia. The Attacker ABI + bytecode ship in the
// bundle because the VISITOR deploys their own attacker (the challenge). This is the vault
// already deployed + Basescan-verified in the prior work (still armed with testnet bait as of
// 2026-08-16); it's compatible because the v2 attack calls deposit()/withdraw() (identical
// selectors) and the Worker verifies by raw eth_getBalance, not a named view function. The
// `ctf` feature flag still gates the route, and the Worker needs CTF_VAULT_ADDRESS set to match.
export const CTF = Object.freeze({
  vaultAddress: '0x4f72efbe94677E9bd5a3a1741b137e9Ea203C240', // Base Sepolia ReentrantVault (live)
  chainId: 84532, // Base Sepolia — TESTNET, no real funds (BR-09/FR-024)
  attackerAbi: AttackerAbi,
  attackerBytecode: ATTACKER_BYTECODE,
})

/** True only when the CTF vault has a real deployed address to attack. */
export function ctfProvisioned() {
  return isRealAddress(CTF.vaultAddress)
}

/** A real, non-zero EVM address — the gate between "provisioned" and "degrade to floor". */
export function isRealAddress(addr) {
  return typeof addr === 'string' && /^0x[0-9a-fA-F]{40}$/.test(addr) && !/^0x0{40}$/i.test(addr)
}

/** True only when MilestoneEscrow has a real deployed address to call. */
export function escrowProvisioned() {
  return isRealAddress(ESCROW.address)
}
