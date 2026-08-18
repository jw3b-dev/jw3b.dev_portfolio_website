/*
 * jw3b.dev v2 — CheckoutStateMachine (P2-07 · FR-031/FR-032/FR-035 · OBJ-01)  ·  app-ui-engineer
 * The terminal-action orchestrator for /hire-me. It routes by ticket size (P2-06
 * routeForTicket) to exactly one rail — on-chain escrow, Unlock membership, or the
 * book-a-call floor — and renders it. Every rail owns its own full product-state set
 * (connect / wrong-chain / loading / pending / success / error) and each degrades to
 * <BookACall> on any failure or unprovisioned step; the router itself defaults to
 * book_a_call. So every path terminates in a visible confirmation (Captured) and there are
 * ZERO dead-ends (OBJ-01/SC-1). The in-flow wallet connect (FR-031) lives inside the
 * wallet rails' disconnected state — never on the book-a-call floor, which needs no wallet.
 */
import { isEnabled } from '../../config/features.js'
import { escrowProvisioned, unlockProvisioned } from '../../config/contracts.js'
import { routeForTicket } from '../../lib/checkoutRouting.js'
import EscrowCheckout from './EscrowCheckout.jsx'
import UnlockPaywall from '../pricing/UnlockPaywall.jsx'
import BookACall from './BookACall.jsx'
import CheckoutTerms from '../compliance/CheckoutTerms.jsx'

export default function CheckoutStateMachine({ selection, loadout, onBack = () => {} }) {
  const route = routeForTicket({
    engagement: selection?.engagement,
    escrow: { enabled: isEnabled('escrow'), provisioned: escrowProvisioned() },
    unlock: { enabled: isEnabled('unlock'), available: unlockProvisioned() },
  })

  // FR-059 (P3-04): every PAID rail sits behind the terms gate — structurally unreachable
  // without acceptance. The free book-a-call floor is untouched (no purchase, no friction).
  if (route.primary === 'escrow') {
    return (
      <CheckoutTerms onBack={onBack}>
        <EscrowCheckout selection={selection} loadout={loadout} onBack={onBack} />
      </CheckoutTerms>
    )
  }
  if (route.primary === 'unlock') {
    return (
      <CheckoutTerms onBack={onBack}>
        <UnlockPaywall
          lockKey={selection?.tier?.id ?? loadout?.tier?.id}
          title={loadout?.tier?.name}
          selection={selection}
          loadout={loadout}
          onBack={onBack}
        />
      </CheckoutTerms>
    )
  }
  // The guaranteed floor — always completes, no wallet required (BR-11).
  return <BookACall selection={selection} loadout={loadout} onBack={onBack} />
}
