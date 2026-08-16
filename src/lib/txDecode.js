/*
 * jw3b.dev v2 — Client-side transaction decoder (P2-16 · FR-010)  ·  full-stack-integrator
 * PURE, offline-safe: given a fetched transaction, decode its selector + shape into a plain
 * summary — no Worker, no AI. This is the FLOOR: the decoded calldata shows even when the
 * Worker (the AI narrative) is down. The narrative only enriches this deterministic summary;
 * the client never invents what the tx did beyond what the calldata says.
 */
import { formatEther } from 'viem'

export const TX_HASH = /^0x[0-9a-fA-F]{64}$/
export function isValidTxHash(hash) {
  return TX_HASH.test(String(hash || ''))
}

// Well-known 4-byte selectors → human signatures (no ABI needed for the common cases).
export const KNOWN_SELECTORS = Object.freeze({
  '0xa9059cbb': 'transfer(address,uint256)',
  '0x095ea7b3': 'approve(address,uint256)',
  '0x23b872dd': 'transferFrom(address,address,uint256)',
  '0xd0e30db0': 'deposit()',
  '0x2e1a7d4d': 'withdraw(uint256)',
  '0x3ccfd60b': 'withdraw()',
})

/** The 4-byte function selector of some calldata, or null when there is none. */
export function selectorOf(calldata) {
  const s = String(calldata || '')
  return /^0x[0-9a-fA-F]{8}/.test(s) ? s.slice(0, 10).toLowerCase() : null
}

function toBigInt(v) {
  try {
    if (v == null) return 0n
    return typeof v === 'bigint' ? v : BigInt(v)
  } catch {
    return 0n
  }
}

function summarize({ kind, functionName, valueEth, to }) {
  const withValue = Number(valueEth) > 0 ? ` with ${valueEth} ETH` : ''
  if (kind === 'eth-transfer') return `Plain ETH transfer of ${valueEth} ETH to ${to}.`
  if (functionName) return `Calls ${functionName} on ${to}${withValue}.`
  if (kind === 'contract-call') return `Calls an unrecognised function (${functionName ?? 'unknown selector'}) on ${to}${withValue}.`
  return 'Empty transaction — no value and no calldata.'
}

/**
 * Decode a transaction object ({hash, from, to, value, input}) into a deterministic summary.
 * @returns {{hash, from, to, valueEth, selector, functionName, kind, calldataBytes, summary}}
 */
export function decodeTx(tx) {
  const input = tx?.input ?? tx?.data ?? '0x'
  const selector = selectorOf(input)
  const functionName = selector ? KNOWN_SELECTORS[selector] || null : null
  const valueWei = toBigInt(tx?.value)
  const valueEth = formatEther(valueWei)
  const kind = selector ? 'contract-call' : valueWei > 0n ? 'eth-transfer' : 'empty'
  return {
    hash: tx?.hash ?? null,
    from: tx?.from ?? null,
    to: tx?.to ?? null,
    valueEth,
    selector,
    functionName,
    kind,
    calldataBytes: input === '0x' ? 0 : (input.length - 2) / 2,
    summary: summarize({ kind, functionName, valueEth, to: tx?.to }),
  }
}
