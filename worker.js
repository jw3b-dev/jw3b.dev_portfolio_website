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
// blocked). The Whisper model weights stream from Hugging Face (huggingface.co redirects
// weight downloads to its CDN hosts under *.hf.co), hence the hf hosts in connect-src —
// fetched lazily only when a visitor starts a live-voice call, then cached on-device.
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
  "connect-src 'self' https://portfolio-agent.agilegypsy.workers.dev https://portfolio-agent-v2.agilegypsy.workers.dev https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.org https://explorer-api.walletconnect.com https://*.web3modal.org https://*.reown.com https://mainnet.base.org https://sepolia.base.org https://*.base.org https://cloudflare-eth.com https://paywall.unlock-protocol.com https://rpc.unlock-protocol.com",
  'frame-src \'self\' https://paywall.unlock-protocol.com https://app.unlock-protocol.com https://kthulhu.co https://kointel.co.za',
].join('; ')

const SECURITY_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(self), geolocation=(), payment=()',
  'content-security-policy': CSP,
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const res = await env.ASSETS.fetch(request)
    const out = new Response(res.body, res)

    for (const [k, v] of Object.entries(SECURITY_HEADERS)) out.headers.set(k, v)
    out.headers.set('x-served-by', 'jw3b-dev-site-worker')

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
