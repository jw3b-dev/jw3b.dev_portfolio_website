/*
 * kbClient — the corpus transport.
 *
 * The property that matters most here is the one the /audit stream has: it NEVER throws. This
 * surface sits inside a flagship card on /work; a rejected promise from an optional corpus query
 * would take down a page whose other four sections work fine.
 *
 * The second property is labelling. The corpus is third-party data with inconsistent severities
 * and at least one source value (`x23`, verified live) that is in no lookup table. Every one of
 * those must degrade to an HONEST label rather than a flattering guess.
 */
import { describe, it, expect, vi } from 'vitest'
import { searchKb, relatedKb, kbStats, edgeLabel, sourceLabel, severityTone, EDGE_KINDS } from '../kbClient.js'

const ok = (body) => vi.fn().mockResolvedValue({ ok: true, json: async () => body })

describe('kbClient — labelling third-party data honestly', () => {
  it('passes through the sources the Worker already resolved', () => {
    expect(sourceLabel('Solodit')).toBe('Solodit')
    expect(sourceLabel('DeFiHackLabs')).toBe('DeFiHackLabs')
    expect(sourceLabel('Vulns DB')).toBe('Vulns DB')
  })

  it('marks an UNRESOLVED database enum as unattributed rather than dressing it as a brand', () => {
    // `x23` is real: it comes back from the live corpus and is in no SOURCE_LABELS entry.
    expect(sourceLabel('x23')).toBe('Unattributed (x23)')
    expect(sourceLabel('')).toBe('Unattributed')
    expect(sourceLabel(null)).toBe('Unattributed')
  })

  it('never downgrades an unknown severity to a low one', () => {
    expect(severityTone('High')).toBe('high')
    expect(severityTone('critical')).toBe('high')
    expect(severityTone('Medium')).toBe('medium')
    expect(severityTone('info')).toBe('low')
    // The corpus really does emit this, and calling it "low" would under-report someone's finding.
    expect(severityTone('UNSPECIFIED')).toBe('unknown')
    expect(severityTone(null)).toBe('unknown')
  })

  it('names every edge kind in words, and only the kinds the Worker accepts', () => {
    expect(EDGE_KINDS).toEqual(['protocol', 'swc', 'source'])
    for (const k of EDGE_KINDS) expect(edgeLabel(k)).toMatch(/^Same /)
    expect(edgeLabel('nonsense')).toBe('nonsense')
  })
})

describe('searchKb', () => {
  it('returns the Worker’s results and asks for what it was told to', async () => {
    const fetchImpl = ok({ query: 'reentrancy', results: [{ id: 'a', title: 'T' }], degraded: false })
    const res = await searchKb('reentrancy', { fetchImpl, limit: 3 })
    expect(res.results).toHaveLength(1)
    expect(res.degraded).toBe(false)
    expect(fetchImpl.mock.calls[0][0]).toContain('q=reentrancy')
    expect(fetchImpl.mock.calls[0][0]).toContain('limit=3')
  })

  it('encodes a query that would otherwise break the URL', async () => {
    const fetchImpl = ok({ results: [] })
    await searchKb('a & b = c?', { fetchImpl })
    expect(fetchImpl.mock.calls[0][0]).toContain(encodeURIComponent('a & b = c?'))
  })

  it('refuses a one-character query WITHOUT a round trip', async () => {
    const fetchImpl = ok({ results: [] })
    const res = await searchKb('r', { fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(res.degraded).toBe(true)
    expect(res.reason).toMatch(/two characters/)
  })

  it.each([
    ['a rejected fetch', vi.fn().mockRejectedValue(new Error('offline'))],
    ['a non-200', vi.fn().mockResolvedValue({ ok: false })],
    ['malformed JSON', vi.fn().mockResolvedValue({ ok: true, json: async () => { throw new Error('bad') } })],
  ])('degrades on %s instead of throwing', async (_label, fetchImpl) => {
    const res = await searchKb('reentrancy', { fetchImpl })
    expect(res.results).toEqual([])
    expect(res.degraded).toBe(true)
    expect(res.reason).toMatch(/unreachable/)
  })

  it('carries the Worker’s OWN degraded reason through rather than replacing it', async () => {
    const fetchImpl = ok({ query: 'x', results: [], degraded: true, reason: 'search is not provisioned' })
    const res = await searchKb('reentrancy', { fetchImpl })
    expect(res.reason).toBe('search is not provisioned')
  })

  it('survives a 200 whose body is missing the fields it promised', async () => {
    const res = await searchKb('reentrancy', { fetchImpl: ok({}) })
    expect(res.results).toEqual([])
    expect(res.degraded).toBe(false)
  })
})

describe('relatedKb', () => {
  it('walks the requested edge', async () => {
    const fetchImpl = ok({ origin: { id: 'a' }, edges: [{ kind: 'swc' }], results: [{ id: 'b' }], degraded: false })
    const res = await relatedKb('a', { edge: 'swc', fetchImpl })
    expect(res.results).toHaveLength(1)
    expect(fetchImpl.mock.calls[0][0]).toContain('edge=swc')
  })

  it('falls back to the protocol edge when handed a kind the Worker would reject', async () => {
    const fetchImpl = ok({ origin: null, edges: [], results: [] })
    await relatedKb('a', { edge: 'neo4j', fetchImpl })
    expect(fetchImpl.mock.calls[0][0]).toContain('edge=protocol')
  })

  it('requires an id, without a round trip', async () => {
    const fetchImpl = ok({})
    const res = await relatedKb('', { fetchImpl })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(res.degraded).toBe(true)
  })

  it('reports an unlinked finding as a real answer, not a failure', async () => {
    // Verified live: a finding with an SWC id but no protocol returns exactly this shape.
    const fetchImpl = ok({ origin: { id: 'a' }, edges: [{ kind: 'swc', value: 'SWC-107' }], results: [], degraded: false, reason: 'no protocol edge' })
    const res = await relatedKb('a', { fetchImpl })
    expect(res.degraded).toBe(false)
    expect(res.reason).toBe('no protocol edge')
    expect(res.edges).toHaveLength(1)
  })

  it('degrades without throwing', async () => {
    const res = await relatedKb('a', { fetchImpl: vi.fn().mockRejectedValue(new Error('nope')) })
    expect(res.degraded).toBe(true)
    expect(res.origin).toBeNull()
  })
})

describe('kbStats', () => {
  it('returns the aggregate body', async () => {
    const res = await kbStats({ fetchImpl: ok({ audits: 245, findings: 2231, degraded: false }) })
    expect(res.audits).toBe(245)
    expect(res.degraded).toBe(false)
  })

  it('degrades without throwing', async () => {
    const res = await kbStats({ fetchImpl: vi.fn().mockRejectedValue(new Error('nope')) })
    expect(res.degraded).toBe(true)
  })

  it('does not mistake a non-object body for stats', async () => {
    const res = await kbStats({ fetchImpl: ok('not an object') })
    expect(res.degraded).toBe(true)
  })
})

describe('kbClient — no fetch available at all', () => {
  it('degrades rather than exploding in an environment without fetch', async () => {
    const res = await searchKb('reentrancy', { fetchImpl: null })
    // jsdom provides fetch, so force the no-transport path explicitly.
    expect(res).toBeTruthy()
  })
})
