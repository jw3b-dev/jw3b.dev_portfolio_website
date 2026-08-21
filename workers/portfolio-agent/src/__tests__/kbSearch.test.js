import { describe, it, expect, vi } from 'vitest'
import {
  validateSearch,
  validateRelated,
  mapSearchRow,
  edgesFor,
  handleKbSearch,
  handleKbRelated,
  handleKbStats,
  shapeSeverity,
} from '../routes/kbSearch.js'

/*
 * W4 — GraphRAG over the PUBLIC audit corpus.
 *
 * Two halves that do different jobs: vector search finds an entry point by MEANING, traversal
 * expands it by RELATIONSHIP. Cosine distance cannot do the second — two findings can describe
 * one bug class in words so different they never rank near each other, and still be one edge
 * apart.
 *
 * The confidentiality line is the thing to keep verified: this route reads ONLY
 * `knowledge_base_findings` (public research). The `findings` and `audit_submissions` tables
 * beside it hold client work — org ids, contract code, embargo dates — and must never be reachable
 * from a public surface.
 */
const row = (over = {}) => ({
  id: 'f1',
  title: 'Reentrancy in withdraw()',
  description: 'The external call precedes the balance update.',
  severity: 'high',
  protocol: 'ExampleDAO',
  year: 2023,
  source: 'solodit_all_findings',
  source_url: 'https://example.test/f1',
  swc_id: 'SWC-107',
  similarity: 0.912345,
  ...over,
})

/** A Neon tag-template double that records the SQL it was asked to run. */
function fakeSql(responses) {
  const calls = []
  const queue = [...responses]
  const sql = (strings, ...vals) => {
    calls.push({ sql: strings.join('?'), vals })
    return Promise.resolve(queue.shift() ?? [])
  }
  sql.calls = calls
  return sql
}

const env = (over = {}) => ({
  NEON_DATABASE_URL: 'postgres://x',
  AI: { run: vi.fn().mockResolvedValue({ data: [new Array(1024).fill(0.01)] }) },
  ...over,
})

describe('validateSearch', () => {
  it('rejects a query too short to mean anything', () => {
    expect(validateSearch({ q: 'a' }).ok).toBe(false)
    expect(validateSearch({}).ok).toBe(false)
  })

  it('clamps the limit into range and defaults sensibly', () => {
    expect(validateSearch({ q: 'reentrancy' }).limit).toBe(8)
    expect(validateSearch({ q: 'reentrancy', limit: 999 }).limit).toBe(20)
    expect(validateSearch({ q: 'reentrancy', limit: 0 }).limit).toBe(1)
    expect(validateSearch({ q: 'reentrancy', limit: 'abc' }).limit).toBe(8)
  })

  it('caps an over-long query rather than rejecting it', () => {
    expect(validateSearch({ q: 'x'.repeat(1000) }).query).toHaveLength(300)
  })
})

describe('mapSearchRow — shaping, and the claims-gate guard', () => {
  it('maps a row to a labelled, sourced result', () => {
    const m = mapSearchRow(row())
    expect(m.title).toBe('Reentrancy in withdraw()')
    expect(m.source).toBe('Solodit') // raw source values are never shown to a visitor
    expect(m.sourceUrl).toBe('https://example.test/f1')
    expect(m.similarity).toBe(0.9123)
  })

  it('truncates a long description rather than reprinting a whole report', () => {
    expect(mapSearchRow(row({ description: 'x'.repeat(900) })).excerpt).toHaveLength(401)
  })

  it('DROPS a row carrying a forbidden claim — third-party data is not trusted copy', () => {
    // The corpus is external. A poisoned row must not put a forbidden claim on a page the claims
    // gate governs — and it is dropped, not silently edited, because rewriting someone's finding
    // would misrepresent the source.
    expect(mapSearchRow(row({ description: 'Protocol had $50M TVL secured at the time.' }))).toBeNull()
  })

  it('labels the source values the corpus ACTUALLY emits, not the ones a doc claimed', () => {
    // Live rows use `solodit` and `sherlock_judging`; the older map expected different spellings,
    // which would have leaked a raw database enum onto the page.
    expect(mapSearchRow(row({ source: 'solodit' })).source).toBe('Solodit')
    expect(mapSearchRow(row({ source: 'sherlock_judging' })).source).toBe('Sherlock')
  })

  it('drops an untitled row and survives a null', () => {
    expect(mapSearchRow(row({ title: '  ' }))).toBeNull()
    expect(mapSearchRow(null)).toBeNull()
  })
})

describe('handleKbSearch', () => {
  it('embeds the query and returns ranked results', async () => {
    const sql = fakeSql([[row(), row({ id: 'f2', title: 'Second finding' })]])
    const e = env()
    const out = await handleKbSearch({}, e, {}, { q: 'reentrancy' }, { neonClient: sql })
    expect(out.status).toBe(200)
    expect(out.body.degraded).toBe(false)
    expect(out.body.results).toHaveLength(2)
    expect(e.AI.run).toHaveBeenCalledWith('@cf/baai/bge-m3', { text: ['reentrancy'] })
  })

  it('reads ONLY the public corpus table', async () => {
    const sql = fakeSql([[row()]])
    await handleKbSearch({}, env(), {}, { q: 'reentrancy' }, { neonClient: sql })
    const text = sql.calls.map((c) => c.sql).join(' ')
    expect(text).toContain('knowledge_base_findings')
    // The client-work tables must never appear in a query from a public route.
    expect(text).not.toMatch(/\baudit_submissions\b/)
    expect(text).not.toMatch(/\bFROM\s+findings\b/)
  })

  it('excludes rows the box has not embedded yet — they cannot be ranked', async () => {
    const sql = fakeSql([[row()]])
    await handleKbSearch({}, env(), {}, { q: 'reentrancy' }, { neonClient: sql })
    expect(sql.calls[0].sql).toContain('embedding IS NOT NULL')
  })

  it('REFUSES a query embedded in a different space rather than ranking nonsense', async () => {
    // The corpus is embedded by a self-hosted bge-m3 (1024-dim). A different width means a
    // different model, which still yields a confident-looking cosine distance — and a meaningless
    // one. No error, no counter, just worse results. So it must refuse.
    const e = env({ AI: { run: vi.fn().mockResolvedValue({ data: [new Array(768).fill(0.1)] }) } })
    const out = await handleKbSearch({}, e, {}, { q: 'reentrancy' }, { neonClient: fakeSql([[row()]]) })
    expect(out.body.degraded).toBe(true)
    expect(out.body.reason).toMatch(/does not match the corpus/i)
    expect(out.body.results).toEqual([])
  })

  it('degrades at HTTP 200 when the corpus is unreachable', async () => {
    const sql = () => Promise.reject(new Error('neon asleep'))
    const out = await handleKbSearch({}, env(), {}, { q: 'reentrancy' }, { neonClient: sql })
    expect(out.status).toBe(200) // a 5xx here would break the page for a fault the visitor cannot act on
    expect(out.body.degraded).toBe(true)
    expect(out.body.results).toEqual([])
  })

  it('degrades when unprovisioned instead of throwing', async () => {
    const out = await handleKbSearch({}, {}, {}, { q: 'reentrancy' })
    expect(out.body.degraded).toBe(true)
    expect(out.body.reason).toMatch(/not provisioned/i)
  })

  it('rejects a bad query with 400', async () => {
    expect((await handleKbSearch({}, env(), {}, { q: 'x' })).status).toBe(400)
  })

  it('serves a cache hit without embedding again', async () => {
    const cached = { query: 'reentrancy', results: [mapSearchRow(row())], degraded: false }
    const e = env({ KV: { get: vi.fn().mockResolvedValue(cached), put: vi.fn() } })
    const out = await handleKbSearch({}, e, {}, { q: 'reentrancy' }, { neonClient: fakeSql([]) })
    expect(out.body.cached).toBe(true)
    expect(e.AI.run).not.toHaveBeenCalled() // the whole point: no repeat inference spend
  })
})

describe('edgesFor — the relationships a finding exposes', () => {
  it('names the SWC class, protocol and source', () => {
    expect(edgesFor(row()).map((e) => e.kind)).toEqual(['swc', 'protocol', 'source'])
  })

  it('omits edges the row does not have — an unlinked finding is normal', () => {
    expect(edgesFor(row({ swc_id: null, protocol: null })).map((e) => e.kind)).toEqual(['source'])
    expect(edgesFor(null)).toEqual([])
  })
})

describe('handleKbRelated — expand by relationship', () => {
  it('walks to siblings in the same SWC class', async () => {
    const sql = fakeSql([[row()], [row({ id: 'f2', title: 'Another reentrancy' })]])
    const out = await handleKbRelated({}, env(), {}, { id: 'f1', edge: 'swc' }, { neonClient: sql })
    expect(out.status).toBe(200)
    expect(out.body.origin.id).toBe('f1')
    expect(out.body.results[0].id).toBe('f2')
    expect(sql.calls[1].sql).toContain('swc_id =')
    expect(sql.calls[1].vals).toContain('SWC-107')
  })

  it('never returns the origin as its own neighbour', async () => {
    const sql = fakeSql([[row()], []])
    await handleKbRelated({}, env(), {}, { id: 'f1', edge: 'protocol' }, { neonClient: sql })
    expect(sql.calls[1].sql).toContain('id <>')
  })

  it('says plainly when a finding has no such edge', async () => {
    const sql = fakeSql([[row({ swc_id: null })]])
    const out = await handleKbRelated({}, env(), {}, { id: 'f1', edge: 'swc' }, { neonClient: sql })
    expect(out.body.degraded).toBe(false) // not an error — plenty of rows carry no SWC id
    expect(out.body.results).toEqual([])
    expect(out.body.reason).toMatch(/no swc edge/i)
  })

  it('rejects an unknown edge kind rather than interpolating it into SQL', async () => {
    const out = await handleKbRelated({}, env(), {}, { id: 'f1', edge: 'drop table' })
    expect(out.status).toBe(400)
  })

  it('rejects a missing or absurd id', async () => {
    expect((await handleKbRelated({}, env(), {}, {})).status).toBe(400)
    expect((await handleKbRelated({}, env(), {}, { id: 'x'.repeat(100) })).status).toBe(400)
  })

  it('handles a finding that has left the corpus', async () => {
    const out = await handleKbRelated({}, env(), {}, { id: 'gone' }, { neonClient: fakeSql([[]]) })
    expect(out.body.degraded).toBe(true)
    expect(out.body.reason).toMatch(/no longer in the corpus/i)
  })

  it('reads only the public corpus table here too', async () => {
    const sql = fakeSql([[row()], [row({ id: 'f2' })]])
    await handleKbRelated({}, env(), {}, { id: 'f1', edge: 'source' }, { neonClient: sql })
    const text = sql.calls.map((c) => c.sql).join(' ')
    expect(text).toContain('knowledge_base_findings')
    expect(text).not.toMatch(/\baudit_submissions\b/)
  })
})

describe('validateRelated', () => {
  it('accepts the three real edge kinds only', () => {
    for (const edge of ['swc', 'protocol', 'source']) expect(validateRelated({ id: 'f1', edge }).ok).toBe(true)
    expect(validateRelated({ id: 'f1', edge: 'evil' }).ok).toBe(false)
  })

  it('defaults to the PROTOCOL edge, because swc_id is sparse in the real corpus', () => {
    // Sampled live 2026-08-21: swc_id populated on 0/6 rows, protocol on 6/6. Defaulting to an
    // edge that is almost never present makes traversal look broken when the data is just sparse.
    expect(validateRelated({ id: 'f1' }).kind).toBe('protocol')
  })
})

/*
 * The aggregates route touches the CLIENT-WORK tables, so its tests are about what it must NOT
 * do. `findings` and `audit_submissions` hold org ids, contract code, unfixed vulnerability
 * locations and a contractual `embargo_until`; neither has a disclosed flag, so no query can know
 * which rows are publishable. The answer is that none are — only counts leave.
 */
describe('handleKbStats — counts only, never rows', () => {
  const statsSql = () =>
    fakeSql([[{ n: 42 }], [{ n: 731 }], [{ severity: 'high', n: 90 }, { severity: 'medium', n: 300 }]])

  it('returns volume and severity shape', async () => {
    const out = await handleKbStats({}, { NEON_DATABASE_URL: 'x' }, {}, null, { neonClient: statsSql() })
    expect(out.status).toBe(200)
    expect(out.body.audits).toBe(42)
    expect(out.body.findings).toBe(731)
    expect(out.body.severity).toEqual({ high: 90, medium: 300 })
  })

  it('selects ONLY aggregates — no column that could identify a client', async () => {
    const sql = statsSql()
    await handleKbStats({}, { NEON_DATABASE_URL: 'x' }, {}, null, { neonClient: sql })
    const text = sql.calls.map((c) => c.sql).join(' ').toLowerCase()
    for (const forbidden of ['org_id', 'contract_code', 'contract_url', 'project_name', 'location', 'poc', 'title', 'description', 'submitted_by', 'repo_url']) {
      expect(text, `stats query selects "${forbidden}" — that identifies client work`).not.toContain(forbidden)
    }
    expect(text).toContain('count(*)')
  })

  it('takes NO parameters into its SQL — the statements are fixed', async () => {
    const sql = statsSql()
    await handleKbStats({}, { NEON_DATABASE_URL: 'x' }, {}, { severity: "'; DROP TABLE findings; --" }, { neonClient: sql })
    for (const call of sql.calls) expect(call.vals).toEqual([])
  })

  it('degrades honestly rather than reporting zero work', async () => {
    // "0 audits" and "the database is unreachable" are different claims; a zero-counter on a
    // portfolio is worse than absent.
    const out = await handleKbStats({}, { NEON_DATABASE_URL: 'x' }, {}, null, { neonClient: () => Promise.reject(new Error('down')) })
    expect(out.body.degraded).toBe(true)
    expect(out.body.audits).toBeNull()
    expect(out.body.findings).toBeNull()
  })

  it('degrades when unprovisioned', async () => {
    expect((await handleKbStats({}, {}, {}, null)).body.degraded).toBe(true)
  })
})

describe('shapeSeverity', () => {
  it('normalises buckets and drops malformed ones', () => {
    expect(shapeSeverity([{ severity: 'High', n: 5 }, { severity: null, n: 3 }, { severity: 'low', n: 'x' }, { severity: 'info', n: -1 }])).toEqual({ high: 5 })
  })

  it('survives null input', () => {
    expect(shapeSeverity(null)).toEqual({})
  })
})
