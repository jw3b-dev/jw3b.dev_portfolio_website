/*
 * Vite — the production build for the React 19 SPA.
 *
 * Three things here are load-bearing rather than boilerplate:
 *   1. The hero-shell prerender (below) injects critical CSS + static hero HTML into
 *      index.html at build time, so the largest element paints before any JS executes.
 *   2. manualChunks splits the heavy vendors (wallet stack, XMTP, the on-device ASR
 *      runtime) into separately-cacheable chunks off the boot path.
 *   3. The modulepreload strip stops Vite eagerly fetching those chunks on first paint.
 * See the comments at each for the measurements behind them.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
// import { nodePolyfills } from 'vite-plugin-node-polyfills' // re-enable if manual polyfills prove insufficient

// ── Hero-shell prerender (P0-11, ADR-07) ───────────────────────────────────────────
// The LCP element is STATIC HTML: a critical-CSS hero shell injected into every built
// index.html at build time, painting the headline before the JS module loads
// (LCP ≤ 2.5s, NFR-01). React's createRoot replaces #root on mount, so the shell is a
// purely visual pre-hydration skeleton — no hydration contract, no mismatch. Critical
// CSS uses only system fonts (no external font blocks the LCP paint); the token font
// (Geist) swaps in after mount. Single source of truth lives here, not hand-maintained
// in index.html — running the build IS the prerender pipeline.
// Geometry MIRRORS the real Hero (src/components/hero/Hero.jsx) so the shell→React swap causes
// no layout shift (CLS ≤ 0.1, NFR-01). The real H1 sits inside <main class="pt-14"> with an
// inner grid at pt-[12vh] → its top is calc(3.5rem + 12vh); the section is px-5 sm:px-8, the
// grid max-w-6xl (72rem). The kicker/H1/sub font clamps, line-heights, margins and max-widths
// below are copied from the real hero's zone-1 classes — mismatches here MOVE the LCP element.
const CRITICAL_CSS = `
:root{color-scheme:dark}
html{scrollbar-gutter:stable}
html,body{margin:0;background:#0A0C10;color:#F2F5F8;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
#root{min-height:100vh}
.pshell{max-width:72rem;margin:0 auto;padding:calc(3.5rem + 12vh) 1.25rem 0}
@media(min-width:640px){.pshell{padding-left:2rem;padding-right:2rem}}
.pshell__kicker{font:600 11px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase;color:#22D3EE;margin:0}
.pshell__h1{font-weight:600;font-size:clamp(2.25rem,6vw,4rem);line-height:1.03;letter-spacing:-.025em;text-wrap:balance;margin:1rem 0 0;max-width:20ch}
.pshell__sub{margin:1rem 0 0;font-size:clamp(1rem,2vw,1.15rem);line-height:1.625;color:#9BA6B4;max-width:52ch}
.pshell__hint{margin-top:2rem;font:400 .8125rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#78828F}
`.trim()

// The shell headline MUST match Hero.jsx's position line so the LCP element is stable
// across the pre-hydration → hydrated swap (no LCP re-paint, no layout jump).
const HERO_SHELL = `<div class="pshell">
      <p class="pshell__kicker">Senior Agentic AI Developer</p>
      <h1 class="pshell__h1">Multi-agent systems that survive production — verified in front of you.</h1>
      <p class="pshell__sub">Not a résumé. A console John left running. Edit the contract below and the auditor re-runs — the same discipline behind KTHULHU: reproduce the finding, don&rsquo;t assert it.</p>
      <p class="pshell__hint">Loading the operable surface…</p>
    </div>`

// Heavy vendor chunks that must NOT be eagerly modulepreloaded on boot. Vite auto-injects
// <link rel="modulepreload"> for the entry's heavy deps; that FETCHES megabytes before the
// static hero shell's job is done. `transformers` is dynamic-only (live-voice — most visitors
// never start a call), and the wallet stack loads after the shell paints (LCP is served by the
// prerendered shell, measured ~0.65s). Stripping the preload hints keeps the chunks code-split
// and available on demand; it just stops them racing the app chunk on first paint.
const NO_PRELOAD = ['transformers-', 'web3-', 'metamask-', 'walletconnect-', 'xmtp-']

function heroShellPrerender() {
  return {
    name: 'hero-shell-prerender',
    transformIndexHtml(html) {
      return html
        .replace(
          /\n?\s*<link rel="modulepreload"[^>]*href="\/assets\/([^"]+)"[^>]*>/g,
          (m, file) => (NO_PRELOAD.some((p) => file.startsWith(p)) ? '' : m),
        )
        .replace('</head>', `  <style id="critical-shell">${CRITICAL_CSS}</style>\n</head>`)
        .replace('<div id="root"></div>', `<div id="root">${HERO_SHELL}</div>`)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    heroShellPrerender(),
    // nodePolyfills({ globals: { Buffer: true, global: true, process: false } }),
  ],
  optimizeDeps: {
    entries: ['index.html'], // avoid scanning stray HTML folders that crash the dep scanner
    // @xmtp/browser-sdk ships WASM (@xmtp/wasm-bindings); don't pre-bundle it — let it load as its
    // own async chunk when the /messages channel mounts (P3-01: lazy-imported + flag-gated).
    // @huggingface/transformers (on-device Whisper) is heavy + WASM/WebGPU — same treatment (voiceLive).
    exclude: ['@xmtp/browser-sdk', '@huggingface/transformers'],
  },
  define: {
    global: 'globalThis',
    'process.env': '{}', // manual, safe process.env mock — the Web3 stack reads it
  },
  resolve: {
    alias: {
      // fix readable-stream's require('string_decoder/') trailing-slash crash
      'string_decoder/': 'string_decoder',
      // @huggingface/transformers lists onnxruntime-node + sharp (Node-only) as deps; stub them out
      // of the browser bundle — the browser path uses onnxruntime-web (WASM/WebGPU), not these.
      'onnxruntime-node': fileURLToPath(new URL('./src/lib/empty.js', import.meta.url)),
      sharp: fileURLToPath(new URL('./src/lib/empty.js', import.meta.url)),
    },
  },
  build: {
    // The web3 vendor chunk (wagmi/viem/RainbowKit/WalletConnect) is unavoidably large
    // but is code-split into its own file and sits OFF the LCP path (the static hero
    // shell paints first; wallet UI hydrates after). Raising the advisory limit past it
    // keeps the build warning-clean for the deploy gate (0 warnings) without hiding a
    // real regression — the split boundary in manualChunks is what actually bounds it.
    target: 'esnext', // @xmtp/browser-sdk's WASM glue uses top-level await (P3-01)
    chunkSizeWarningLimit: 3100,
    rollupOptions: {
      output: {
        // Code-split the heavy Web3 libs — and R3F if it is ever added — out of the
        // app/vendor chunk so the initial load stays light and they cache
        // independently (ADR-07). The static hero shell paints regardless of these.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('/@xmtp/')) return 'xmtp' // WASM E2E messaging SDK (P3-01) — lazy + code-split
          if (id.includes('/@huggingface/') || id.includes('/onnxruntime-web/'))
            return 'transformers' // on-device Whisper runtime (voiceLive) — lazy + code-split
          // Split the biggest, self-contained wallet vendors into their own cacheable
          // chunks so no single chunk is monstrous (they update independently of core web3).
          if (id.includes('/@metamask/')) return 'metamask'
          if (id.includes('/@walletconnect/')) return 'walletconnect'
          if (
            id.includes('/wagmi/') ||
            id.includes('/viem/') ||
            id.includes('/@rainbow-me/') ||
            id.includes('/@tanstack/react-query/')
          ) {
            return 'web3'
          }
          if (id.includes('/three/') || id.includes('/@react-three/')) {
            return 'r3f'
          }
        },
      },
    },
  },
})
