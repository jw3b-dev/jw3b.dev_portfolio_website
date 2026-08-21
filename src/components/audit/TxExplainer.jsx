/*
 * jw3b.dev v2 — TxExplainer (P2-16 · FR-010)  ·  full-stack-integrator
 * Paste a Base tx hash → the deterministic client-side decode shows first (offline-safe),
 * then a plain-language narrative streams from the Worker. If the Worker is down the decode
 * still stands. Screen + wiring; the decode + stream live in txDecode.js / useTxExplain.
 * Semantic tokens only.
 */
import { useState } from 'react'
import { useTxExplain } from '../../hooks/useTxExplain.js'

export default function TxExplainer() {
  const [hash, setHash] = useState('')
  const { decoded, narrative, explainedHash, running, error, explain } = useTxExplain()

  // Unlike the Solidity tools, a hash can't be screened live — it takes an RPC round-trip and a
  // half-typed hash means nothing. So the results stay button-driven, and instead we say plainly
  // when they stop belonging to what's in the box.
  const stale = Boolean(explainedHash) && explainedHash !== hash

  return (
    <section aria-labelledby="tx-title" className="rounded-lg border border-hairline bg-panel p-5">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Tool · explain a transaction</p>
      <h3 id="tx-title" className="mt-1 font-display text-lg font-semibold text-content-primary">
        Decode &amp; explain a Base transaction
      </h3>

      <label htmlFor="tx-hash" className="mt-3 block text-sm font-medium text-content-secondary">
        Transaction hash
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="tx-hash"
          value={hash}
          onChange={(e) => setHash(e.target.value.trim())}
          placeholder="0x…"
          spellCheck={false}
          className="flex-1 rounded-md border border-hairline bg-void px-3 py-2 font-mono text-xs text-content-primary placeholder:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />
        <button
          type="button"
          onClick={() => explain(hash)}
          disabled={running}
          className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          {running ? 'Explaining…' : 'Explain'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-failed">{error}</p>}

      {stale && (decoded || narrative) && (
        <p className="mt-3 rounded-md border border-caution/40 bg-caution/5 p-2 text-xs text-caution">
          The hash has changed since this ran — the results below describe{' '}
          <span className="font-mono">{explainedHash.slice(0, 10)}…</span>. Press Explain to update them.
        </p>
      )}

      {decoded && (
        <div className="mt-4 rounded-md border border-hairline bg-void p-3">
          <p className="font-mono text-[11px] uppercase tracking-label text-content-muted">Decoded (client-side)</p>
          <p className="mt-1 text-sm text-content-secondary">{decoded.summary}</p>
          {decoded.functionName && (
            <p className="mt-1 font-mono text-[11px] text-content-muted">
              {decoded.selector} · {decoded.functionName}
            </p>
          )}
        </div>
      )}

      {narrative && (
        <div className="mt-3 rounded-md border border-cyan/20 bg-void/60 p-3">
          <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Explanation</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-content-secondary">{narrative}</p>
        </div>
      )}
    </section>
  )
}
