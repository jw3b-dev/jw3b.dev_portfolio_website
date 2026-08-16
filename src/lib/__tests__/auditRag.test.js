import { describe, it, expect, vi } from 'vitest'
import {
  retrievalSafe,
  sanitizeRetrieved,
  buildRagContext,
  mapFindingRow,
  retrieveAuditContext,
} from '../../../workers/portfolio-agent/src/auditRag.js'
import { VULN_CORPUS, corpusRecords } from '../../data/vuln-corpus/index.js'

describe('retrieval-safety guard (P2-14 · OD-06)', () => {
  it('passes vulnerability knowledge (the real corpus is all safe)', () => {
    for (const c of VULN_CORPUS) expect(retrievalSafe(c.text), c.id).toBe(true)
  })

  it('drops a forbidden claim or a bare portfolio metric (no ungoverned stat reaches output)', () => {
    expect(retrievalSafe('John completed 50+ audits')).toBe(false) // forbidden
    expect(retrievalSafe('the pipeline embedded 192,000 chunks')).toBe(false) // portfolio stat
    expect(retrievalSafe('1,345 tests at 100% coverage')).toBe(false)
    expect(retrievalSafe('Reentrancy: external call before state update.')).toBe(true)
  })

  it('sanitizeRetrieved filters unsafe chunks out of the retrieved set', () => {
    const chunks = [
      { title: 'Reentrancy', text: 'external call before state update' },
      { title: 'Bragging', text: 'CodeHawks #124 · 17 findings · 1430 EXP' }, // portfolio stat → dropped
    ]
    const safe = sanitizeRetrieved(chunks)
    expect(safe).toHaveLength(1)
    expect(safe[0].title).toBe('Reentrancy')
  })

  it('buildRagContext assembles bounded, sanitized context', () => {
    const ctx = buildRagContext([{ title: 'A', text: 'alpha' }, { title: 'B', text: 'beta' }])
    expect(ctx).toContain('A: alpha')
    expect(ctx).toContain('B: beta')
    expect(buildRagContext([{ title: 'X', text: 'x'.repeat(50) }], 10)).toBe('') // maxChars respected
  })
})

describe('mapFindingRow — Neon row → {title,text} chunk', () => {
  it('shapes severity + SWC + source provenance', () => {
    const c = mapFindingRow({ title: 'Reentrancy', description: '  ext   call ', severity: 'High', swc_id: 'SWC-107', source: 'defihacklabs' })
    expect(c.title).toBe('[High] Reentrancy (SWC-107)')
    expect(c.text).toBe('ext call (source: DeFiHackLabs)')
  })

  it('is safe on a null/empty row (no description → empty text, filtered out downstream)', () => {
    expect(mapFindingRow(null)).toEqual({ title: '', text: '' })
    expect(mapFindingRow({ title: 'X' }).text).toBe('')
  })
})

describe('retrieveAuditContext — degrade + Neon retrieval', () => {
  it('degrades to empty context with no Neon/AI binding (unprovisioned)', async () => {
    expect(await retrieveAuditContext({}, 'contract Vault {}')).toEqual({ context: '', used: false, matches: 0 })
    // AI present but no DB URL → still degrades (both bindings required).
    expect(await retrieveAuditContext({ AI: { run: () => {} } }, 'x')).toEqual({ context: '', used: false, matches: 0 })
  })

  it('degrades on an upstream error (fails safe, never throws)', async () => {
    const env = { NEON_DATABASE_URL: 'postgres://x', AI: { run: () => Promise.reject(new Error('down')) } }
    expect((await retrieveAuditContext(env, 'x')).used).toBe(false)
  })

  it('degrades to empty when the embedder returns no vector', async () => {
    const env = { NEON_DATABASE_URL: 'postgres://x', AI: { run: () => Promise.resolve({ data: [] }) } }
    const neonClient = vi.fn(() => Promise.resolve([]))
    expect(await retrieveAuditContext(env, 'x', { neonClient })).toEqual({ context: '', used: false, matches: 0 })
    expect(neonClient).not.toHaveBeenCalled() // never reaches the DB without a query vector
  })

  it('embeds with bge-m3 and retrieves + sanitizes from the Neon KB (mocked sql client)', async () => {
    const run = vi.fn(() => Promise.resolve({ data: [[0.1, 0.2, 0.3]] }))
    const env = { NEON_DATABASE_URL: 'postgres://x', AI: { run } }
    // Fake tagged-template `sql` client returning two rows (one unsafe → dropped by the guard).
    const neonClient = vi.fn(() =>
      Promise.resolve([
        { title: 'Reentrancy', description: 'external call before state update', severity: 'High', swc_id: 'SWC-107', source: 'solodit_all_findings' },
        { title: 'Brag', description: '50+ audits completed', severity: 'Low', swc_id: null, source: 'sherlock' },
      ]),
    )
    const out = await retrieveAuditContext(env, 'contract Vault { function withdraw() {} }', { neonClient })
    expect(run).toHaveBeenCalledWith('@cf/baai/bge-m3', expect.objectContaining({ text: expect.any(Array) }))
    expect(neonClient).toHaveBeenCalled()
    expect(out.used).toBe(true)
    expect(out.context).toContain('Reentrancy')
    expect(out.context).toContain('SWC-107')
    expect(out.context).toContain('Solodit')
    expect(out.context).not.toMatch(/50\+ audits/i) // forbidden claim → dropped by the guard
  })
})

describe('corpus wiring', () => {
  it('corpusRecords shapes {id,text,metadata} for the vector index', () => {
    const recs = corpusRecords()
    expect(recs).toHaveLength(VULN_CORPUS.length)
    expect(recs[0]).toMatchObject({ id: expect.any(String), text: expect.any(String), metadata: expect.any(Object) })
  })
})
