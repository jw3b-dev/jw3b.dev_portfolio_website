import { describe, it, expect, vi } from 'vitest'
import {
  retrievalSafe,
  sanitizeRetrieved,
  buildRagContext,
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

describe('retrieveAuditContext — degrade + retrieval', () => {
  it('degrades to empty context with no Vectorize/AI binding (unprovisioned)', async () => {
    expect(await retrieveAuditContext({}, 'contract Vault {}')).toEqual({ context: '', used: false, matches: 0 })
  })

  it('degrades on an upstream error (fails safe, never throws)', async () => {
    const env = { AI: { run: () => Promise.reject(new Error('down')) }, VECTORIZE: { query: () => {} } }
    expect((await retrieveAuditContext(env, 'x')).used).toBe(false)
  })

  it('retrieves + sanitizes when provisioned', async () => {
    const env = {
      AI: { run: vi.fn(() => Promise.resolve({ data: [[0.1, 0.2]] })) },
      VECTORIZE: {
        query: vi.fn(() =>
          Promise.resolve({
            matches: [
              { metadata: { title: 'Reentrancy', text: 'external call before state update' } },
              { metadata: { title: 'Brag', text: '50+ audits completed' } }, // dropped by the guard
            ],
          }),
        ),
      },
    }
    const out = await retrieveAuditContext(env, 'contract Vault { function withdraw() {} }')
    expect(out.used).toBe(true)
    expect(out.context).toContain('Reentrancy')
    expect(out.context).not.toMatch(/50\+ audits/i)
  })
})

describe('corpus wiring', () => {
  it('corpusRecords shapes {id,text,metadata} for the vector index', () => {
    const recs = corpusRecords()
    expect(recs).toHaveLength(VULN_CORPUS.length)
    expect(recs[0]).toMatchObject({ id: expect.any(String), text: expect.any(String), metadata: expect.any(Object) })
  })
})
