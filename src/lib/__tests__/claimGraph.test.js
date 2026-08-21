import { describe, it, expect } from 'vitest'
import { buildClaimGraph, neighbours, shortestPath, graphStats, sourceId, NODE_KIND } from '../claimGraph.js'
import register from '../../data/evidence-register.json'

/*
 * W4 — the thesis has to perform its own argument (PRODUCT_AUDIT #22).
 *
 * /thesis/systems-are-graphs says "the surfaces here are consoles, not slideshows … the work is
 * traversing it in front of you", and no surface on this site traversed anything. The graph used
 * here is deliberately not invented for the demo: it is the evidence register, the structure the
 * whole portfolio's credibility already rests on.
 */
const graph = buildClaimGraph()
const cleared = (register.claims || register).filter((c) => c.status === 'cleared')

describe('buildClaimGraph — built from the real register', () => {
  it('is not empty, and is not secretly hand-written', () => {
    const stats = graphStats(graph)
    expect(stats.claims).toBe(cleared.length)
    expect(stats.claims).toBeGreaterThan(10)
    expect(stats.sources).toBeGreaterThan(1)
    expect(stats.edges).toBe(cleared.length)
  })

  it('includes ONLY cleared claims — the gate must not leak what it rejected', () => {
    const blocked = (register.claims || register).filter((c) => c.status !== 'cleared')
    for (const c of blocked) expect(graph.nodes.has(c.id), `${c.id} is not cleared but is in the graph`).toBe(false)
  })

  it('attaches every claim to the source that attests it', () => {
    for (const c of cleared) {
      const edge = graph.edges.find((e) => e.from === c.id)
      expect(edge, `${c.id} has no source edge`).toBeTruthy()
      expect(edge.to).toBe(sourceId(c.source_system))
      expect(graph.nodes.get(edge.to).kind).toBe(NODE_KIND.SOURCE)
    }
  })

  it('carries the evidence pointer, so a walk ends at something checkable', () => {
    const withEvidence = [...graph.nodes.values()].filter((n) => n.kind === NODE_KIND.CLAIM && n.evidence)
    expect(withEvidence.length).toBeGreaterThan(0)
  })

  it('normalises source names into stable ids', () => {
    expect(sourceId('CodeHawks / Cyfrin')).toBe('source:codehawks-cyfrin')
    expect(sourceId('  Neo4j  ')).toBe('source:neo4j')
    expect(sourceId(null)).toBe('source:unknown')
  })
})

describe('neighbours — one hop, with the edge that got you there', () => {
  const claim = [...graph.nodes.values()].find((n) => n.kind === NODE_KIND.CLAIM)

  it('walks from a claim to its source', () => {
    const out = neighbours(graph, claim.id)
    expect(out.length).toBeGreaterThan(0)
    expect(out[0].label).toBe('attested by')
    expect(out[0].node.kind).toBe(NODE_KIND.SOURCE)
  })

  it('walks back from a source to every claim it attests', () => {
    const src = neighbours(graph, claim.id)[0].node
    const back = neighbours(graph, src.id)
    expect(back.length).toBeGreaterThan(0)
    expect(back.every((n) => n.node.kind === NODE_KIND.CLAIM)).toBe(true)
    expect(back.map((n) => n.node.id)).toContain(claim.id)
  })

  it('returns nothing for an unknown node rather than throwing', () => {
    expect(neighbours(graph, 'nope')).toEqual([])
  })
})

describe('shortestPath — the traversal the thesis describes', () => {
  const claims = [...graph.nodes.values()].filter((n) => n.kind === NODE_KIND.CLAIM)

  it('connects two claims that share a source, through that source', () => {
    // Find a source with at least two claims — the interesting case.
    const bySource = new Map()
    for (const e of graph.edges) bySource.set(e.to, [...(bySource.get(e.to) || []), e.from])
    const shared = [...bySource.values()].find((ids) => ids.length >= 2)
    expect(shared, 'no source attests two claims — the graph would be trivial').toBeTruthy()
    const path = shortestPath(graph, shared[0], shared[1])
    expect(path).toHaveLength(3) // claim → source → claim
    expect(path[1]).toMatch(/^source:/)
  })

  it('returns the single node when asked for a path to itself', () => {
    expect(shortestPath(graph, claims[0].id, claims[0].id)).toEqual([claims[0].id])
  })

  it('returns [] for unknown nodes — an honest "not connected"', () => {
    expect(shortestPath(graph, claims[0].id, 'nope')).toEqual([])
    expect(shortestPath(graph, 'nope', claims[0].id)).toEqual([])
  })
})
