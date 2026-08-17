import { describe, it, expect } from 'vitest'
import siteWorker from '../../../worker.js'

/*
 * GAP-01 regression guard: the site worker (worker.js) OWNS the security headers + cache rules,
 * because Workers Static Assets does not honor `_headers`. This asserts the worker's header LOGIC
 * on every response class. (The deploy-level guard — that run_worker_first actually invokes the
 * worker on / and /assets/* — is the RUNBOOK's `curl -sSI /` check + the wrangler>=4 pin in CI;
 * this test guards the code that CI/deploy relies on running.)
 */

// Minimal env whose ASSETS binding returns a Response with the given content-type.
const envReturning = (contentType, body = 'x') => ({
  ASSETS: { fetch: async () => new Response(body, { headers: { 'content-type': contentType } }) },
})

const headersOf = async (url, contentType) =>
  (await siteWorker.fetch(new Request(url), envReturning(contentType))).headers

describe('site worker headers (GAP-01 guard)', () => {
  it('sets the full CSP + security headers on the HTML shell, with no-store', async () => {
    const h = await headersOf('https://jw3b.dev/', 'text/html; charset=utf-8')
    expect(h.get('content-security-policy')).toContain("default-src 'self'")
    expect(h.get('content-security-policy')).toContain('frame-ancestors')
    expect(h.get('x-content-type-options')).toBe('nosniff')
    expect(h.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
    expect(h.get('permissions-policy')).toContain('microphone=(self)')
    expect(h.get('x-served-by')).toBe('jw3b-dev-site-worker')
    expect(h.get('cache-control')).toBe('no-store, must-revalidate')
  })

  it('caches hashed /assets/* immutably (and still stamps the CSP)', async () => {
    const h = await headersOf('https://jw3b.dev/assets/index-abcd1234.js', 'application/javascript')
    expect(h.get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(h.get('content-security-policy')).toContain("default-src 'self'")
    expect(h.get('x-served-by')).toBe('jw3b-dev-site-worker')
  })

  it('allows the two flagship embeds + Unlock in frame-src, and never Anthropic in connect-src', async () => {
    const csp = (await headersOf('https://jw3b.dev/', 'text/html')).get('content-security-policy')
    expect(csp).toContain('https://kthulhu.co')
    expect(csp).toContain('https://kointel.co.za')
    expect(csp).toContain('paywall.unlock-protocol.com')
    expect(csp).not.toContain('anthropic') // the browser never talks to Anthropic (FR-050)
  })

  it('permits WASM instantiation + HF model fetches (voiceLive/XMTP), but never JS eval', async () => {
    const csp = (await headersOf('https://jw3b.dev/', 'text/html')).get('content-security-policy')
    expect(csp).toContain("'wasm-unsafe-eval'") // on-device Whisper + XMTP wasm (self-hosted binaries)
    expect(csp).toContain('https://huggingface.co') // Whisper model weights (lazy, cached on-device)
    expect(csp).toContain('https://*.hf.co') // HF weight-download CDN redirect hosts
    expect(csp).not.toMatch(/(?<!wasm-)unsafe-eval/) // JS eval stays blocked
  })
})
