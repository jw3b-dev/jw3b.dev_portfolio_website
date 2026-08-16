// /ctf — live on-chain Capture-the-Vault (flagship). The console lands in P2-09; until
// the CTF vault address is provisioned the `ctf` flag stays OFF and the route wears the
// honest gate (P1-21) rather than a bare placeholder.
import { isEnabled } from '../config/features.js'
import RouteGate from '../components/layout/RouteGate.jsx'
import CtfChallenge from '../components/ctf/CtfChallenge.jsx'

export default function Ctf() {
  if (!isEnabled('ctf')) {
    return (
      <RouteGate
        seoTitle="Capture the Vault — Live On-Chain CTF"
        seoDescription="A live on-chain capture-the-flag from John Wellard (JW3B / AgileGypsy): break a deployed vault, prove the exploit on-chain."
        kicker="Capture the Vault"
        title="The on-chain CTF is being wired up."
        reason="A deployed vault to break, an on-chain proof of the exploit, and a live leaderboard — going live once the contract is provisioned. Want a walkthrough of how it works before then? Book a call."
      />
    )
  }
  // Live CTF console (P2-09) — mounts when the `ctf` flag is on.
  return <CtfChallenge />
}
