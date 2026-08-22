/*
 * jw3b.dev v2 — the thesis performing its own argument (W4 · PRODUCT_AUDIT #22)
 *
 * The page says: "Flat search asks 'what looks similar?' A graph asks 'what is this connected
 * to?' … the surfaces here are consoles, not slideshows — the work is traversing it in front of
 * you." It then made that case entirely in prose and ended in a link.
 *
 * This is the traversal, on the graph the site's own credibility rests on: every claim jw3b.dev
 * renders is attached to the source that attests it, and walking a source shows you everything
 * else resting on the same evidence. That is the honest demonstration — not a toy graph invented
 * to look impressive, but the one that governs the page you are reading.
 *
 * Deliberately DOM/SVG-free: the approved direction is anti-spectacle, and a force-directed blob
 * would be decoration. Traversal is the point, so the interface is the walk itself.
 */
import { useMemo, useState } from 'react'
import { buildClaimGraph, neighbours, graphStats, NODE_KIND } from '../../lib/claimGraph.js'

/** A pointer is only a receipt if it is a URL — mirrors claimsRegister.evidenceKind. */
const isUrl = (p) => typeof p === 'string' && /^https?:\/\//i.test(p.trim())

const NODE_BTN =
  'w-full rounded-md border border-hairline px-3 py-2 text-left motion-safe:transition-colors hover:border-cyan/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

export default function ClaimGraphWalk() {
  const graph = useMemo(() => buildClaimGraph(), [])
  const stats = useMemo(() => graphStats(graph), [graph])
  const claims = useMemo(
    () => [...graph.nodes.values()].filter((n) => n.kind === NODE_KIND.CLAIM),
    [graph],
  )

  const [currentId, setCurrentId] = useState(claims[0]?.id ?? null)
  // The path you walked, so the traversal is visible rather than just its destination.
  const [trail, setTrail] = useState(() => (claims[0] ? [claims[0].id] : []))

  const current = currentId ? graph.nodes.get(currentId) : null
  const edges = useMemo(() => (currentId ? neighbours(graph, currentId) : []), [graph, currentId])

  const walkTo = (id) => {
    setCurrentId(id)
    setTrail((t) => (t[t.length - 1] === id ? t : [...t, id]))
  }

  if (!current) return null

  return (
    <section aria-labelledby="graph-walk" className="mt-6 rounded-lg border border-hairline bg-panel p-4">
      <h2 id="graph-walk" className="font-mono text-[11px] uppercase tracking-label text-content-muted">
        Walk it yourself
      </h2>
      <p className="mt-2 text-sm text-content-secondary">
        This is jw3b.dev&rsquo;s own evidence graph: {stats.claims} cleared claims across{' '}
        {stats.sources} sources. Every number this site renders is a node here, attached to what
        attests it. Follow an edge and you are doing the thing the argument above describes.
      </p>

      {/* Where you are. A claim shows its value and where to check it. */}
      <div className="mt-4 rounded-md border border-cyan/30 bg-void p-3">
        <p className="font-mono text-[10px] uppercase tracking-label text-cyan">
          {current.kind === NODE_KIND.CLAIM ? 'Claim' : 'Source'}
        </p>
        <p className="mt-1 text-sm font-semibold text-content-primary">
          {current.value ? `${current.value} — ` : ''}
          {current.label}
        </p>
        {/*
            An attested pointer is PROSE, not a URL — and this rendered it into an href regardless,
            producing an anchor that navigates to a relative path built out of a sentence. It went
            unnoticed while every pointer happened to be a URL; the moment a broken receipt was
            downgraded to attestation (CLAIMS_SOURCE_SWEEP_2026-08-23), the walk started offering
            links that go nowhere. On a page arguing that evidence should be checkable, that is the
            worst possible place for a fake link. Same rule as <Claim>: only a URL gets an anchor.
        */}
        {current.evidence && isUrl(current.evidence) && (
          <a
            href={current.evidence}
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1 inline-block break-all font-mono text-[11px] text-cyan underline"
          >
            {current.evidence}
          </a>
        )}
        {current.evidence && !isUrl(current.evidence) && (
          <p className="mt-1 break-words font-mono text-[11px] text-content-muted">
            <span className="text-caution" title="attested, not independently checkable">&dagger;</span>{' '}
            {current.evidence}
          </p>
        )}
      </div>

      {/* Where you can go. */}
      <p className="mt-4 font-mono text-[10px] uppercase tracking-label text-content-muted">
        {edges.length} edge{edges.length === 1 ? '' : 's'} from here
      </p>
      <ul className="mt-1 space-y-1.5">
        {edges.map((e) => (
          <li key={`${e.direction}-${e.node.id}`}>
            <button type="button" onClick={() => walkTo(e.node.id)} className={NODE_BTN}>
              <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">{e.label} →</span>
              <span className="mt-0.5 block text-sm text-content-secondary">
                {e.node.value ? `${e.node.value} — ` : ''}
                {e.node.label}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {trail.length > 1 && (
        <p className="mt-4 border-t border-hairline pt-2 font-mono text-[10px] text-content-muted">
          path: {trail.map((id) => graph.nodes.get(id)?.label).join(' → ')}
        </p>
      )}

      {/* Jump anywhere, so the walk is not a single guided rail. */}
      <details className="mt-3">
        <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-label text-content-muted hover:text-content-secondary">
          Start from another claim
        </summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {claims.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => walkTo(c.id)} className={NODE_BTN}>
                <span className="text-xs text-content-secondary">
                  {c.value ? `${c.value} — ` : ''}
                  {c.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </details>
    </section>
  )
}
