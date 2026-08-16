/*
 * jw3b.dev v2 — Kointel flagship (P2-12)  ·  frontend-engineer
 * The fourth flagship: a live external product (kointel.co.za) built compliance-first — an
 * EU AI Act dossier and a compliance CI gate — so it sits on the Auditor (compliance) and
 * Founder (live product) hats. This is a LINKED surface (opens the real product in a new tab),
 * not an embed. No stat is shown unless it clears the evidence register (there is no cleared
 * Kointel metric yet, so none renders — proof, not promises). Semantic tokens only.
 */
import { HATS } from '../../constants/index.js'

export const KOINTEL_URL = 'https://kointel.co.za'

// The two hats Kointel speaks to — pulled from the canonical HATS source (no re-styling).
const DIMENSIONS = HATS.filter((h) => h.key === 'auditor' || h.key === 'founder')

export default function Kointel() {
  return (
    <section aria-labelledby="kointel-title" className="rounded-lg border border-hairline bg-panel p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Flagship · live product</p>
          <h3 id="kointel-title" className="mt-1 font-display text-lg font-semibold text-content-primary">Kointel</h3>
        </div>
        <a
          href={KOINTEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[11px] uppercase tracking-label text-cyan hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open Kointel ↗
        </a>
      </div>

      <p className="text-sm text-content-secondary">
        A compliance-first agentic product — built with an EU AI Act dossier and a compliance gate in CI, so the
        governance is engineered in, not bolted on.
      </p>

      <ul className="mt-4 flex flex-wrap gap-2" aria-label="Dimensions">
        {DIMENSIONS.map((h) => (
          <li key={h.key} className="inline-flex items-center gap-1.5 rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-secondary">
            <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} aria-hidden="true" />
            {h.label}
          </li>
        ))}
      </ul>
    </section>
  )
}
