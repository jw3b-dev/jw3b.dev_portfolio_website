/*
 * Rate limiter — the first Worker tests this project has ever had.
 *
 * This module FAILED OPEN in production for weeks: the reused D1 database still had v1's
 * `rate_limits` table (no `endpoint` column), so every v2 UPSERT threw and was swallowed by
 * the availability-first catch. The API was completely unthrottled and nothing noticed,
 * because no test ever exercised it. These pin both the maths and the failure behaviour.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  WINDOW_SEC, BUDGETS, DEFAULT_BUDGET, budgetFor, windowStart, clientIp,
  checkRateLimit, rateLimitedResponse, ROUTE_LIMITS, routeLimit,
} from '../rateLimit.js'

describe('budgets', () => {
  it('gives heavy AI endpoints a tighter budget than the conversion floor', () => {
    expect(budgetFor('audit')).toBeLessThan(budgetFor('light'))
    expect(budgetFor('chat')).toBeLessThan(budgetFor('light'))
    expect(BUDGETS.light).toBeGreaterThanOrEqual(60) // never throttle book-a-call hard
  })
  it('falls back to the default for an unknown endpoint', () => {
    expect(budgetFor('nope')).toBe(DEFAULT_BUDGET)
    expect(budgetFor(undefined)).toBe(DEFAULT_BUDGET)
  })
  it('is not fooled by inherited Object properties', () => {
    expect(budgetFor('constructor')).toBe(DEFAULT_BUDGET)
    expect(budgetFor('toString')).toBe(DEFAULT_BUDGET)
  })
})

describe('windowStart', () => {
  it('floors to the window boundary and is stable inside one window', () => {
    const t = 1_700_000_123_456
    const w = windowStart(t)
    expect(w % WINDOW_SEC).toBe(0)
    expect(windowStart(t + 1000)).toBe(w)
  })
  it('advances exactly one window per WINDOW_SEC', () => {
    const t = 1_700_000_000_000
    expect(windowStart(t + WINDOW_SEC * 1000) - windowStart(t)).toBe(WINDOW_SEC)
  })
})

describe('clientIp', () => {
  it('uses Cloudflare’s trusted header, never a client-settable one', () => {
    const req = new Request('https://x.dev', { headers: { 'CF-Connecting-IP': '1.2.3.4', 'X-Forwarded-For': '9.9.9.9' } })
    expect(clientIp(req)).toBe('1.2.3.4')
  })
  it('degrades to a constant when the header is absent', () => {
    expect(clientIp(new Request('https://x.dev'))).toBe('unknown')
  })
})

describe('routeLimit', () => {
  it('covers every public route that costs money or compute', () => {
    for (const key of ['POST /', 'POST /audit', 'POST /fuzz', 'POST /tx-explain', 'POST /speech-to-text', 'POST /text-to-speech', 'POST /ctf/verify']) {
      expect(ROUTE_LIMITS[key], `${key} must be rate-limited`).toBeTruthy()
    }
  })
  it('marks the streaming routes so a 429 is delivered as SSE, not JSON', () => {
    expect(routeLimit('POST', '/').sse).toBe(true)
    expect(routeLimit('POST', '/speech-to-text').sse).toBe(false)
  })
  it('returns null for unknown or wrong-method routes', () => {
    expect(routeLimit('GET', '/')).toBeNull()
    expect(routeLimit('POST', '/nope')).toBeNull()
  })
})

describe('checkRateLimit', () => {
  const dbReturning = (count, spy) => ({
    DB: { prepare: (sql) => ({ bind: (...a) => { spy?.(sql, a); return { first: async () => ({ count }), run: async () => {} } }, run: async () => {} }) },
  })

  it('permits while under budget and blocks once over it', async () => {
    const under = await checkRateLimit(dbReturning(BUDGETS.stt), new Request('https://x.dev'), 'stt', Date.now())
    expect(under.limited).toBe(false)
    const over = await checkRateLimit(dbReturning(BUDGETS.stt + 1), new Request('https://x.dev'), 'stt', Date.now())
    expect(over.limited).toBe(true)
    expect(over.retryAfter).toBeGreaterThan(0)
  })

  it('writes to rate_limits_v2 — v1’s table lacks the endpoint column and silently threw', async () => {
    const seen = vi.fn()
    await checkRateLimit(dbReturning(1, seen), new Request('https://x.dev'), 'chat', Date.now())
    const [sql] = seen.mock.calls[0]
    expect(sql).toContain('rate_limits_v2')
    expect(sql).toContain('ON CONFLICT(ip, endpoint, window_start)')
  })

  it('uses a parameterized UPSERT — never string interpolation', async () => {
    const seen = vi.fn()
    await checkRateLimit(dbReturning(1, seen), new Request('https://x.dev', { headers: { 'CF-Connecting-IP': "1.2.3.4'; DROP TABLE--" } }), 'chat', Date.now())
    const [sql, args] = seen.mock.calls[0]
    expect(sql).toMatch(/\?1|\?2|\?3/)
    expect(sql).not.toContain('DROP TABLE')
    expect(args[0]).toContain('DROP TABLE') // the hostile value travels as a BOUND param
  })

  it('FAILS OPEN on a database error — availability over throttling', async () => {
    const broken = { DB: { prepare: () => { throw new Error('no such column: endpoint') } } }
    const r = await checkRateLimit(broken, new Request('https://x.dev'), 'chat', Date.now())
    expect(r.limited).toBe(false)
  })

  it('fails open when no database is bound at all (local dev)', async () => {
    expect((await checkRateLimit({}, new Request('https://x.dev'), 'chat', Date.now())).limited).toBe(false)
    expect((await checkRateLimit(null, new Request('https://x.dev'), 'chat', Date.now())).limited).toBe(false)
  })
})

describe('rateLimitedResponse', () => {
  it('returns 429 with Retry-After for a JSON route', async () => {
    const res = rateLimitedResponse({ retryAfter: 30, sse: false })
    expect(res.status).toBe(429)
    expect(res.headers.get('retry-after')).toBe('30')
  })
  it('delivers an SSE frame for streaming routes so the client parser still works', async () => {
    const res = rateLimitedResponse({ retryAfter: 30, sse: true })
    expect(res.headers.get('content-type')).toContain('text/event-stream')
    expect(await res.text()).toContain('data:')
  })
  it('never leaks internals in the message', async () => {
    const body = await rateLimitedResponse({ retryAfter: 5, sse: false }).text()
    expect(body).not.toMatch(/sql|d1|stack|table/i)
  })
})
