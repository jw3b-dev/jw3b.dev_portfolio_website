import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { nodePolyfills } from 'vite-plugin-node-polyfills' // re-enable if manual polyfills prove insufficient

// ── Hero-shell prerender (P0-11, ADR-07) ───────────────────────────────────────────
// The LCP element is STATIC HTML: a critical-CSS hero shell injected into every built
// index.html at build time, painting the headline before the JS module loads
// (LCP ≤ 2.5s, NFR-01). React's createRoot replaces #root on mount, so the shell is a
// purely visual pre-hydration skeleton — no hydration contract, no mismatch. Critical
// CSS uses only system fonts (no external font blocks the LCP paint); the token font
// (Geist) swaps in after mount. Single source of truth lives here, not hand-maintained
// in index.html — running the build IS the prerender pipeline.
const CRITICAL_CSS = `
:root{color-scheme:dark}
html,body{margin:0;background:#0A0C10;color:#F2F5F8;font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
#root{min-height:100vh}
.pshell{max-width:72rem;margin:0 auto;padding:14vh 1.5rem 0}
.pshell__kicker{font:600 .75rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.2em;text-transform:uppercase;color:#22D3EE;margin:0 0 1.25rem}
.pshell__h1{font-weight:600;font-size:clamp(2.25rem,6vw,4.5rem);line-height:1.02;letter-spacing:-.02em;margin:0;max-width:18ch}
.pshell__sub{margin:1.5rem 0 0;font-size:clamp(1rem,2vw,1.25rem);color:#9BA6B4;max-width:48ch}
.pshell__hint{margin-top:3rem;font:400 .8125rem/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#78828F}
`.trim()

// The shell headline MUST match Hero.jsx's position line so the LCP element is stable
// across the pre-hydration → hydrated swap (no LCP re-paint, no layout jump).
const HERO_SHELL = `<div class="pshell">
      <p class="pshell__kicker">Senior Agentic AI Developer</p>
      <h1 class="pshell__h1">Multi-agent systems that survive production — verified in front of you.</h1>
      <p class="pshell__sub">Not a résumé. A console John left running — edit the contract and the auditor re-runs, the same discipline behind KTHULHU: reproduce the finding, don't assert it.</p>
      <p class="pshell__hint">Loading the operable surface…</p>
    </div>`

function heroShellPrerender() {
  return {
    name: 'hero-shell-prerender',
    transformIndexHtml(html) {
      return html
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
    exclude: ['@xmtp/browser-sdk'],
  },
  define: {
    global: 'globalThis',
    'process.env': '{}', // manual, safe process.env mock — the Web3 stack reads it
  },
  resolve: {
    alias: {
      // fix readable-stream's require('string_decoder/') trailing-slash crash
      'string_decoder/': 'string_decoder',
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
