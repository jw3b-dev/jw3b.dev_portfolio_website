/*
 * jw3b.dev v2 — the site's own claim graph (W4 · PRODUCT_AUDIT #22)  ·  domain-engine
 *
 * WHY. /thesis/systems-are-graphs argues: "Flat search asks 'what looks similar?' A graph asks
 * 'what is this connected to?' … the surfaces here are consoles, not slideshows — the graph is
 * the source of truth, and the work is traversing it in front of you."
 *
 * No surface on this site traversed any graph. The page made its argument in prose and ended in a
 * link, which is precisely the thing it accuses everyone else of.
 *
 * The honest fix was not to invent a graph for the demo. The site already HAS one, and it is the
 * one the whole portfolio rests on: the evidence register, where every renderable claim points at
 * a source system and a piece of checkable evidence. Walking claim → source → sibling claims is
 * the same traversal the thesis describes, performed on the data that governs the site itself.
 *
 * PURE: register in, graph out. No I/O, no framework.
 */
import register from '../data/evidence-register.json'

export const NODE_KIND = Object.freeze({ CLAIM: 'claim', SOURCE: 'source' })

const claims = () => (Array.isArray(register?.claims) ? register.claims : Array.isArray(register) ? register : [])

/** Stable id for a source node — sources are named strings in the register, not entities. */
export function sourceId(name) {
  return `source:${String(name || 'unknown').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

/**
 * Build the graph from the register.
 *
 * Only `cleared` claims become nodes: a blocked claim does not render anywhere on the site, and a
 * graph that shows what the gate rejected would leak exactly what the gate exists to suppress.
 *
 * @returns {{nodes: Map<string, object>, edges: Array<{from:string,to:string,label:string}>}}
 */
export function buildClaimGraph() {
  const nodes = new Map()
  const edges = []

  for (const c of claims()) {
    if (c.status !== 'cleared') continue

    nodes.set(c.id, {
      id: c.id,
      kind: NODE_KIND.CLAIM,
      label: c.label,
      value: c.value,
      evidence: c.evidence_pointer || null,
    })

    const sid = sourceId(c.source_system)
    if (!nodes.has(sid)) {
      nodes.set(sid, { id: sid, kind: NODE_KIND.SOURCE, label: c.source_system, value: null, evidence: null })
    }
    // The edge the thesis names: a claim is only as good as the source it is attached to.
    edges.push({ from: c.id, to: sid, label: 'attested by' })
  }

  return { nodes, edges }
}

/** Everything one hop from a node, with the edge label that got you there. */
export function neighbours(graph, id) {
  const out = []
  for (const e of graph.edges) {
    if (e.from === id && graph.nodes.has(e.to)) out.push({ node: graph.nodes.get(e.to), label: e.label, direction: 'out' })
    if (e.to === id && graph.nodes.has(e.from)) out.push({ node: graph.nodes.get(e.from), label: 'attests', direction: 'in' })
  }
  return out
}

/**
 * Shortest path between two nodes (BFS — the graph is small and unweighted).
 * Returns [] when they are not connected, which is itself an answer: two claims resting on
 * different sources share no evidence, and the graph says so rather than implying otherwise.
 */
export function shortestPath(graph, fromId, toId) {
  if (!graph.nodes.has(fromId) || !graph.nodes.has(toId)) return []
  if (fromId === toId) return [fromId]

  const seen = new Set([fromId])
  const queue = [[fromId]]
  while (queue.length) {
    const path = queue.shift()
    for (const n of neighbours(graph, path[path.length - 1])) {
      if (seen.has(n.node.id)) continue
      const next = [...path, n.node.id]
      if (n.node.id === toId) return next
      seen.add(n.node.id)
      queue.push(next)
    }
  }
  return []
}

/** Counts for the page's honesty line — a small graph should say it is small. */
export function graphStats(graph) {
  let claimCount = 0
  let sourceCount = 0
  for (const n of graph.nodes.values()) {
    if (n.kind === NODE_KIND.CLAIM) claimCount++
    else sourceCount++
  }
  return { claims: claimCount, sources: sourceCount, edges: graph.edges.length }
}
