/*
 * jw3b.dev v2 — useCtf (P2-09 · FR-022/023/024/026)  ·  app-ui-engineer / web3-blockchain
 * Wires the Capture-the-Vault flow: deploy the visitor's Attacker → simulate → attack{value}
 * (drains the vault) → POST /ctf/verify for the on-chain-verified rank. Pure state lives in
 * ctfFlow.js so this stays thin glue. Base Sepolia only (FR-024). When the CTF isn't
 * provisioned it degrades; when verification can't reach the chain/Worker it surfaces a
 * labelled recorded solve (FR-026). Simulate-first on the attack write (FR-027).
 */
import { useCallback, useState } from 'react'
import { useAccount, useChainId, useDeployContract, useSimulateContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { CTF, ctfProvisioned } from '../config/contracts.js'
import { isEnabled } from '../config/features.js'
import { AGENT_CTF_VERIFY_URL } from '../config/worker.js'
import { simulateGate } from '../lib/web3Guards.js'
import { resolveCtfPhase, ctfVerifyBody, recordedSolve } from '../lib/ctfFlow.js'

// A tiny seed for the attack — testnet ETH only. The reentrancy multiplies it into the pool.
const ATTACK_SEED = parseEther('0.001')

export function useCtf() {
  const provisioned = isEnabled('ctf') && ctfProvisioned()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const correctChain = chainId === CTF.chainId

  const { deployContract, data: attackerAddress, isPending: deploying, error: deployError } = useDeployContract()
  const attackSim = useSimulateContract({
    address: attackerAddress,
    abi: CTF.attackerAbi,
    functionName: 'attack',
    value: ATTACK_SEED,
    chainId: CTF.chainId,
    query: { enabled: Boolean(provisioned && correctChain && attackerAddress) },
  })
  const { writeContract, data: attackTx, isPending: attacking, error: attackError } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash: attackTx, query: { enabled: Boolean(attackTx) } })

  const [verify, setVerify] = useState({})

  const state = resolveCtfPhase({
    provisioned,
    connected: isConnected,
    correctChain,
    deploy: { pending: deploying, error: deployError },
    attack: { pending: attacking || (Boolean(attackTx) && receipt.isLoading), error: attackError },
    verify,
  })

  // Deploy the visitor's own Attacker (constructor takes the vault address).
  const deploy = useCallback(() => {
    deployContract({ abi: CTF.attackerAbi, bytecode: CTF.attackerBytecode, args: [CTF.vaultAddress] })
  }, [deployContract])

  // Attack fires only from a successful simulation (FR-027).
  const attack = useCallback(() => {
    const gate = simulateGate(attackSim)
    if (gate.ready) writeContract(gate.request)
  }, [attackSim, writeContract])

  // Verify the drain via the Worker; a chain/Worker failure degrades to a recorded solve.
  const runVerify = useCallback(async () => {
    if (!receipt.isSuccess || !attackTx) return
    setVerify({ loading: true })
    try {
      const res = await fetch(AGENT_CTF_VERIFY_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(ctfVerifyBody({ address, txHash: attackTx, attacker: attackerAddress })),
      })
      if (!res.ok) throw new Error(`verify ${res.status}`)
      const body = await res.json()
      setVerify(body.solved ? { solved: true, alreadySolved: body.alreadySolved, rank: body.rank } : { error: new Error(body.reason || 'not solved') })
    } catch {
      setVerify({ recorded: true, ...recordedSolve() })
    }
  }, [receipt.isSuccess, attackTx, address, attackerAddress])

  return { ...state, deploy, attack, runVerify, attackerAddress, txHash: attackTx, rank: verify.rank ?? null }
}
