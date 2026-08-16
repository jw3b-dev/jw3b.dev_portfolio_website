/*
 * jw3b.dev v2 — Unlock Protocol paywall logic (P2-05 · FR-034/FR-041)  ·  full-stack-integrator
 * PURE helpers for the Unlock membership rail, kept out of the component so the offer
 * decision and the checkout config are unit-testable. FR-034: Unlock is offered ONLY on a
 * real deployed lock — otherwise the surface hides and the visitor gets the book-a-call
 * floor (never a broken/half-wired paywall). FR-041: the checkout runs through
 * `window.unlockProtocol`, loaded from the Unlock paywall script on demand.
 */

// The official Unlock paywall app — CSP already allows this host (script-src + frame-src).
export const UNLOCK_SCRIPT_SRC = 'https://paywall.unlock-protocol.com/static/unlock.latest.min.js'

/**
 * Offer Unlock only when the feature is enabled AND a real lock exists for this offer
 * (FR-034). `lock` is the already-validated lock from `unlockLockFor(key)` (null if not
 * provisioned), so "offerable" collapses to "flag on and a lock is present".
 */
export function unlockOfferable({ enabled, lock } = {}) {
  return Boolean(enabled && lock && lock.address)
}

/**
 * Build the config object handed to `window.unlockProtocol.loadCheckoutModal`. `pessimistic`
 * waits for the purchase tx to actually confirm before granting access — honest over
 * optimistic for a paid gate. The price/terms live in the on-chain lock, never invented here.
 */
export function unlockCheckoutConfig(lock, { title = 'Unlock membership', icon } = {}) {
  if (!lock || !lock.address) throw new Error('unlockCheckoutConfig requires a real lock')
  return {
    locks: { [lock.address]: { network: lock.network ?? lock.chainId } },
    pessimistic: true,
    title,
    ...(icon ? { icon } : {}),
  }
}

/**
 * Interpret an Unlock paywall state event (`window` dispatches `unlockProtocol` with
 * detail 'locked' | 'unlocked'). Returns true only for a confirmed unlock.
 */
export function isUnlockedEvent(detail) {
  return detail === 'unlocked'
}
