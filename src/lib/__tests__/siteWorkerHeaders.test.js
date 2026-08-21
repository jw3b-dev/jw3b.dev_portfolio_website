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

  it('sends HSTS, and keeps the max-age on the deliberate short ramp', async () => {
    // A DAST pass on the live site found transport security missing entirely. It ships ramped:
    // HSTS is cached by the browser, so a long max-age is a commitment you cannot redeploy away.
    // This asserts BOTH that it is present and that it has not been quietly jumped to a year
    // without the subdomain check that a year deserves.
    const h = await headersOf('https://jw3b.dev/', 'text/html; charset=utf-8')
    const hsts = h.get('strict-transport-security')
    expect(hsts).toMatch(/^max-age=\d+/)
    expect(Number(hsts.match(/max-age=(\d+)/)[1])).toBeLessThanOrEqual(86400)
    expect(hsts).not.toContain('preload') // irreversible — never without an explicit decision
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

  it('permits WASM instantiation (voiceLive/XMTP) but never JS eval, and needs no HF hosts', async () => {
    const csp = (await headersOf('https://jw3b.dev/', 'text/html')).get('content-security-policy')
    expect(csp).toContain("'wasm-unsafe-eval'") // on-device Whisper + XMTP wasm (self-hosted binaries)
    expect(csp).not.toMatch(/(?<!wasm-)unsafe-eval/) // JS eval stays blocked
    // Whisper model files come SAME-ORIGIN via the /hf-models/* mirror — no third-party model host.
    expect(csp).not.toContain('huggingface')
    expect(csp).not.toContain('hf.co')
  })

  describe('/hf-models/* same-origin model mirror (voiceLive)', () => {
    const ctx = { waitUntil: () => {} }
    it('rejects non-GET', async () => {
      const res = await siteWorker.fetch(
        new Request('https://jw3b.dev/hf-models/onnx-community/whisper-base/resolve/main/config.json', { method: 'POST' }),
        envReturning('text/html'),
        ctx,
      )
      expect(res.status).toBe(405)
    })
    it('404s any repo outside the allow-list (never an open proxy)', async () => {
      const res = await siteWorker.fetch(
        new Request('https://jw3b.dev/hf-models/evil/exfil/resolve/main/x.bin'),
        envReturning('text/html'),
        ctx,
      )
      expect(res.status).toBe(404)
    })
    it('mirrors an allow-listed file from HF with immutable caching (edge-cache miss path)', async () => {
      const calls = []
      const realFetch = globalThis.fetch
      const realCaches = globalThis.caches
      globalThis.caches = { default: { match: async () => undefined, put: async () => {} } }
      globalThis.fetch = async (input) => {
        calls.push(String(input))
        return new Response('{"model_type":"whisper"}', { status: 200, headers: { 'content-type': 'application/json' } })
      }
      try {
        const res = await siteWorker.fetch(
          new Request('https://jw3b.dev/hf-models/onnx-community/whisper-base/resolve/main/config.json'),
          envReturning('text/html'),
          ctx,
        )
        expect(res.status).toBe(200)
        expect(calls[0]).toBe('https://huggingface.co/onnx-community/whisper-base/resolve/main/config.json')
        expect(res.headers.get('cache-control')).toBe('public, max-age=31536000, immutable')
        expect(await res.text()).toContain('whisper')
      } finally {
        globalThis.fetch = realFetch
        globalThis.caches = realCaches
      }
    })
    it('502s when the upstream fails (never a mislabelled success)', async () => {
      const realFetch = globalThis.fetch
      const realCaches = globalThis.caches
      globalThis.caches = { default: { match: async () => undefined, put: async () => {} } }
      globalThis.fetch = async () => new Response('nope', { status: 403 })
      try {
        const res = await siteWorker.fetch(
          new Request('https://jw3b.dev/hf-models/onnx-community/whisper-base/resolve/main/config.json'),
          envReturning('text/html'),
          ctx,
        )
        expect(res.status).toBe(502)
      } finally {
        globalThis.fetch = realFetch
        globalThis.caches = realCaches
      }
    })
  })
})

describe('missing /assets/* must 404, never the SPA shell (P5 audit fix)', () => {
  // SPA fallback rewrites unmatched paths to index.html with a 200. For a hashed chunk that
  // hands the browser HTML where a JS module was expected — "Failed to fetch dynamically
  // imported module" — disguising a 404 as success so nothing can handle it.
  const htmlFallback = () =>
    new Response('<!doctype html><html lang="en"></html>', {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })

  it('returns a real 404 when an asset request falls through to the HTML shell', async () => {
    const env = { ASSETS: { fetch: async () => htmlFallback() } }
    const res = await siteWorker.fetch(new Request('https://jw3b.dev/assets/Work-OLDHASH.js'), env)
    expect(res.status).toBe(404)
    expect(res.headers.get('content-type')).toMatch(/text\/plain/)
    expect(res.headers.get('content-type')).not.toMatch(/text\/html/)
  })

  it('keeps the security headers on that 404 and never caches it', async () => {
    const env = { ASSETS: { fetch: async () => htmlFallback() } }
    const res = await siteWorker.fetch(new Request('https://jw3b.dev/assets/gone-XYZ.js'), env)
    expect(res.headers.get('content-security-policy')).toBeTruthy()
    expect(res.headers.get('cache-control')).toMatch(/no-store/)
  })

  it('still serves a real asset untouched, with the immutable cache header', async () => {
    const env = {
      ASSETS: {
        fetch: async () =>
          new Response('export default 1', { status: 200, headers: { 'content-type': 'text/javascript' } }),
      },
    }
    const res = await siteWorker.fetch(new Request('https://jw3b.dev/assets/index-REAL.js'), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toMatch(/immutable/)
  })

  it('does NOT 404 a normal route — the SPA fallback still works off /assets/', async () => {
    const env = { ASSETS: { fetch: async () => htmlFallback() } }
    const res = await siteWorker.fetch(new Request('https://jw3b.dev/work'), env)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toMatch(/text\/html/)
  })
})
