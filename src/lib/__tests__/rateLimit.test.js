import { describe, it, expect } from 'vitest'
import {
  WINDOW_SEC,
  budgetFor,
  windowStart,
  clientIp,
  checkRateLimit,
  rateLimitedResponse,
  routeLimit,
} from '../../../workers/portfolio-agent/src/rateLimit.js'

// D1 stub: prepare().bind().first() returns { count } from the injected sequence.
function dbReturning(count) {
  return {
    DB: {
      prepare: () => ({ bind: () => ({ first: async () => ({ count }) }) }),
    },
  }
}
const reqWithIp = (ip) => new Request('https://x/', { headers: ip ? { 'CF-Connecting-IP': ip } : {} })

describe('rate limit — pure helpers', () => {
  it('windowStart floors to the fixed window', () => {
    expect(windowStart(1_000_000, 60)).toBe(960) // 1000s → 960
    expect(windowStart(59_999, 60)).toBe(0)
    expect(windowStart(60_000, 60)).toBe(60)
  })

  it('budgetFor: known endpoints + default fallback', () => {
    expect(budgetFor('audit')).toBe(10)
    expect(budgetFor('chat')).toBe(20)
    expect(budgetFor('unknown')).toBeGreaterThan(0)
  })

  it('clientIp reads only the trusted CF header', () => {
    expect(clientIp(reqWithIp('9.9.9.9'))).toBe('9.9.9.9')
    expect(clientIp(reqWithIp(null))).toBe('unknown')
  })

  it('routeLimit maps method+path to endpoint + sse flag', () => {
    expect(routeLimit('POST', '/audit')).toEqual({ endpoint: 'audit', sse: true })
    expect(routeLimit('GET', '/ctf/leaderboard')).toEqual({ endpoint: 'light', sse: false })
    expect(routeLimit('POST', '/nope')).toBeNull()
  })
})

describe('checkRateLimit', () => {
  it('under budget → not limited', async () => {
    const r = await checkRateLimit(dbReturning(5), reqWithIp('1.1.1.1'), 'audit', 1_000_000)
    expect(r.limited).toBe(false)
  })

  it('over budget → limited with a positive retryAfter', async () => {
    const r = await checkRateLimit(dbReturning(11), reqWithIp('1.1.1.1'), 'audit', 1_000_000) // budget 10
    expect(r.limited).toBe(true)
    expect(r.retryAfter).toBeGreaterThan(0)
    expect(r.retryAfter).toBeLessThanOrEqual(WINDOW_SEC)
  })

  it('no DB bound → fails open (dev)', async () => {
    const r = await checkRateLimit({}, reqWithIp('1.1.1.1'), 'audit', 1_000_000)
    expect(r.limited).toBe(false)
  })

  it('DB error → fails open (never lock everyone out)', async () => {
    const env = { DB: { prepare: () => ({ bind: () => ({ first: async () => { throw new Error('d1 down') } }) }) } }
    const r = await checkRateLimit(env, reqWithIp('1.1.1.1'), 'chat', 1_000_000)
    expect(r.limited).toBe(false)
  })
})

describe('rateLimitedResponse', () => {
  it('JSON variant: 429 + Retry-After + safe body', async () => {
    const res = rateLimitedResponse({ retryAfter: 30 })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('30')
    expect(await res.json()).toEqual({ error: 'rate_limited', retryAfter: 30 })
  })

  it('SSE variant: 429 stream ending in [DONE]', async () => {
    const res = rateLimitedResponse({ retryAfter: 12, sse: true })
    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('12')
    const text = await res.text()
    expect(text).toContain('Rate limit reached')
    expect(text.endsWith('data: [DONE]\n\n')).toBe(true)
  })
})
