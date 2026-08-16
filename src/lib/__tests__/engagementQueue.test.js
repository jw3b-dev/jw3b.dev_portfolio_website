import { describe, it, expect, vi } from 'vitest'
import {
  readQueue,
  enqueue,
  flush,
  startAutoFlush,
  toEngagementPayload,
  QUEUE_KEY,
  MAX_ATTEMPTS,
} from '../engagementQueue.js'

// A deterministic in-memory Storage stand-in.
function memStorage(initial = {}) {
  const map = new Map(Object.entries(initial))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    _map: map,
  }
}
const ok = () => ({ ok: true, status: 200 })
const status = (s) => ({ ok: false, status: s })

const SUBMISSION = { objective: 'security', engagement: 'project', tier: 'audit-sprint', contact: 'john@example.com' }

describe('toEngagementPayload — BR-12: tier travels, price never does', () => {
  it('carries the tier id and no price field, normalising wallet/assessment', () => {
    const p = toEngagementPayload(SUBMISSION)
    expect(p).toEqual({
      objective: 'security',
      engagement: 'project',
      tier: 'audit-sprint',
      route: 'book_a_call',
      contact: 'john@example.com',
      wallet: null,
      assessment: null,
    })
    expect(p).not.toHaveProperty('indicative_price')
  })
  it('preserves a provided wallet + assessment', () => {
    const p = toEngagementPayload({ ...SUBMISSION, wallet: '0xabc', assessment: { stage: 'idea' } })
    expect(p.wallet).toBe('0xabc')
    expect(p.assessment).toEqual({ stage: 'idea' })
  })
})

describe('readQueue — tolerant of absent / corrupt storage', () => {
  it('returns [] when there is no storage, empty, corrupt, or non-array data', () => {
    expect(readQueue(null)).toEqual([])
    expect(readQueue(memStorage())).toEqual([])
    expect(readQueue(memStorage({ [QUEUE_KEY]: '{not json' }))).toEqual([])
    expect(readQueue(memStorage({ [QUEUE_KEY]: '{"a":1}' }))).toEqual([])
  })
})

describe('enqueue — optimistic capture (BR-11)', () => {
  it('persists a queued item ready for immediate retry', () => {
    const storage = memStorage()
    const item = enqueue(SUBMISSION, { storage, id: 'eq-1', now: 1000 })
    expect(item).toMatchObject({ id: 'eq-1', status: 'queued', attempts: 0, nextAttemptAt: 1000 })
    expect(readQueue(storage)).toHaveLength(1)
  })
  it('is a no-op-safe write when storage is unavailable and mints an id/time by default', () => {
    const item = enqueue(SUBMISSION, { storage: null })
    expect(item.id).toBeTruthy()
    expect(typeof item.queuedAt).toBe('number')
  })
  it('binds to the real localStorage when no storage is injected', () => {
    localStorage.removeItem(QUEUE_KEY)
    const item = enqueue(SUBMISSION) // defaults: defaultStorage() + newId() + Date.now()
    expect(item.id).toBeTruthy()
    expect(readQueue()).toHaveLength(1) // reads back through the default storage path
    localStorage.removeItem(QUEUE_KEY)
  })
})

describe('flush — FR-037 delivery with retry/backoff', () => {
  it('POSTs a due item and removes it on 2xx (persisted to D1)', async () => {
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const fetchImpl = vi.fn().mockResolvedValue(ok())
    const out = await flush({ storage, fetchImpl, url: '/engagement', now: 10 })
    expect(fetchImpl).toHaveBeenCalledOnce()
    expect(out.results[0]).toMatchObject({ id: 'eq-1', ok: true })
    expect(out.remaining).toBe(0)
    expect(readQueue(storage)).toHaveLength(0)
  })

  it('keeps a 5xx item and schedules a backed-off retry', async () => {
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const out = await flush({ storage, fetchImpl: vi.fn().mockResolvedValue(status(503)), url: '/e', now: 0 })
    expect(out.results[0]).toMatchObject({ retry: true })
    expect(out.remaining).toBe(1)
    const [item] = readQueue(storage)
    expect(item.attempts).toBe(1)
    expect(item.nextAttemptAt).toBeGreaterThan(0)
  })

  it('drops a 4xx item as terminally rejected (a bad payload will not heal)', async () => {
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const out = await flush({ storage, fetchImpl: vi.fn().mockResolvedValue(status(400)), url: '/e', now: 0 })
    expect(out.results[0]).toMatchObject({ rejected: true })
    expect(readQueue(storage)).toHaveLength(0)
  })

  it('retries on a network throw (offline)', async () => {
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const out = await flush({ storage, fetchImpl: vi.fn().mockRejectedValue(new Error('offline')), url: '/e', now: 0 })
    expect(out.results[0]).toMatchObject({ retry: true, error: expect.stringContaining('offline') })
    expect(readQueue(storage)[0].attempts).toBe(1)
  })

  it('skips an item whose backoff has not elapsed', async () => {
    const storage = memStorage({
      [QUEUE_KEY]: JSON.stringify([
        { id: 'eq-1', payload: {}, attempts: 1, nextAttemptAt: 5000, status: 'queued' },
      ]),
    })
    const fetchImpl = vi.fn()
    const out = await flush({ storage, fetchImpl, url: '/e', now: 100 })
    expect(fetchImpl).not.toHaveBeenCalled()
    expect(out.results[0]).toMatchObject({ skipped: true })
    expect(out.remaining).toBe(1)
  })

  it('gives up after MAX_ATTEMPTS and stops requeueing', async () => {
    const storage = memStorage({
      [QUEUE_KEY]: JSON.stringify([
        { id: 'eq-1', payload: {}, attempts: MAX_ATTEMPTS - 1, nextAttemptAt: 0, status: 'queued' },
      ]),
    })
    const out = await flush({ storage, fetchImpl: vi.fn().mockResolvedValue(status(503)), url: '/e', now: 0 })
    expect(out.results[0]).toMatchObject({ retry: true })
    expect(readQueue(storage)).toHaveLength(0) // rejected → removed
  })

  it('no-ops when no fetch implementation is available', async () => {
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const out = await flush({ storage, fetchImpl: null })
    expect(out.remaining).toBe(1)
  })
})

describe('startAutoFlush — reconnect-driven delivery', () => {
  it('flushes immediately, listens for online, and cleans up', async () => {
    const listeners = {}
    const win = {
      addEventListener: vi.fn((ev, fn) => (listeners[ev] = fn)),
      removeEventListener: vi.fn(),
    }
    const storage = memStorage()
    enqueue(SUBMISSION, { storage, id: 'eq-1', now: 0 })
    const fetchImpl = vi.fn().mockResolvedValue(ok())

    const stop = startAutoFlush({ win, storage, fetchImpl, url: '/e', now: 10 })
    expect(win.addEventListener).toHaveBeenCalledWith('online', expect.any(Function))
    await listeners.online() // simulate a reconnect
    expect(fetchImpl).toHaveBeenCalled()

    stop()
    expect(win.removeEventListener).toHaveBeenCalledWith('online', expect.any(Function))
  })

  it('is a safe no-op with no window (SSR)', () => {
    const stop = startAutoFlush({ win: null })
    expect(stop).toBeTypeOf('function')
    expect(() => stop()).not.toThrow()
  })
})
