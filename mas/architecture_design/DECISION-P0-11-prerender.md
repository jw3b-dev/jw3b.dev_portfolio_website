# Decision record — P0-11 hero-shell prerender (realizes ADR-07)

**Context:** ADR-07 mandates the LCP element be prerendered DOM/CSS (never image, never
JS-gated), LCP ≤ 2.5s on mid-tier mobile, with Web3/R3F hydrating after first paint.

**Alternatives considered:**
1. **Full React SSG** (`vite-react-ssg` / `react-dom/server` prerender). Rejected: the app
   imports the Web3 stack (Buffer/`global` polyfills, wagmi) at module load — server-rendering
   it at build risks polyfill/`window` failures and drags heavy libs into a build step whose
   only job is to paint one headline. Overkill for a single static above-the-fold.
2. **Static screenshot / image hero.** Rejected outright by ADR-07 and brief 01 (LCP must be
   real text, never an image) — an image LCP also can't be the operable console.
3. **Static HTML shell injected at build (`transformIndexHtml` plugin).** CHOSEN. A tiny
   in-repo plugin injects a critical-CSS hero shell (system fonts, no external blocking) into
   `dist/index.html`; `createRoot` replaces `#root` on mount, so the shell is a pure
   pre-hydration skeleton with no hydration contract or mismatch risk. Zero new deps, the
   build step *is* the pipeline, and the shell headline is kept identical to `Hero.jsx`'s
   position line so the LCP element is stable across the swap.

**Consequence:** LCP text ships in the HTML; Web3 is code-split (`manualChunks`) into a
non-LCP chunk. Follow-up (P1): lazy-load the wallet providers so the web3 chunk leaves the
initial request entirely. Build stays warning-clean via a documented `chunkSizeWarningLimit`
above the (code-split, off-LCP) web3 vendor chunk.
