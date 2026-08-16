/*
 * jw3b.dev v2 — FuzzTool (P2-15 · FR-009)  ·  audit-heuristics-engineer / frontend
 * Paste Solidity → an instant Foundry fuzz-harness skeleton, generated CLIENT-SIDE by the
 * same deterministic generator the Worker uses (fuzzHarness.js), so it's real and offline-safe
 * before any network call. Honestly framed as a scaffold, not a proof. Semantic tokens only.
 */
import { useState } from 'react'
import { buildFuzzHarness } from '../../lib/fuzzHarness.js'
import { SAMPLE_CONTRACT } from '../../lib/auditHeuristics.js'

export default function FuzzTool() {
  const [source, setSource] = useState(SAMPLE_CONTRACT)
  const [harness, setHarness] = useState('')

  const generate = () => setHarness(buildFuzzHarness(source))

  return (
    <section aria-labelledby="fuzz-title" className="rounded-lg border border-hairline bg-panel p-5">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Tool · fuzz harness</p>
      <h3 id="fuzz-title" className="mt-1 font-display text-lg font-semibold text-content-primary">
        Generate a Foundry fuzz harness
      </h3>

      <label htmlFor="fuzz-src" className="mt-3 block text-sm font-medium text-content-secondary">
        Solidity source
      </label>
      <textarea
        id="fuzz-src"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        rows={8}
        className="mt-1 w-full rounded-md border border-hairline bg-void px-3 py-2 font-mono text-xs text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      />

      <button
        type="button"
        onClick={generate}
        className="mt-3 rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        Generate harness
      </button>

      {harness && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-md border border-hairline bg-void p-3 font-mono text-[11px] text-content-secondary">
          {harness}
        </pre>
      )}
      <p className="mt-3 text-xs text-content-muted">
        A starting scaffold — fill in the invariant assertions. It is a heuristic harness, not a proof of correctness.
      </p>
    </section>
  )
}
