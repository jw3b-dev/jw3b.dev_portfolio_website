/*
 * jw3b.dev v2 — KTHULHU flagship launch card (P2-10 · ADR-08)  ·  frontend-engineer
 * KTHULHU is a live security product that HARD-REFUSES framing — kthulhu.co serves
 * `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` (verified live 2026-08-16), which
 * is the correct anti-clickjacking posture for a security tool. No CSP change on our side can
 * override a remote's frame-ancestors, so an <iframe> would ALWAYS fail — a permanent spinner
 * → fallback that reads as "the product is down". Instead this is a LINKED launch card (like
 * Kointel) with the recorded walkthrough shown inline as an honest preview and a prominent
 * "Open KTHULHU ↗" CTA to the real product. Semantic tokens only.
 */
import { RECORDED_RUNS } from '../../data/recorded-runs/index.js'

// The live product host. Framing is refused by the remote (see file header) → we link, not embed.
export const KTHULHU_URL = 'https://kthulhu.co'

// The recorded walkthrough (Tier-2, seeded P2-18) — single-sourced from the bundled runs so the
// preview copy can't drift from the fallback fixture. Shown as an inline preview, not a failure.
const WALKTHROUGH = RECORDED_RUNS['kthulhu-intro']

export default function KthulhuEmbed({ url = KTHULHU_URL }) {
  const frames = WALKTHROUGH?.frames ?? []
  return (
    <section aria-labelledby="kthulhu-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · live product</p>
          <h3 id="kthulhu-title" className="mt-1 font-display text-lg font-semibold text-content-primary">KTHULHU</h3>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open KTHULHU ↗
        </a>
      </div>

      <p className="text-sm text-content-secondary">
        An autonomous smart-contract auditor: it runs a multi-agent audit pass over a contract and returns findings with
        reproductions. The on-site <span className="text-content-primary">/audit</span> console is a fast heuristic
        pre-screen; KTHULHU is the deeper autonomous system — live, with credit billing and a REST API + MCP.
      </p>

      {/* Recorded walkthrough preview. KTHULHU denies embedding (its own anti-clickjacking policy),
          so this is an honest recorded preview inline — the live product is one click away. */}
      <div className="mt-4 rounded-md border border-hairline bg-void/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] uppercase tracking-label text-caution">Recorded walkthrough</p>
          {WALKTHROUGH?.capturedAt && (
            <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">{WALKTHROUGH.capturedAt}</p>
          )}
        </div>
        <div className="space-y-2">
          {frames.map((f, i) => (
            <p key={i} className="whitespace-pre-line text-sm text-content-secondary">
              {f.response}
            </p>
          ))}
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open the live KTHULHU ↗
        </a>
      </div>
    </section>
  )
}
