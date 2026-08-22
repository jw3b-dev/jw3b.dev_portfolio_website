/*
 * The funnel digest.
 *
 * The risk is not a failed send — it is a number that gets BELIEVED beyond what it can support.
 * These counters have no visitor identifier by design, so "12 tool runs" is twelve events and may
 * be one person twelve times. The tests weight that: the caveat must travel with the numbers, and
 * a quiet week must send nothing rather than a "0" that trains the reader to ignore the channel.
 */
import { describe, it, expect, vi } from 'vitest'
import { formatDigest, shapeRows, runDigest, DIGEST_DAYS } from '../digest.js'

const ROWS = [
  { surface: 'home', event: 'tool_run', count: 12 },
  { surface: 'audit', event: 'tool_run', count: 5 },
  { surface: 'hire-me', event: 'request_submit', count: 2 },
]

const envWith = (rows, extra = {}) => ({
  TELEGRAM_BOT_TOKEN: 't',
  TELEGRAM_CHAT_ID: 'c',
  DB: { prepare: () => ({ bind: () => ({ all: async () => ({ results: rows }) }) }) },
  ...extra,
})

describe('shapeRows — malformed input contributes nothing', () => {
  it('groups by surface then event', () => {
    expect(shapeRows(ROWS)).toEqual({
      home: { tool_run: 12 }, audit: { tool_run: 5 }, 'hire-me': { request_submit: 2 },
    })
  })
  it('drops rows with a missing field, a non-number, or a non-positive count', () => {
    expect(shapeRows([
      { surface: 'home' }, { event: 'tool_run' },
      { surface: 'home', event: 'tool_run', count: 'lots' },
      { surface: 'home', event: 'tool_run', count: 0 },
      { surface: 'home', event: 'tool_run', count: -3 },
    ])).toEqual({})
  })
  it('tolerates null and undefined', () => {
    expect(shapeRows(null)).toEqual({})
    expect(shapeRows(undefined)).toEqual({})
  })
})

describe('formatDigest — the caveat travels WITH the numbers', () => {
  it('states that these are events, not people', () => {
    const msg = formatDigest(ROWS)
    expect(msg).toMatch(/events, not people/i)
    expect(msg).toMatch(/no visitor identifier/i)
  })

  it('names the hero dedupe, which is the most misreadable number in it', () => {
    expect(formatDigest(ROWS)).toMatch(/once per page load/i)
  })

  it('reports each surface and a total', () => {
    const msg = formatDigest(ROWS)
    expect(msg).toContain('home')
    expect(msg).toContain('tool_run: 12')
    expect(msg).toContain('19 events total')
  })

  it('returns NULL for a quiet week — a weekly "0" trains its reader to ignore it', () => {
    expect(formatDigest([])).toBeNull()
    expect(formatDigest(null)).toBeNull()
    expect(formatDigest([{ surface: 'home', event: 'tool_run', count: 0 }])).toBeNull()
  })
})

describe('runDigest — never throws, never pages anyone', () => {
  it('sends when there is something to say', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true })
    const out = await runDigest(envWith(ROWS), { fetchImpl })
    expect(out.sent).toBe(true)
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body)
    expect(body.text).toMatch(/events, not people/i)
  })

  it('stays silent when Telegram is not configured', async () => {
    const fetchImpl = vi.fn()
    const out = await runDigest({ DB: envWith(ROWS).DB }, { fetchImpl })
    expect(out).toEqual({ sent: false, reason: 'not_configured' })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('stays silent, and does not throw, when the table is missing', async () => {
    // An unapplied migration — which has actually happened here.
    const env = envWith([], { DB: { prepare: () => { throw new Error('no such table') } } })
    await expect(runDigest(env, { fetchImpl: vi.fn() })).resolves.toEqual({ sent: false, reason: 'query_failed' })
  })

  it('stays silent with no database binding at all', async () => {
    expect(await runDigest({}, { fetchImpl: vi.fn() })).toEqual({ sent: false, reason: 'no_db' })
  })

  it('reports nothing_to_report rather than sending an empty digest', async () => {
    const fetchImpl = vi.fn()
    const out = await runDigest(envWith([]), { fetchImpl })
    expect(out.reason).toBe('nothing_to_report')
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('queries the declared window', async () => {
    let bound = null
    const env = envWith(ROWS, {
      DB: { prepare: () => ({ bind: (v) => { bound = v; return { all: async () => ({ results: ROWS }) } } }) },
    })
    await runDigest(env, { fetchImpl: vi.fn().mockResolvedValue({ ok: true }) })
    expect(bound).toBe(`-${DIGEST_DAYS} day`)
  })
})
