/*
 * jw3b.dev v2 — metered-tool policy (P5-05) · app-ui-engineer
 *
 * The console's AI analysis is metered: ten per session, mirrored from the Worker's
 * `BUDGETS.audit`. That limit already exists and works. What did not exist is the answer to
 * *"and then what?"* — a visitor who spends their tenth run currently just stops being able to
 * run, which is a wall rather than a product.
 *
 * This module is the pure decision layer for that moment. It answers three questions and nothing
 * else: may this run proceed, how much is left, and what should be OFFERED when it is gone.
 *
 * ── WHY THE UPGRADE OFFER IS THE HARD PART ────────────────────────────────────────────────────
 * The paid rails are not provisioned: `unlock` needs real lock addresses and `escrow` is deployed
 * on Base Sepolia only (`src/config/features.js`). BR-09 and the whole rerun forbid lighting a
 * paid path against a testnet contract, and finding 26 is open precisely because no path for
 * money to move exists yet.
 *
 * So the policy's default answer is **do not offer an upgrade** — and it carries the reason, so
 * the UI can say something true instead of rendering a disabled button. A dead affordance is the
 * shape this rerun exists to remove; an honest floor is not.
 *
 * ── WHAT THIS DOES NOT DO ─────────────────────────────────────────────────────────────────────
 * It does not duplicate `autoRunPolicy`. That module decides whether an AUTOMATIC re-run may fire
 * (and deliberately reserves headroom so a manual click is never pre-empted). This one decides
 * what a HUMAN pressing the button is entitled to, and what to say when they are not. They share
 * the budget constant and nothing else — `AUDIT_BUDGET` is imported, never restated.
 */
import { AUDIT_BUDGET } from './autoRunPolicy.js'

/** The tiers. `free` is what every visitor has; `unlocked` is what a provisioned rail would grant. */
export const TIERS = Object.freeze({
  free: Object.freeze({ id: 'free', label: 'Free', limit: AUDIT_BUDGET }),
  unlocked: Object.freeze({ id: 'unlocked', label: 'Unlocked', limit: Infinity }),
})

/** Why an upgrade is not being offered. Reasons are shown to visitors, so they read as prose. */
export const UPGRADE_REASON = Object.freeze({
  NOT_NEEDED: 'not_needed',
  UNPROVISIONED: 'unprovisioned',
  ALREADY: 'already_unlocked',
})

const REASON_TEXT = Object.freeze({
  [UPGRADE_REASON.NOT_NEEDED]: 'Runs remaining — nothing to unlock yet.',
  [UPGRADE_REASON.UNPROVISIONED]:
    'Paid access is not live yet, so there is nothing to buy. The instant screen stays free and unlimited, and a call is always available.',
  [UPGRADE_REASON.ALREADY]: 'Already unlocked.',
})

export function upgradeReasonText(reason) {
  return REASON_TEXT[reason] || REASON_TEXT[UPGRADE_REASON.UNPROVISIONED]
}

/** The limit for a tier, defaulting to free for anything unrecognised (fail closed, not open). */
export function limitFor(tierId) {
  const t = TIERS[tierId]
  return t ? t.limit : TIERS.free.limit
}

/**
 * The whole decision, as one pure function.
 *
 * @param {object} o
 * @param {'free'|'unlocked'} [o.tier]      the visitor's tier
 * @param {number} [o.used]                 AI analyses already spent this session
 * @param {{enabled:boolean, available:boolean}} [o.unlock]  Unlock rail state
 * @param {{enabled:boolean, provisioned:boolean}} [o.escrow] escrow rail state
 * @returns {{
 *   allowed: boolean, limit: number, used: number, remaining: number, exhausted: boolean,
 *   tier: string, upgrade: {offered: boolean, rail: 'unlock'|'escrow'|null, reason: string, text: string},
 *   floor: 'book_a_call'
 * }}
 */
export function meteringState({
  tier = 'free',
  used = 0,
  unlock = { enabled: false, available: false },
  escrow = { enabled: false, provisioned: false },
} = {}) {
  const tierId = TIERS[tier] ? tier : 'free'
  const limit = limitFor(tierId)
  const spent = Math.max(0, Math.floor(Number(used) || 0))
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - spent)
  const exhausted = remaining === 0

  // A rail is offerable only when it is BOTH switched on and actually provisioned. The two are
  // separate on purpose: escrow's flag can be on in a preview build while the contract behind it
  // is still testnet-only, and that combination must not sell anything.
  const unlockReady = Boolean(unlock && unlock.enabled && unlock.available)
  const escrowReady = Boolean(escrow && escrow.enabled && escrow.provisioned)
  const rail = unlockReady ? 'unlock' : escrowReady ? 'escrow' : null

  let reason
  if (tierId === 'unlocked') reason = UPGRADE_REASON.ALREADY
  else if (!exhausted) reason = UPGRADE_REASON.NOT_NEEDED
  else if (!rail) reason = UPGRADE_REASON.UNPROVISIONED
  else reason = null // exhausted, free, and a real rail exists → offer it

  const offered = reason === null

  return {
    allowed: !exhausted,
    limit,
    used: spent,
    remaining,
    exhausted,
    tier: tierId,
    upgrade: {
      offered,
      rail: offered ? rail : null,
      reason: offered ? null : reason,
      text: offered ? '' : upgradeReasonText(reason),
    },
    // The floor is on every branch, always — including when an upgrade IS offered. Declining to
    // pay must never be a dead end (SC-1 / BR-11).
    floor: 'book_a_call',
  }
}

/**
 * A short, honest status line for the console header. Never claims a paid tier exists when it
 * does not, and never renders "0 remaining" as a bare number with no next step.
 */
export function meteringLabel(state) {
  if (!state) return ''
  if (state.limit === Infinity) return 'Unlocked · unlimited AI analyses'
  if (!state.exhausted) return `${state.remaining} of ${state.limit} AI analyses left this session`
  return state.upgrade.offered
    ? 'Session limit reached — unlock to continue'
    : 'Session limit reached — the instant screen stays free'
}
