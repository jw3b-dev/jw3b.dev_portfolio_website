/*
 * jw3b.dev v2 — Escrow checkout flow logic (P2-04 · FR-033/FR-035 · BR-06/09/12)
 *   ·  app-ui-engineer / full-stack-integrator
 * PURE state derivation for the escrow rail, kept out of the React hook so the whole
 * product-state machine is unit-testable without a wallet or a chain. The hook
 * (useEscrow) feeds it the live wagmi results; the component (EscrowCheckout) renders by
 * `phase`. Simulate-first is enforced here: no phase advances to a write until simulation
 * succeeds (FR-027). The client never carries a price — only the route + tx (BR-12).
 */
import { keccak256, toHex } from 'viem'
import { revertReason } from './web3Guards.js'

/** Deterministic bytes32 milestone id for an engagement label — the off-chain text lives in
 *  D1, the chain stores its hash (matches MilestoneEscrow's `bytes32 milestone`). Pure. */
export function milestoneHash(label) {
  return keccak256(toHex(String(label ?? 'engagement')))
}

/**
 * The full product-state set (FR-035). Precedence matters — provisioning and wallet
 * readiness gate everything, then the simulate → write → wait lifecycle, and any failure
 * falls back to the guaranteed floor rather than a dead-end (SC-1/SC-2).
 *
 * @returns {{phase: string, reason: string|null, degrade: boolean}}
 *   phase ∈ unprovisioned | disconnected | wrong-chain | simulating | blocked |
 *           ready | signing | pending | funded | error
 *   degrade = true means the UI should offer the book-a-call floor for this phase.
 */
export function resolveEscrowPhase({
  provisioned,
  connected,
  correctChain,
  sim = {},
  write = {},
  receipt = {},
} = {}) {
  if (!provisioned) return phase('unprovisioned', null, true) // escrow not live → floor
  if (!connected) return phase('disconnected')
  if (!correctChain) return phase('wrong-chain')

  // Lifecycle, most-settled first.
  if (receipt.success) return phase('funded')
  if (receipt.error || write.error) {
    return phase('error', revertReason(receipt.error || write.error), true) // retry OR floor
  }
  if (write.pending) return phase('pending') // broadcast, awaiting receipt
  if (write.signing) return phase('signing') // awaiting wallet signature

  // Simulate-first gate — a write is unreachable until simulation succeeds (FR-027).
  if (sim.error) return phase('blocked', revertReason(sim.error), true) // reason + floor
  if (sim.loading) return phase('simulating')
  if (sim.ready) return phase('ready')
  return phase('simulating')
}

function phase(name, reason = null, degrade = false) {
  return { phase: name, reason, degrade }
}

/**
 * Build the `/engagement` submission for a funded escrow (route='escrow'). The tier id
 * travels, never the price (BR-12); the Worker is the price authority. Wallet + tx hash
 * record which on-chain agreement this engagement corresponds to.
 */
export function escrowSubmission(selection, { wallet, txHash } = {}) {
  return {
    objective: selection?.objective ?? null,
    engagement: selection?.engagement ?? null,
    tier: selection?.tier?.id ?? selection?.tier ?? null,
    assessment: selection?.assessment ?? null,
    contact: selection?.contact ?? null,
    wallet: wallet ?? null,
    txHash: txHash ?? null,
    route: 'escrow',
  }
}
