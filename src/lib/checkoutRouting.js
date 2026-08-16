/*
 * jw3b.dev v2 — Ticket-size checkout routing (P2-06 · FR-032 · BR-05)  ·  domain-engine
 * PURE decision: given an engagement + (optional) price and the live availability of each
 * rail, pick the terminal action. FR-032: high-ticket retainer/project → on-chain escrow;
 * low-ticket fixed-price → Unlock membership; and **book-a-call is available on EVERY
 * branch** — it is the guaranteed floor (BR-11), returned as `primary` whenever the preferred
 * rail is flagged off or unprovisioned, and always offered alongside via `offerBookACall`.
 * No price is invented here; the amount comes from retainer.json / the on-chain lock (BR-12).
 */

// Low/high ticket boundary in USDC 6-decimal base units — tunable in one place (a business
// rule, not inline magic). 2,000 USDC: below is a fixed-price offer, at/above is a retainer-
// grade engagement. Only used when a provisioned price is available to classify by.
export const TICKET_THRESHOLD_UNITS = 2_000_000000n

/** Classify a ticket by its price in base units. `unknown` when no provisioned price exists. */
export function ticketSize(priceUnits) {
  if (priceUnits == null || priceUnits <= 0n) return 'unknown'
  return priceUnits >= TICKET_THRESHOLD_UNITS ? 'high' : 'low'
}

// The rail a ticket WANTS, before availability gating. Engagement type is the primary signal
// (retainer/project are the escrow-grade engagements, FR-032); a fixed-price/membership offer
// — or an explicitly low-ticket price — is the Unlock branch.
function preferredRail({ engagement, size }) {
  if (engagement === 'retainer' || engagement === 'project' || size === 'high') return 'escrow'
  if (size === 'low' || engagement === 'fixed' || engagement === 'membership') return 'unlock'
  return 'book_a_call'
}

/**
 * Route the terminal action.
 * @returns {{primary: 'escrow'|'unlock'|'book_a_call', offerBookACall: true, size: string, reason: string}}
 *   `primary` is the rail to lead with; `offerBookACall` is always true (the floor is on every
 *   branch); `reason` explains the choice (audit trail).
 */
export function routeForTicket({
  engagement,
  priceUnits = null,
  escrow = { enabled: false, provisioned: false },
  unlock = { enabled: false, available: false },
} = {}) {
  const size = ticketSize(priceUnits)
  const want = preferredRail({ engagement, size })

  if (want === 'escrow' && escrow.enabled && escrow.provisioned) {
    return result('escrow', size, 'high-ticket → on-chain escrow')
  }
  if (want === 'unlock' && unlock.enabled && unlock.available) {
    return result('unlock', size, 'low-ticket → Unlock membership')
  }
  // Every other path lands on the guaranteed floor — never a dead-end (SC-1/BR-11).
  const reason =
    want === 'book_a_call'
      ? 'no ticket signal → book-a-call floor'
      : `${want} not live yet → book-a-call floor`
  return result('book_a_call', size, reason)
}

function result(primary, size, reason) {
  return { primary, offerBookACall: true, size, reason }
}
