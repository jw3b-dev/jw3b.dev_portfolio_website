import { describe, it, expect } from 'vitest'
import { fetchCodehawksRecord, ageLabel, driftFrom, RECORD_STATE } from '../codehawksClient.js'

const RECORD = { xp: 1430.8, high: 8, medium: 5, low: 4, validSubmissions: 17, allTimePosition: 288 }
const res = (body, ok = true) => ({ ok, status: ok ? 200 : 500, json: async () => body })
const EMPTY = { state: RECORD_STATE.UNKNOWN, record: null, ageSec: null }

describe('ageLabel — coarse on purpose', () => {
  it('reads recent times as "just now"', () => {
    expect(ageLabel(0)).toBe('just now')
    expect(ageLabel(60 * 60)).toBe('just now')
  })
  it('switches to hours, then days', () => {
    expect(ageLabel(4 * 3600)).toBe('4 hours ago')
    expect(ageLabel(3600 * 2)).toBe('2 hours ago')
    expect(ageLabel(60 * 3600)).toBe('3 days ago')
  })
  it('returns null for a nonsense age instead of rendering it', () => {
    for (const v of [null, undefined, NaN, -1, 'soon']) expect(ageLabel(v)).toBeNull()
  })
})

describe('driftFrom — "no answer" and "they disagree" must never be confused', () => {
  it('reports agreement', () => {
    expect(driftFrom(RECORD, 17)).toEqual({ drifted: false, live: 17, register: 17 })
  })
  it('reports drift when the live source has moved', () => {
    // The whole point: the site can now notice its own register going stale.
    expect(driftFrom({ ...RECORD, validSubmissions: 19 }, 17)).toEqual({ drifted: true, live: 19, register: 17 })
  })
  it('returns NULL when there is nothing to compare — not "no drift"', () => {
    expect(driftFrom(null, 17)).toBeNull()
    expect(driftFrom({}, 17)).toBeNull()
    expect(driftFrom(RECORD, undefined)).toBeNull()
    expect(driftFrom(RECORD, 'seventeen')).toBeNull()
  })
})

describe('fetchCodehawksRecord — degrade to unknown, never to a number', () => {
  it('passes a live record through with its age', async () => {
    const out = await fetchCodehawksRecord({
      fetchImpl: async () => res({ state: 'live', record: RECORD, ageSec: 120 }),
    })
    expect(out).toEqual({ state: 'live', record: RECORD, ageSec: 120 })
  })

  it('accepts a stale record — that is the outage path working', async () => {
    const out = await fetchCodehawksRecord({
      fetchImpl: async () => res({ state: 'stale', record: RECORD, ageSec: 90000 }),
    })
    expect(out.state).toBe('stale')
    expect(out.record).toEqual(RECORD)
  })

  it('returns unknown without reaching for a global fetch', async () => {
    // A null fetchImpl falling through to jsdom's global fetch has false-passed twice on this
    // codebase. Prove the refusal.
    const saved = globalThis.fetch
    globalThis.fetch = undefined
    try {
      expect(await fetchCodehawksRecord({ fetchImpl: null })).toEqual(EMPTY)
    } finally {
      globalThis.fetch = saved
    }
  })

  it('returns unknown for a failed request, a throw, or unparseable JSON', async () => {
    expect(await fetchCodehawksRecord({ fetchImpl: async () => res(null, false) })).toEqual(EMPTY)
    expect(await fetchCodehawksRecord({ fetchImpl: async () => { throw new Error('x') } })).toEqual(EMPTY)
    expect(await fetchCodehawksRecord({ fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('html') } }) })).toEqual(EMPTY)
    expect(await fetchCodehawksRecord({ fetchImpl: async () => undefined })).toEqual(EMPTY)
  })

  it('rejects the worker saying "unknown", and any body with no usable count', async () => {
    for (const body of [
      { state: 'unknown', record: null },
      { state: 'live', record: null },
      { state: 'live', record: { xp: 1 } },
      { state: 'live', record: { validSubmissions: 'lots' } },
      { state: 'nonsense', record: RECORD },
      {},
      null,
    ]) {
      expect(await fetchCodehawksRecord({ fetchImpl: async () => res(body) })).toEqual(EMPTY)
    }
  })

  it('tolerates a missing or junk ageSec rather than failing the whole record', async () => {
    const out = await fetchCodehawksRecord({ fetchImpl: async () => res({ state: 'live', record: RECORD }) })
    expect(out.state).toBe('live')
    expect(out.ageSec).toBeNull()
  })
})
