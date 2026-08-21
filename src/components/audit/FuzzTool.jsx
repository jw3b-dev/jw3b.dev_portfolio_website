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
import { buildFuzzHarness, splitHarness } from '../../lib/fuzzHarness.js'
import { SAMPLE_CONTRACT } from '../../lib/auditHeuristics.js'

const ACTION =
  'rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-muted motion-safe:transition-colors hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

export default function FuzzTool() {
  const [source, setSource] = useState(SAMPLE_CONTRACT)
  const harness = useMemo(() => buildFuzzHarness(source), [source])
  // buildFuzzHarness returns MARKDOWN (the Worker's /fuzz route streams it to a markdown
  // renderer). Rendering that raw in a <pre> showed the literal ``` fences as text and gave the
  // visitor no way to use the result — a code generator whose output you cannot copy or save.
  const { prose, code, filename } = useMemo(() => splitHarness(harness), [harness])
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false) // clipboard denied (permissions/insecure context) — the text is selectable
    }
  }

  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

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

      {prose && <p className="mt-4 text-xs text-content-secondary">{prose}</p>}

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          {filename} · regenerates as you type
        </p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={copy} className={ACTION}>
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" onClick={download} className={ACTION}>
            Download
          </button>
        </div>
      </div>
      <pre className="mt-1 max-h-96 overflow-auto rounded-md border border-hairline bg-void p-3 font-mono text-[11px] text-content-secondary">
        <code>{code}</code>
      </pre>
      <p className="mt-3 text-xs text-content-muted">
        Save it as <span className="font-mono text-content-secondary">test/{filename}</span> in a
        Foundry project and run <span className="font-mono text-content-secondary">forge test</span>.
        It is a starting scaffold — fill in the invariant assertions. A scaffold is not a proof of
        correctness.
      </p>
    </section>
  )
}
