/*
 * jw3b.dev v2 — Four-flagship showcase (P2-13 · FR-004)  ·  frontend-engineer
 * Presents EXACTLY FOUR flagships, each operable (with its own fallback):
 *   1. KTHULHU — live product (sandboxed embed → recorded walkthrough).  [P2-10]
 *   2. The on-site AI — concierge + /audit + CTF as ONE self-demonstrating system. The
 *      operable /audit console is embedded here; the concierge is the always-present floating
 *      widget; the CTF is one click away.  [P1-07 + P1-08 + P2-09]
 *   3. Overmind — the steppable validated pipeline.  [P2-11]
 *   4. Kointel — compliance-first live product.  [P2-12]
 * The delivery record (P1-14) is deliberately NOT a flagship — it stays a separate anchor.
 * Semantic tokens only.
 */
import { Link } from 'react-router-dom'
import KthulhuEmbed from './KthulhuEmbed.jsx'
import OvermindGraph from './OvermindGraph.jsx'
import Kointel from './Kointel.jsx'
import AuditConsole from '../audit/AuditConsole.jsx'

// The on-site AI flagship: one system that demonstrates itself. The audit console is the
// operable centerpiece; the concierge + CTF complete the trio.
function OnSiteAiFlagship() {
  return (
    <section aria-labelledby="ai-flagship-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-3">
        <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · the on-site AI</p>
        <h3 id="ai-flagship-title" className="mt-1 font-display text-lg font-semibold text-content-primary">
          One AI system, demonstrating itself
        </h3>
        <p className="mt-2 text-sm text-content-secondary">
          The concierge (bottom-right), this live <Link to="/audit" className="text-cyan underline">/audit</Link> console,
          and the on-chain <Link to="/ctf" className="text-cyan underline">CTF</Link> are one system — paste a contract
          below and it screens it in your browser, offline-safe.
        </p>
      </div>
      <AuditConsole />
    </section>
  )
}

export default function FlagshipShowcase() {
  return (
    <section aria-labelledby="flagships-title" className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">The proof set</p>
      <h1 id="flagships-title" className="mt-2 font-display text-2xl font-semibold text-content-primary">
        Four flagships — operable, not slideware
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <KthulhuEmbed />
        <OnSiteAiFlagship />
        <OvermindGraph />
        <Kointel />
      </div>
    </section>
  )
}
