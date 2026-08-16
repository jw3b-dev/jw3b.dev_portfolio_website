import { describe, it, expect } from 'vitest'
import {
  validateEngagement,
  handleEngagement,
  handleBookACall,
  catalogTier,
  TIERS,
} from '../../../workers/portfolio-agent/src/routes/engagement.js'
import catalog from '../../data/retainer.json'

const valid = {
  objective: 'security',
  engagement: 'project',
  tier: 'audit-sprint',
  route: 'book_a_call',
  contact: 'john@example.com',
}

describe('catalog wiring (BR-12)', () => {
  it('TIERS mirrors retainer.json and lookups work', () => {
    expect(TIERS).toHaveLength(catalog.tiers.length)
    expect(catalogTier('audit-sprint').objective).toBe('security')
    expect(catalogTier('nope')).toBeNull()
  })
})

describe('validateEngagement', () => {
  it('accepts a well-formed request and copies price FROM the catalog', () => {
    const v = validateEngagement({ ...valid, indicative_price: '$999 (spoofed)' })
    expect(v.ok).toBe(true)
    expect(v.record.tier).toBe('audit-sprint')
    expect(v.record.indicative_price).toBe(catalogTier('audit-sprint').indicative_price) // NOT the spoofed value
    expect(v.record.contact).toBe('john@example.com')
  })

  it('rejects each invalid field with a specific error', () => {
    expect(validateEngagement(null).error).toMatch(/body required/)
    expect(validateEngagement({ ...valid, objective: 'x' }).error).toMatch(/objective/)
    expect(validateEngagement({ ...valid, engagement: 'x' }).error).toMatch(/engagement/)
    expect(validateEngagement({ ...valid, route: 'x' }).error).toMatch(/route/)
    expect(validateEngagement({ ...valid, tier: 'x' }).error).toMatch(/invalid tier/)
    expect(validateEngagement({ ...valid, tier: 'secure-build' }).error).toMatch(/does not match/) // wrong objective
    expect(validateEngagement({ ...valid, contact: '' }).error).toMatch(/contact/)
    expect(validateEngagement({ ...valid, contact: 'a@b' }).error).toMatch(/invalid email/)
    expect(validateEngagement({ ...valid, wallet: '0x123' }).error).toMatch(/invalid wallet/)
  })

  it('accepts an optional valid wallet and stringifies assessment', () => {
    const v = validateEngagement({ ...valid, wallet: '0x' + 'a'.repeat(40), assessment: { risk: 'high' } })
    expect(v.record.wallet).toBe('0x' + 'a'.repeat(40))
    expect(JSON.parse(v.record.assessment_json)).toEqual({ risk: 'high' })
  })
})

describe('handleEngagement — persistence', () => {
  const okDb = () => ({ DB: { prepare: () => ({ bind: () => ({ run: async () => ({}) }) }) } })

  it('inserts and returns {id, submitted}', async () => {
    const out = await handleEngagement({}, okDb(), undefined, valid)
    expect(out.status).toBe(200)
    expect(out.body.status).toBe('submitted')
    expect(out.body.id).toMatch(/[0-9a-f-]{36}/)
  })

  it('400s on invalid input before touching D1', async () => {
    const out = await handleEngagement({}, okDb(), undefined, { ...valid, tier: 'x' })
    expect(out.status).toBe(400)
  })

  it('503s (retry) when D1 throws — never silently drops a conversion', async () => {
    const env = { DB: { prepare: () => ({ bind: () => ({ run: async () => { throw new Error('d1') } }) }) } }
    const out = await handleEngagement({}, env, undefined, valid)
    expect(out.status).toBe(503)
  })

  it('succeeds without D1 in dev (no binding)', async () => {
    const out = await handleEngagement({}, {}, undefined, valid)
    expect(out.status).toBe(200)
  })
})

describe('handleBookACall — guaranteed terminal action (FR-036)', () => {
  it('acknowledges with a contact and surfaces the owner scheduler url', () => {
    expect(handleBookACall({}, { SCHEDULER_URL: 'https://cal/x' }, { contact: 'me@x.io' })).toEqual({
      status: 200,
      body: { ok: true, scheduler_url: 'https://cal/x' },
    })
    expect(handleBookACall({}, {}, { contact: 'me@x.io' }).body.scheduler_url).toBeNull()
  })
  it('rejects a missing/oversized contact', () => {
    expect(handleBookACall({}, {}, {}).status).toBe(400)
    expect(handleBookACall({}, {}, { contact: 'x'.repeat(201) }).status).toBe(400)
  })
})
