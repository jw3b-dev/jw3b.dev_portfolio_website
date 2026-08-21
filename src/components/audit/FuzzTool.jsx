/*
 * jw3b.dev v2 — FuzzTool (P2-15 · FR-009)  ·  audit-heuristics-engineer / frontend
 * Edit Solidity → the Foundry fuzz-harness skeleton updates as you type, generated CLIENT-SIDE
 * by the same deterministic generator the Worker uses (fuzzHarness.js), so it's real and
 * offline-safe before any network call. Honestly framed as a scaffold, not a proof. Semantic
 * tokens only.
 *
 * The harness is DERIVED from the source. It used to be generated into state by a "Generate
 * harness" button, so editing the contract left the harness below describing the previous one —
 * a scaffold for a function you'd just renamed. The generator is pure, deterministic and needs
 * no network, so there is nothing for a button to trigger: the output simply follows the input.
 */
import { useMemo, useState } from 'react'
import { buildFuzzHarness } from '../../lib/fuzzHarness.js'
import { SAMPLE_CONTRACT } from '../../lib/auditHeuristics.js'

export default function FuzzTool() {
  const [source, setSource] = useState(SAMPLE_CONTRACT)
  const harness = useMemo(() => buildFuzzHarness(source), [source])

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

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted">Harness</p>
        <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          Regenerates as you type
        </p>
      </div>
      <pre className="mt-1 max-h-96 overflow-auto rounded-md border border-hairline bg-void p-3 font-mono text-[11px] text-content-secondary">
        {harness}
      </pre>
      <p className="mt-3 text-xs text-content-muted">
        A starting scaffold — fill in the invariant assertions. It is a heuristic harness, not a proof of correctness.
      </p>
    </section>
  )
}
