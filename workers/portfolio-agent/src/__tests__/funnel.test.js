/*
 * P5-02 / ADR-P5-01 — cookieless funnel counters.
 *
 * The assertions that matter here are the NEGATIVE ones. Any counter implementation will count;
 * what has to stay true is that it cannot become tracking — a closed event vocabulary, a closed
 * surface vocabulary, day granularity, no identifier field anywhere, and a write path that can
 * never fail a request. Those are the properties ADR-P5-01 traded third-party analytics away for.
 */
import { describe, it, expect, vi } from 'vitest'
import { FUNNEL_EVENTS, FUNNEL_SURFACES, dayKey, normalizeEvent, recordEvent, track } from '../funnel.js'

const T = Date.UTC(2026, 7, 22, 13, 45, 0) // 2026-08-22T13:45:00Z

/** A D1 double that records what it was asked to bind. */
function db({ fail = false } = {}) {
  const calls = []
  return {
    calls,
    DB: {
      prepare(sql) {
        return {
          bind(...args) {
            calls.push({ sql, args })
            return { run: async () => { if (fail) throw new Error('D1 down'); return { success: true } } }
          },
        }
      },
    },
  }
}

describe('ADR-P5-01: the shape cannot become tracking', () => {
  it('stores a day, never a finer timestamp', () => {
    expect(dayKey(T)).toBe('2026-08-22')
    expect(dayKey(T)).not.toMatch(/\d\d:\d\d/)
  })

  it('accepts only the four declared events', () => {
    expect(FUNNEL_EVENTS).toEqual(['surface_view', 'tool_run', 'cta_click', 'request_submit'])
    for (const e of FUNNEL_EVENTS) {
      expect(normalizeEvent({ surface: 'audit', event: e }, T)).not.toBeNull()
    }
    for (const bad of ['click', 'pageview', 'identify', 'user_id', '']) {
      expect(normalizeEvent({ surface: 'audit', event: bad }, T)).toBeNull()
    }
  })

  it('accepts only declared surfaces — a free-text surface is a free-text field', () => {
    expect(normalizeEvent({ surface: 'audit', event: 'tool_run' }, T)).toEqual({
      day: '2026-08-22', surface: 'audit', event: 'tool_run',
    })
    for (const bad of ['audit?u=abc', 'visitor-42', 'unknown', '']) {
      expect(normalizeEvent({ surface: bad, event: 'tool_run' }, T)).toBeNull()
    }
    expect(FUNNEL_SURFACES).toContain('hire-me')
  })

  it('normalises case and whitespace rather than creating near-duplicate keys', () => {
    expect(normalizeEvent({ surface: ' AUDIT ', event: ' Tool_Run ' }, T)).toEqual({
      day: '2026-08-22', surface: 'audit', event: 'tool_run',
    })
  })

  it('rejects non-string input instead of coercing it', () => {
    expect(normalizeEvent({ surface: 1, event: 'tool_run' }, T)).toBeNull()
    expect(normalizeEvent({ surface: 'audit', event: null }, T)).toBeNull()
    expect(normalizeEvent(undefined, T)).toBeNull()
    expect(normalizeEvent({}, T)).toBeNull()
  })

  it('binds ONLY day, surface and event — there is no identifier to leak', async () => {
    const d = db()
    await recordEvent(d, { surface: 'hire-me', event: 'request_submit' }, T)
    expect(d.calls).toHaveLength(1)
    expect(d.calls[0].args).toEqual(['2026-08-22', 'hire-me', 'request_submit'])
    // Guard the SQL too: a future edit adding an ip/session column has to change this test.
    expect(d.calls[0].sql).toMatch(/funnel_counters \(day, surface, event, count\)/)
    expect(d.calls[0].sql).not.toMatch(/\bip\b|session|user|agent/i)
  })
})

describe('P5-02: it fails open, always', () => {
  it('drops an invalid event without touching the database', async () => {
    const d = db()
    expect(await recordEvent(d, { surface: 'nope', event: 'tool_run' }, T)).toBe(false)
    expect(d.calls).toHaveLength(0)
  })

  it('is inert with no DB bound (local dev) rather than throwing', async () => {
    expect(await recordEvent({}, { surface: 'audit', event: 'tool_run' }, T)).toBe(false)
    expect(await recordEvent(null, { surface: 'audit', event: 'tool_run' }, T)).toBe(false)
  })

  it('swallows a D1 failure — a counter must never cost a conversion', async () => {
    const d = db({ fail: true })
    await expect(recordEvent(d, { surface: 'audit', event: 'tool_run' }, T)).resolves.toBe(false)
  })

  it('track() hands the write to waitUntil and never rejects', async () => {
    const d = db({ fail: true })
    const ctx = { waitUntil: vi.fn() }
    await expect(track(d, ctx, { surface: 'audit', event: 'tool_run' }, T)).resolves.toBe(false)
    expect(ctx.waitUntil).toHaveBeenCalledTimes(1)
  })

  it('track() works without a ctx at all', async () => {
    const d = db()
    await expect(track(d, undefined, { surface: 'audit', event: 'tool_run' }, T)).resolves.toBe(true)
    await expect(track(d, {}, { surface: 'audit', event: 'tool_run' }, T)).resolves.toBe(true)
  })
})

/*
 * Client-reported events (brief 01, next-need 1).
 *
 * The route exists so the hero's client-side screen can be counted at all. Its safety rests
 * entirely on `normalizeEvent` — the body is attacker-controlled, so anything not on the closed
 * vocabularies must increment nothing. These pin that at the boundary rather than trusting the
 * caller, because the caller is a stranger.
 */
describe('funnel ingest — the body is untrusted input', () => {
  it('accepts a valid surface/event pair', () => {
    expect(normalizeEvent({ surface: 'home', event: 'tool_run' })).toMatchObject({ surface: 'home', event: 'tool_run' })
  })

  it('rejects a surface or event outside the closed set', () => {
    expect(normalizeEvent({ surface: 'evil', event: 'tool_run' })).toBeNull()
    expect(normalizeEvent({ surface: 'home', event: 'exfiltrate' })).toBeNull()
  })

  it('rejects anything that is not a pair of strings — including an injected object', () => {
    expect(normalizeEvent({ surface: { toString: () => 'home' }, event: 'tool_run' })).toBeNull()
    expect(normalizeEvent({ surface: 'home' })).toBeNull()
    expect(normalizeEvent(null)).toBeNull()
    expect(normalizeEvent({})).toBeNull()
  })

  it('carries no field a caller could use as an identifier', () => {
    const out = normalizeEvent({ surface: 'home', event: 'tool_run', visitor: 'abc', ip: '1.2.3.4' })
    expect(Object.keys(out).sort()).toEqual(['day', 'event', 'surface'])
  })
})
