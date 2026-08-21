// Site Worker entry — serves the built SPA from the ASSETS binding AND owns the response
// headers. `assets.run_worker_first = true` (wrangler.jsonc) makes this run on every request,
// because Workers Static Assets does NOT honor the `_headers` file (a Pages feature). So the
// security headers (ADR-08) + cache rules (ADR-07) live here — they mirror public/_headers,
// which is kept only as documentation/intent.
//
// `not_found_handling: single-page-application` makes any unmatched path fall back to
// index.html so React Router client routes resolve.

// connect-src lists BOTH the production and preview workers (portfolio-agent + -v2), so the
// preview SPA (built to call the -v2 worker) isn't CSP-blocked. Anthropic is ABSENT — the
// browser never talks to Anthropic, only the Worker does (FR-050). frame-src allows Unlock +
// the two flagship embeds.
//
// WASM (voiceLive on-device Whisper + the XMTP SDK): the .wasm binaries are BUNDLED by Vite
// into /assets/* (self-hosted — no CDN), but instantiating any WebAssembly requires
// 'wasm-unsafe-eval' in script-src (the WASM-only directive; NOT 'unsafe-eval' — JS eval stays
// blocked). The Whisper model files are fetched SAME-ORIGIN via this worker's /hf-models/*
// proxy (see below) — so connect-src needs no Hugging Face hosts at all.
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'wasm-unsafe-eval' https://paywall.unlock-protocol.com",
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self' data:",
  "img-src 'self' data: https:",
  "worker-src 'self' blob:",
  "connect-src 'self' https://portfolio-agent.agilegypsy.workers.dev https://portfolio-agent-v2.agilegypsy.workers.dev https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://explorer-api.walletconnect.com https://*.web3modal.org https://*.reown.com https://mainnet.base.org https://sepolia.base.org https://*.base.org https://cloudflare-eth.com https://paywall.unlock-protocol.com https://rpc.unlock-protocol.com",
  'frame-src \'self\' https://paywall.unlock-protocol.com https://app.unlock-protocol.com https://kthulhu.co https://kointel.co.za',
].join('; ')

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
  'content-security-policy': CSP,
  // HSTS. A DAST pass found this absent: the site is HTTPS-only and the edge redirects, but
  // without this a visitor's FIRST request over http:// is still strippable on a hostile network.
  //
  // Deliberately starting at ONE DAY, not the usual year. HSTS is a commitment a browser caches:
  // once it has seen a long max-age it will refuse http:// for that whole period, so a mistake
  // here is not something you can simply redeploy away. The standard rollout is to ramp — ship a
  // short max-age, confirm nothing on the domain needs plain HTTP, then raise it.
  // Owner's call to raise: `max-age=31536000; includeSubDomains` (a year, all subdomains — check
  // every subdomain serves HTTPS first), plus `preload` only if submitting to the preload list,
  // which is effectively irreversible.
  'strict-transport-security': 'max-age=86400',
}

// ── On-device Whisper model proxy (voiceLive) ────────────────────────────────────────────
// The browser fetches ASR model files SAME-ORIGIN (/hf-models/<repo path>) and this worker
// streams them from Hugging Face with immutable edge caching. Same-origin sidesteps HF's
// origin policy entirely: HF 404s browser requests whose page Origin is *.workers.dev (bot
// protection) — which silently killed live voice on the preview — and pinning a visitor
// feature to a third party's origin policy is fragile even where it happens to work. The
// server-side fetch carries no Origin, so it always resolves. STRICT allow-list — this is a
// model mirror for the repos we ship, never an open proxy.
export const HF_MODEL_PREFIX = '/hf-models/'
// whisper-base = WebGPU path; whisper-tiny = the WASM floor (smaller + faster on CPU).
export const HF_ALLOWED_REPOS = ['onnx-community/whisper-base/', 'onnx-community/whisper-tiny/']

async function proxyModelFile(request, url, ctx) {
  if (request.method !== 'GET') return new Response('method not allowed', { status: 405 })
  const rest = url.pathname.slice(HF_MODEL_PREFIX.length)
  if (!HF_ALLOWED_REPOS.some((p) => rest.startsWith(p))) return new Response('not found', { status: 404 })

  // Model files are revision-addressed and immutable → cache hard at the edge (per-PoP) so
  // Hugging Face is hit ~once per file per PoP, and visitors get Cloudflare-local latency.
  const cache = caches.default
  const cacheKey = new Request(url.toString())
  const hit = await cache.match(cacheKey)
  if (hit) return hit

  const upstream = await fetch(`https://huggingface.co/${rest}${url.search}`, { redirect: 'follow' })
  if (!upstream.ok) return new Response('model upstream unavailable', { status: 502 })
  const out = new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
      'cache-control': 'public, max-age=31536000, immutable',
    },
  })
  ctx.waitUntil(cache.put(cacheKey, out.clone()))
  return out
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname.startsWith(HF_MODEL_PREFIX)) return proxyModelFile(request, url, ctx)
    const res = await env.ASSETS.fetch(request)
    const out = new Response(res.body, res)

    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v)
    out.headers.set('x-served-by', 'jw3b-dev-site-worker')

    // A missing /assets/* file must 404 — never fall through to the SPA shell.
    //
    // `not_found_handling: single-page-application` rewrites ANY unmatched path to index.html
    // with a 200. For a hashed chunk that is actively harmful: a visitor whose tab predates a
    // deploy lazy-loads a chunk whose hash no longer exists, receives an HTML document with
    // `content-type: text/html`, and the browser fails parsing it as a module —
    // "Failed to fetch dynamically imported module". The real 404 was disguised as success,
    // so nothing could detect or handle it. Owner-reported on /work, /audit and /messages.
    //
    // Assets are content-hashed, so an /assets/* request can only be a hit or a genuine miss;
    // returning HTML is never correct. The client's error boundary turns this honest 404 into
    // a "new version shipped — reload" prompt.
    if (url.pathname.startsWith('/assets/') && (out.headers.get('content-type') || '').includes('text/html')) {
      return new Response('Not found', {
        status: 404,
        headers: { ...SECURITY_HEADERS, 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' },
      })
    }

    // Caching (ADR-07 stale-shell rule): content-hashed /assets/* are immutable and cached
    // forever; the SPA shell (HTML) must NEVER be cached, or a deploy strands visitors on a
    // stale index.html pointing at deleted hashed chunks.
    if (url.pathname.startsWith('/assets/')) {
      out.headers.set('cache-control', 'public, max-age=31536000, immutable')
    } else if ((out.headers.get('content-type') || '').includes('text/html')) {
      out.headers.set('cache-control', 'no-store, must-revalidate')
    }
    return out
  },
}
