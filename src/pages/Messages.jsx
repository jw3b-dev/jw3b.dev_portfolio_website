// /messages — E2E encrypted messaging over XMTP (@xmtp/browser-sdk, MLS). P3-01 · FR-039.
// Live behind the `xmtp` flag AND a provisioned recipient (config/worker.js); with either missing
// the route wears the honest RouteGate floor (book-a-call) rather than a dead placeholder (SC-2).
// FR-039: the "E2E encrypted channel" claim only appears alongside the working feature — so the
// floor copy never asserts a live channel; XmtpChannel (mounted only when live) is its own proof.
import { isEnabled } from '../config/features.js'
import { XMTP_RECIPIENT } from '../config/worker.js'
import { isEthAddress } from '../lib/xmtpFlow.js'
import RouteGate from '../components/layout/RouteGate.jsx'
import XmtpChannel from '../components/messages/XmtpChannel.jsx'

export default function Messages() {
  const live = isEnabled('xmtp') && isEthAddress(XMTP_RECIPIENT)
  if (!live) {
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
  return <XmtpChannel />
}
