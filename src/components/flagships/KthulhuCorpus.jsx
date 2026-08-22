/*
 * KTHULHU — the corpus, searchable and traversable ON THIS SITE  ·  app-ui-engineer
 *
 * What this fixes, and why it is not what the register said was blocking it:
 *
 *   Product-audit finding 21 — "2 of 4 operable flagships are iframes of your other sites" — was
 *   logged as owner-gated on read-only API access to KTHULHU. It was not. The Worker holds the
 *   same `AI` binding and `NEON_DATABASE_URL` the product does, and `/kb/search` + `/kb/related`
 *   have been deployed and returning real data the whole time with nothing on the site calling
 *   them. The gate was an unbuilt UI, reported as an owner decision.
 *
 *   Product-audit finding 22 — the systems-are-graphs thesis claims "the surfaces here are
 *   consoles, not slideshows … the work is traversing it in front of you", and no surface on the
 *   site traversed any graph. This one does: it retrieves by MEANING (bge-m3 at the edge, ranked
 *   by cosine distance over the corpus) and then expands by RELATIONSHIP along the edges the
 *   corpus already carries — weakness class, protocol, source. That is what GraphRAG is, running
 *   on public audit history in plain SQL.
 *
 * HONESTY (BR-03/BR-09). This corpus is published findings from OTHER people's audits and public
 * hack post-mortems — Solodit, Sherlock, DeFiHackLabs, a vulnerability database. It is not John's
 * audit record and nothing here may read as though it were, which is why every single result
 * carries its source and the panel says so before the first search. The one number this surface
 * would most like to show — how big the corpus is — is deliberately absent: the honest figure is
 * how many rows are EMBEDDED and therefore searchable, the Worker does not return it, and a row
 * count from a doc would be a claim with no evidence behind it.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { searchKb, relatedKb, edgeLabel, sourceLabel, severityTone } from '../../lib/kbClient.js'

/*
 * An empty search box is a dead end for a visitor who has no query in mind — the same thing that
 * made /audit's empty state a wall before the examples landed. These are real bug classes, chosen
 * to return results across different sources rather than to flatter the ranker.
 */
const SUGGESTIONS = Object.freeze([
  'reentrancy in withdraw',
  'oracle price manipulation',
  'unchecked return value',
])

const TONE_CLASS = Object.freeze({
  high: 'text-failed',
  medium: 'text-caution',
  low: 'text-content-muted',
  unknown: 'text-content-muted',
})

const chip =
  'rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

/** One corpus finding. `onTraverse` is absent on traversal results — one hop, then re-anchor. */
function Finding({ item, onTraverse }) {
  const tone = severityTone(item.severity)
  return (
    <li className="border-l-2 border-hairline pl-3">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className={`font-mono text-[10px] uppercase tracking-label ${TONE_CLASS[tone]}`}>
          {tone === 'unknown' ? 'Unrated' : item.severity}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          {sourceLabel(item.source)}
          {item.year ? ` · ${item.year}` : ''}
          {item.swc ? ` · ${item.swc}` : ''}
        </span>
        {typeof item.similarity === 'number' && (
          // Shown because a ranked result with no score asks to be trusted. 0.69 is a weak match
          // and a reader is entitled to see that rather than infer authority from position.
          <span className="font-mono text-[10px] uppercase tracking-label text-cyan-dim">
            match {item.similarity.toFixed(2)}
          </span>
        )}
      </div>

      <p className="mt-1 text-sm font-medium text-content-primary">{item.title}</p>
      <p className="mt-1 text-sm leading-relaxed text-content-secondary">{item.excerpt}</p>

      {onTraverse && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onTraverse(item)}
            className={`${chip} border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan`}
          >
            Traverse from here →
          </button>
        </div>
      )}
    </li>
  )
}

export default function KthulhuCorpus({ search = searchKb, related = relatedKb }) {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [found, setFound] = useState(null) // {results, degraded, reason} | null
  const [node, setNode] = useState(null) // {origin, edges, edge, results, degraded, reason} | null

  // A slow corpus query that resolves after the visitor has moved on must not overwrite what they
  // are now looking at.
  const live = useRef(true)
  useEffect(() => () => { live.current = false }, [])

  const runSearch = useCallback(
    async (q) => {
      const term = String(q ?? '').trim()
      if (term.length < 2 || busy) return
      setBusy(true)
      setNode(null)
      const res = await search(term, { limit: 6 })
      if (!live.current) return
      setFound(res)
      setBusy(false)
    },
    [busy, search],
  )

  const traverse = useCallback(
    async (item, kind) => {
      if (busy) return
      setBusy(true)
      const res = await related(item.id, { edge: kind || 'protocol', limit: 6 })
      if (!live.current) return
      // Keep the finding the visitor clicked as the anchor even when the Worker cannot return an
      // origin (an id that has since left the corpus) — losing your place is worse than an empty
      // neighbour list.
      setNode({ ...res, origin: res.origin || item })
      setBusy(false)
    },
    [busy, related],
  )

  const onSubmit = (e) => {
    e.preventDefault()
    runSearch(query)
  }

  return (
    <section aria-labelledby="kthulhu-corpus" className="mt-5 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h4 id="kthulhu-corpus" className="font-mono text-[11px] uppercase tracking-label text-cyan">
          On-site · search the corpus
        </h4>
        <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          runs here, not in the frame
        </span>
      </div>

      <p className="mt-2 text-sm text-content-secondary">
        The retrieval layer behind KTHULHU, running on this page. Your query is embedded at the
        edge and ranked against a corpus of <span className="text-content-primary">published</span>{' '}
        audit findings — Solodit, Sherlock, DeFiHackLabs and a vulnerability database. Pick any
        result and walk its edges: same weakness class, same protocol, same source.
      </p>

      <p className="mt-2 text-sm text-caution">
        These are other people&rsquo;s findings, published by their authors. None of them is
        John&rsquo;s audit work, and no client submission is reachable from this surface.
      </p>

      <form onSubmit={onSubmit} className="mt-3 flex flex-wrap gap-2">
        <label htmlFor="kb-q" className="sr-only">
          Search the public audit corpus
        </label>
        <input
          id="kb-q"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe a bug…"
          className="min-w-0 flex-1 rounded-md border border-hairline bg-void px-3 py-2 font-mono text-sm text-content-primary placeholder:text-content-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        />
        <button
          type="submit"
          disabled={busy || query.trim().length < 2}
          className={`${chip} border-cyan/50 text-cyan hover:bg-cyan/5 disabled:cursor-not-allowed disabled:border-hairline disabled:text-content-muted`}
        >
          {busy ? 'Searching…' : 'Search'}
        </button>
      </form>

      {!found && !node && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setQuery(s)
                runSearch(s)
              }}
              className={`${chip} border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" className="mt-3">
        {/* ── Traversal view ───────────────────────────────────────────────────────────────── */}
        {node && (
          <div>
            <button
              type="button"
              onClick={() => setNode(null)}
              className={`${chip} border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan`}
            >
              ← Back to results
            </button>

            <p className="mt-3 font-mono text-[10px] uppercase tracking-label text-content-muted">Traversing from</p>
            <p className="text-sm font-medium text-content-primary">{node.origin?.title}</p>

            {node.edges?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {node.edges.map((e) => {
                  const on = node.edge?.kind === e.kind
                  return (
                    <button
                      key={e.kind}
                      type="button"
                      onClick={() => traverse(node.origin, e.kind)}
                      aria-pressed={on}
                      className={`${chip} ${on ? 'border-cyan/50 bg-cyan/5 text-cyan' : 'border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan'}`}
                    >
                      {edgeLabel(e.kind)} · {e.label || e.value}
                    </button>
                  )
                })}
              </div>
            )}

            {node.results?.length > 0 ? (
              <ol className="mt-3 flex flex-col gap-4">
                {node.results.map((r) => (
                  <Finding key={r.id} item={r} />
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm text-content-secondary">
                {/* An unlinked finding is a REAL answer about the data, not a failure of the tool.
                    Most corpus rows carry no SWC id; saying so is more useful than an empty box. */}
                {node.degraded
                  ? node.reason || 'the knowledge base is unreachable right now'
                  : `No neighbours along this edge — ${node.reason || 'this finding is unlinked here'}. Not every published finding carries a weakness class or a named protocol.`}
              </p>
            )}
          </div>
        )}

        {/* ── Search results ───────────────────────────────────────────────────────────────── */}
        {!node && found && (
          <div>
            {found.results.length > 0 ? (
              <>
                <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
                  {found.results.length} ranked by meaning{found.cached ? ' · cached' : ''}
                </p>
                <ol className="mt-2 flex flex-col gap-4">
                  {found.results.map((r) => (
                    <Finding key={r.id} item={r} onTraverse={(item) => traverse(item)} />
                  ))}
                </ol>
              </>
            ) : (
              <p className="text-sm text-content-secondary">
                {found.degraded
                  ? found.reason || 'the knowledge base is unreachable right now'
                  : 'Nothing matched that closely enough to show.'}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
