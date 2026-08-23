import { describe, it, expect } from 'vitest'
import worker, { makeNonce, nonceCsp } from '../../worker.js'

/*
 * The site worker's CSP nonce.
 *
 * Cloudflare's Bot Fight Mode injects a JavaScript-Detections inline script into every HTML page
 * and it CANNOT be disabled while Bot Fight Mode is on. Their documented remedy is a nonce, which
 * they copy onto their injected script by parsing our CSP header. So we publish a nonce we never
 * use ourselves (every script we ship is external, covered by 'self') purely so theirs can be
 * signed — keeping both the bot protection and a CSP with no 'unsafe-inline'.
 *
 * The dangerous half is WHERE the nonce goes. On a cached response every visitor shares one
 * forever, which is worse than having none at all.
 */
const csp = (res) => res.headers.get('content-security-policy')
const scriptSrc = (res) => csp(res).split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src'))

const run = (contentType, path = '/') =>
  worker.fetch(
    new Request(`https://jw3b.dev${path}`),
    { ASSETS: { fetch: async () => new Response('<!doctype html>', { headers: { 'content-type': contentType } }) } },
    { waitUntil: () => {} },
  )

describe('makeNonce', () => {
  it('is 128 bits of randomness, fresh every call', () => {
    const seen = new Set(Array.from({ length: 200 }, () => makeNonce()))
    expect(seen.size).toBe(200)
    expect(atob([...seen][0]).length).toBe(16)
  })
})

describe('nonceCsp', () => {
  it('substitutes the placeholder', () => {
    expect(nonceCsp("script-src 'self' 'nonce-__NONCE__' 'wasm-unsafe-eval'", 'ABC'))
      .toBe("script-src 'self' 'nonce-ABC' 'wasm-unsafe-eval'")
  })

  it('REMOVES the token when there is no nonce — never ships a literal __NONCE__', () => {
    // A literal placeholder is a valid-looking nonce nobody can match: noise that reads as a
    // control while protecting nothing.
    const out = nonceCsp("script-src 'self' 'nonce-__NONCE__' 'wasm-unsafe-eval'", null)
    expect(out).toBe("script-src 'self' 'wasm-unsafe-eval'")
    expect(out).not.toContain('__NONCE__')
    expect(out).not.toContain('nonce-')
  })
})

describe('the served headers', () => {
  it('gives an HTML response a nonce', async () => {
    const s = scriptSrc(await run('text/html; charset=utf-8'))
    expect(s).toMatch(/'nonce-[A-Za-z0-9+/=]{20,}'/)
    expect(s).toContain("'self'")
  })

  it('gives every HTML response a DIFFERENT nonce', async () => {
    const a = scriptSrc(await run('text/html; charset=utf-8'))
    const b = scriptSrc(await run('text/html; charset=utf-8'))
    expect(a).not.toBe(b)
  })

  it('gives a cached ASSET no nonce at all — the whole safety argument', async () => {
    // /assets/* is immutable for a year. A nonce in that cached header would be shared by every
    // visitor forever. If this ever fails, the nonce must be removed, not the test.
    const res = await run('application/javascript', '/assets/app-abc123.js')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(scriptSrc(res)).not.toContain('nonce')
  })

  it('keeps the HTML shell uncacheable — the precondition the nonce depends on', async () => {
    const res = await run('text/html; charset=utf-8')
    expect(res.headers.get('cache-control')).toContain('no-store')
  })

  it('never ships the placeholder on any response', async () => {
    for (const ct of ['text/html; charset=utf-8', 'application/javascript', 'text/css']) {
      expect(csp(await run(ct))).not.toContain('__NONCE__')
    }
  })

  it('still refuses to serve HTML for a missing hashed asset, with a clean CSP', async () => {
    const res = await run('text/html; charset=utf-8', '/assets/gone-deadbeef.js')
    expect(res.status).toBe(404)
    expect(csp(res)).not.toContain('__NONCE__')
    expect(csp(res)).not.toContain('nonce-')
  })

  it('does not weaken the policy: no unsafe-inline in script-src, ever', async () => {
    for (const ct of ['text/html; charset=utf-8', 'application/javascript']) {
      expect(scriptSrc(await run(ct))).not.toContain('unsafe-inline')
    }
  })
})
