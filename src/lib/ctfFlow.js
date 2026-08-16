/*
 * jw3b.dev v2 — CTF challenge flow logic (P2-09 · FR-022/023/024/026)  ·  app-ui-engineer
 * PURE state derivation for "Capture the Vault", kept out of the React hook so the whole
 * state machine is unit-testable without a wallet or a chain. The visitor connects on Base
 * Sepolia, deploys their own Attacker, drains the vault, and the Worker verifies the drain
 * on-chain (P2-08). Every surface is labelled testnet (FR-024). If the chain or Worker is
 * unreachable the flow degrades to a labelled RECORDED solve (FR-026) — never a dead box.
 */
import { revertReason } from './web3Guards.js'

// FR-024 — the honest label that MUST appear on every CTF surface.
export const CTF_LABEL = 'Base Sepolia testnet · no real funds'

/**
 * The full CTF product-state set (FR-023). Precedence: provisioning + wallet + chain gate
 * everything; then the deploy → attack → verify lifecycle; a confirmed solve is terminal
 * (solved / already-solved); an unreachable Worker degrades to a recorded solve.
 *
 * @returns {{phase: string, reason: string|null, degrade: boolean}}
 *   phase ∈ unprovisioned | disconnected | wrong-chain | vault-empty | ready | deploying |
 *           attacking | verifying | solved | already-solved | recorded | error
 */
export function resolveCtfPhase({
  provisioned,
  connected,
  correctChain,
  vaultFunded = true,
  deploy = {},
  attack = {},
  verify = {},
} = {}) {
  if (!provisioned) return phase('unprovisioned', null, true)
  if (!connected) return phase('disconnected')
  if (!correctChain) return phase('wrong-chain')

  // Verify outcomes are the most terminal.
  if (verify.solved) return phase(verify.alreadySolved ? 'already-solved' : 'solved')
  if (verify.recorded) return phase('recorded', 'live verification unavailable — showing a recorded solve', true)
  if (verify.error) return phase('error', revertReason(verify.error), true)
  if (verify.loading) return phase('verifying')

  // Attack, then deploy — a failure at either degrades to retry/floor.
  if (attack.error) return phase('error', revertReason(attack.error), true)
  if (attack.pending) return phase('attacking')
  if (deploy.error) return phase('error', revertReason(deploy.error), true)
  if (deploy.pending) return phase('deploying')

  // Nothing to drain yet — the owner (or prior players) must seed the bounty.
  if (!vaultFunded) return phase('vault-empty')
  return phase('ready')
}

function phase(name, reason = null, degrade = false) {
  return { phase: name, reason, degrade }
}

/** The POST body for /ctf/verify (P2-08). */
export function ctfVerifyBody({ address, txHash, attacker }) {
  return { address, txHash, attacker: attacker ?? null }
}

/**
 * A labelled recorded solve for the FR-026 fallback — shown when the chain/Worker can't
 * verify live. It is explicitly a recorded demonstration, never presented as the visitor's
 * own fresh on-chain solve (radical honesty).
 */
export function recordedSolve() {
  return {
    recorded: true,
    label: 'Recorded solve',
    note: 'A previously-captured run of the reentrancy drain — live verification is unavailable right now.',
  }
}
