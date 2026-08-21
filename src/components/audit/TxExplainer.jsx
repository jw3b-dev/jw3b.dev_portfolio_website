/*
 * jw3b.dev v2 — TxExplainer (P2-16 · FR-010)  ·  full-stack-integrator
 * Paste a Base tx hash → the deterministic client-side decode shows first (offline-safe),
 * then a plain-language narrative streams from the Worker. If the Worker is down the decode
 * still stands. Screen + wiring; the decode + stream live in txDecode.js / useTxExplain.
 * Semantic tokens only.
 */
import { useState } from 'react'
import { useTxExplain } from '../../hooks/useTxExplain.js'

/*
 * Real Base mainnet transactions, verified against the public RPC on 2026-08-21 (block
 * ~50,262,660). The tool used to be a bare hash field with an "Explain" button and nothing else:
 * untriable, because a visitor does not carry a Base transaction hash around, and unexplained,
 * because nothing said what came back. On-chain history is permanent, so these keep working.
 *
 * Three shapes, chosen so the decoder shows three different things: a token transfer with a
 * recognisable selector, a plain ETH transfer with no calldata at all, and an opaque contract
 * call whose selector is NOT in the known-signature table — the last one matters, because it is
 * where the tool has to admit what it cannot name.
 */
const EXAMPLES = [
  {
    label: 'ERC-20 transfer',
    hash: '0xbbb2aea5eef287811684917daba1e2c71b8ee647168d0a1c1dd2a1be028312f4',
    hint: 'transfer(address,uint256) — a decoded, named function call',
  },
  {
    label: 'No calldata',
    hash: '0x15b7622b3a40f85d2303790e630fed6425a4c0d0e0906b42c789b2b223141356',
    hint: 'no calldata at all — value moves, nothing is called',
  },
  {
    label: 'Unknown contract call',
    hash: '0x37f28958983145ab7a0b43b80e89c2394eab58054baf0484b593a89527c72840',
    hint: 'a selector the signature table does not know — the honest limit',
  },
]

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

      <p className="mt-2 text-sm text-content-secondary">
        Paste a <span className="text-content-primary">Base mainnet</span> transaction hash. It is
        decoded in your browser from the public RPC — the sender, recipient, value and, where the
        selector is known, the function being called — then a model narrates what it does. The
        decode stands on its own even if the narrative is unavailable.
      </p>

      <div className="mt-3">
        <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          Or try a real one
        </p>
        <div className="mt-1 flex flex-wrap gap-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.hash}
              type="button"
              title={ex.hint}
              onClick={() => {
                setHash(ex.hash)
                explain(ex.hash)
              }}
              disabled={running}
              className="rounded-md border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-muted motion-safe:transition-colors hover:text-content-primary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <label htmlFor="tx-hash" className="mt-4 block text-sm font-medium text-content-secondary">
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
