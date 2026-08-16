// Placeholder route (P0-01 scaffold). XMTP E2E messaging (@xmtp/browser-sdk, MLS)
// lands in P3-01, behind a feature flag.
import Seo from '../components/seo/Seo.jsx'

export default function Messages() {
  return (
    <section aria-labelledby="messages-title">
      <Seo
        title="Encrypted Messages"
        description="End-to-end encrypted messaging with John Wellard (JW3B / AgileGypsy) over XMTP."
      />
      <h1 id="messages-title">Messages</h1>
      <p>Encrypted messaging — placeholder route.</p>
    </section>
  )
}
