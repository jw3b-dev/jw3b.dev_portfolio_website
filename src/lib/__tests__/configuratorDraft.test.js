/*
 * configuratorDraft (brief 08, next-need 1).
 *
 * The rules that matter are about what must NEVER be stored — contact details, identifiers, or a
 * draft that outlives the tab. Those are asserted directly, because the reason this module is
 * allowed to exist at all (Art 5(3) "strictly necessary") only holds while they are true.
 */
import { describe, it, expect } from 'vitest'
import { saveDraft, loadDraft, clearDraft, shapeDraft, DRAFT_KEY, DRAFT_FIELDS } from '../configuratorDraft.js'

const mem = () => {
  const m = new Map()
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
    _dump: () => m,
  }
}

describe('configuratorDraft — round trip', () => {
  it('saves and restores the answers', () => {
    const s = mem()
    saveDraft({ objective: 'security', engagement: 'retainer', assessment: { stage: 'shipped' }, step: 2 }, s)
    expect(loadDraft(s)).toEqual({ objective: 'security', engagement: 'retainer', assessment: { stage: 'shipped' }, step: 2 })
  })

  it('stores NOTHING for an empty form', () => {
    const s = mem()
    expect(saveDraft({}, s)).toBe(false)
    expect(s.getItem(DRAFT_KEY)).toBeNull()
  })

  it('clearDraft leaves nothing behind — a completed request should not linger', () => {
    const s = mem()
    saveDraft({ objective: 'security' }, s)
    clearDraft(s)
    expect(loadDraft(s)).toEqual({})
  })
})

describe('configuratorDraft — what must never be written', () => {
  it('drops contact details even when handed them', () => {
    const shaped = shapeDraft({ objective: 'security', contact: 'a@b.com', wallet: '0xabc', name: 'John' })
    expect(shaped).toEqual({ objective: 'security' })
    expect(Object.keys(shaped)).not.toContain('contact')
    expect(Object.keys(shaped)).not.toContain('wallet')
  })

  it('persists ONLY the declared fields', () => {
    const shaped = shapeDraft({ objective: 'x', engagement: 'y', assessment: { a: 'b' }, step: 1, sneaky: 'z' })
    for (const k of Object.keys(shaped)) expect(DRAFT_FIELDS).toContain(k)
  })

  it('drops non-string assessment answers rather than storing an object graph', () => {
    expect(shapeDraft({ assessment: { stage: 'shipped', evil: { nested: true }, n: 5 } }))
      .toEqual({ assessment: { stage: 'shipped' } })
  })

  it('re-shapes on READ, so an older build cannot reintroduce a dropped field', () => {
    const s = mem()
    s.setItem(DRAFT_KEY, JSON.stringify({ objective: 'security', contact: 'a@b.com' }))
    expect(loadDraft(s)).toEqual({ objective: 'security' })
  })
})

describe('configuratorDraft — fails closed, never throws', () => {
  it('survives storage that throws on write', () => {
    const s = { getItem: () => null, setItem: () => { throw new Error('quota') }, removeItem: () => {} }
    expect(saveDraft({ objective: 'security' }, s)).toBe(false)
  })
  it('survives unreadable JSON', () => {
    const s = mem(); s.setItem(DRAFT_KEY, '{not json')
    expect(loadDraft(s)).toEqual({})
  })
  it('survives no storage at all', () => {
    expect(loadDraft(null)).toEqual({})
    expect(saveDraft({ objective: 'x' }, null)).toBe(false)
    expect(() => clearDraft(null)).not.toThrow()
  })
  it('survives storage that throws on clear', () => {
    const s = { getItem: () => null, setItem: () => {}, removeItem: () => { throw new Error('nope') } }
    expect(() => clearDraft(s)).not.toThrow()
  })
})
