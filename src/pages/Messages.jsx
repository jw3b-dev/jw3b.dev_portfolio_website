// /messages — E2E encrypted messaging over XMTP (@xmtp/browser-sdk, MLS). The migration
// lands in P3-01; until then the `xmtp` flag stays OFF and the route wears the honest
// gate (P1-21) rather than a bare placeholder.
import { isEnabled } from '../config/features.js'
import RouteGate from '../components/layout/RouteGate.jsx'

export default function Messages() {
  if (!isEnabled('xmtp')) {
    return (
      <RouteGate
        seoTitle="Encrypted Messages"
        seoDescription="End-to-end encrypted messaging with John Wellard (JW3B / AgileGypsy) over XMTP."
        kicker="Encrypted messaging"
        title="Wallet-to-wallet messaging is on the way."
        reason="End-to-end encrypted messaging over XMTP — no email, no middleman, your wallet is the identity. Until it's live, the fastest way to reach John is to book a call."
      />
    )
  }
  // XMTP messaging UI mounts here when P3-01 lands and the flag flips on.
  return null
}
