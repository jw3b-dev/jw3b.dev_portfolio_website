/*
 * jw3b.dev v2 — Web3 correctness guards (P2-03 · FR-027 · BR-04/06/09 · DE-03)  ·  web3-blockchain
 * PURE, framework-free helpers that make the on-chain rails correct-by-construction. Hooks
 * (useSimulateContract / writeContract) live in the components; these functions are the
 * testable logic those hooks route through, so the three rules can't quietly rot:
 *   1. Simulate-first — a write may fire ONLY from a successful simulation (FR-027/BR-04).
 *   2. USDC precision — amounts are 6-decimal BigInt base units, never a JS float (BR-06).
 *   3. Testnet honesty — every on-chain surface states whether it moves real value (BR-09).
 * Nothing here holds a key, calls a chain, or invents a price — the server owns prices (BR-12).
 */
import { parseUnits, formatUnits } from 'viem'
import { chainMeta } from '../config/wagmi.js'

export const USDC_DECIMALS = 6

// ── 1. Simulate-first gate (FR-027 / BR-04) ────────────────────────────────────────────
/**
 * The single chokepoint every write flows through: given a `useSimulateContract` result,
 * return the request to hand to `writeContract` — or the reason the write is blocked. The
 * UI calls `writeContract(gate.request)` ONLY when `ready` is true, so a write with no
 * successful simulate in front of it cannot exist. Simulation catches the revert (bad
 * allowance, wrong state) before the wallet prompts and before gas is spent.
 * @returns {{ready: boolean, request: object|null, reason: string|null}}
 */
export function simulateGate(simulation) {
  if (!simulation || typeof simulation !== 'object') {
    return { ready: false, request: null, reason: 'no simulation — write blocked (simulate-first, FR-027)' }
  }
  if (simulation.error) {
    return { ready: false, request: null, reason: revertReason(simulation.error) }
  }
  const request = simulation.data?.request ?? null
  if (!request) {
    return { ready: false, request: null, reason: 'simulation pending — no request yet' }
  }
  return { ready: true, request, reason: null }
}

/** Surface a human revert reason from a viem/wagmi error — never swallow it into a blank fail. */
export function revertReason(error) {
  if (!error) return 'unknown revert'
  return error.shortMessage || error.details || error.message || String(error)
}

// ── 2. USDC precision (BR-06 / DE-03) ──────────────────────────────────────────────────
/**
 * Convert a human USDC string to 6-decimal BigInt base units. Rejects a JS Number outright:
 * a float in a money path silently moves the wrong amount. Input is a plain decimal string
 * (up to 6 places), > 0.
 * @param {string} amount e.g. "1500", "2499.99"
 * @returns {bigint} base units, e.g. 1500000000n
 */
export function toUsdcBaseUnits(amount) {
  if (typeof amount !== 'string') {
    throw new TypeError('USDC amount must be a string, never a Number — floats lose precision (BR-06)')
  }
  const trimmed = amount.trim()
  if (!/^\d+(\.\d{1,6})?$/.test(trimmed)) {
    throw new RangeError(
      `USDC amount "${amount}" is invalid — digits with up to ${USDC_DECIMALS} decimals, no sign or exponent`,
    )
  }
  const units = parseUnits(trimmed, USDC_DECIMALS)
  if (units <= 0n) throw new RangeError('USDC amount must be greater than zero')
  return units
}

/** Format 6-decimal BigInt base units back to a display string. Requires a BigInt (no floats). */
export function formatUsdc(baseUnits) {
  if (typeof baseUnits !== 'bigint') {
    throw new TypeError('formatUsdc expects a BigInt base-unit amount, not a Number')
  }
  return formatUnits(baseUnits, USDC_DECIMALS)
}

// ── 3. Testnet honesty (BR-09 / FR-042 / FR-024) ───────────────────────────────────────
/**
 * The honest funds policy for a chain — what every on-chain surface must state so a visitor
 * never mistakes a testnet demo for real value (or vice versa). Derived from the single
 * `chainMeta` source; no surface hardcodes the label.
 * @returns {{label: string, isTestnet: boolean, movesRealFunds: boolean, warning: string}}
 */
export function fundsPolicy(chainId) {
  const meta = chainMeta(chainId)
  return {
    label: meta.network, // 'TESTNET' | 'MAINNET' | 'UNSUPPORTED'
    isTestnet: meta.isTestnet,
    movesRealFunds: meta.network === 'MAINNET',
    warning: meta.fundsWarning,
  }
}
