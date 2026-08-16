/*
 * jw3b.dev v2 — useEscrow (P2-04 · FR-033/FR-035)  ·  full-stack-integrator / web3-blockchain
 * Wires the MilestoneEscrow fund() flow to the UI: Simulate → Write → Wait for receipt
 * (FR-027 — simulate-first is the hard rule; the write is only ever `sim.data.request`).
 * Pure state derivation lives in escrowFlow.js so this stays thin glue. When escrow is not
 * provisioned (flag off / no deployed address) or a step fails, the derived phase carries
 * `degrade:true` and the component drops to the book-a-call floor (SC-1/SC-2). USDC amounts
 * pass through the 6-dec BigInt guard; the client never carries a price (BR-06/BR-12).
 */
import { useCallback } from 'react'
import { useAccount, useChainId, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { ESCROW, escrowProvisioned } from '../config/contracts.js'
import { isEnabled } from '../config/features.js'
import { toUsdcBaseUnits, fundsPolicy } from '../lib/web3Guards.js'
import { resolveEscrowPhase, escrowSubmission, milestoneHash } from '../lib/escrowFlow.js'
import { enqueue } from '../lib/engagementQueue.js'

export function useEscrow({ selection, provider, amountUsdc } = {}) {
  const provisioned = isEnabled('escrow') && escrowProvisioned()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const correctChain = chainId === ESCROW.chainId

  // 6-dec BigInt or a surfaced conversion error (never a float; BR-06).
  let amount = null
  let amountError = null
  try {
    if (provisioned && amountUsdc != null) amount = toUsdcBaseUnits(String(amountUsdc))
  } catch (err) {
    amountError = err
  }

  const canSimulate = Boolean(provisioned && correctChain && amount != null && provider)
  const milestone = milestoneHash(selection?.tier?.name ?? selection?.tier ?? selection?.objective)

  const sim = useSimulateContract({
    address: ESCROW.address ?? undefined,
    abi: ESCROW.abi,
    functionName: 'fund',
    args: canSimulate ? [provider, amount, milestone] : undefined,
    chainId: ESCROW.chainId,
    query: { enabled: canSimulate },
  })

  const { writeContract, data: txHash, isPending: signing, error: writeError } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: txHash, query: { enabled: Boolean(txHash) } })

  const state = resolveEscrowPhase({
    provisioned,
    connected: isConnected,
    correctChain,
    sim: { ready: sim.isSuccess && Boolean(sim.data?.request), loading: sim.isLoading, error: sim.error || amountError },
    write: { signing, pending: Boolean(txHash) && receipt.isLoading, error: writeError },
    receipt: { success: receipt.isSuccess, error: receipt.error },
  })

  // The write NEVER fires except from a successful simulation's request (FR-027).
  const fund = useCallback(() => {
    if (sim.data?.request) writeContract(sim.data.request)
  }, [sim.data, writeContract])

  // On a confirmed receipt, record the engagement (route=escrow) — the caller fires this once.
  const recordEngagement = useCallback(() => {
    if (receipt.isSuccess) enqueue(escrowSubmission(selection, { wallet: address, txHash }))
  }, [receipt.isSuccess, selection, address, txHash])

  return { ...state, funds: fundsPolicy(chainId), txHash, fund, recordEngagement }
}
