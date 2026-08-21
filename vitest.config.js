/*
 * Vitest — the test half of the quality gate (unit + component, jsdom).
 * NOTE: test config lives HERE, not in vite.config.js, so the app build and the test run
 * can diverge safely.
 *
 * The coverage thresholds are intentionally strict but SCOPED: they apply to an
 * include-list of pure logic modules in src/lib/ (audit heuristics, checkout routing, the
 * voice state machine, VAD maths) — the code where a silent regression would be most
 * expensive and where a DOM adds nothing. Adding a file to that list means committing to
 * covering it, so the gate stays meaningful rather than becoming a number to game.
 */
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    // Multi-step jsdom interaction tests (e.g. the Mission Control wizard walk) can exceed
    // the 5s default when the suite runs wide under coverage — parallel-load starvation, not
    // a code fault (they pass in isolation). A real assertion still fails fast; this only
    // stops slow-under-load async tests from flaking the gate.
    testTimeout: 15000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // CI coverage gate (P0-12). Scoped to the pure-logic modules that are
      // exhaustively unit-tested — 100% lines + functions on each. This grows as
      // feature files land WITH their tests; a file is added to `include` only once
      // its tests hold the line. Gating the whole tree now would gate on files that
      // have no tests yet (CLAUDE.md: high thresholds, deliberately short include-list).
      include: [
        'src/lib/tagProtocol.js',
        'src/lib/claimsValidate.js',
        'src/lib/replay.js',
        'src/lib/knowledgeBase.js',
        'src/lib/conciergeClient.js',
        'src/lib/auditClient.js',
        'src/lib/motion.js',
        'src/lib/loadout.js',
        'src/lib/engagementQueue.js',
        'src/lib/markdown.js',
        'src/lib/web3Guards.js',
        'src/lib/escrowFlow.js',
        'src/lib/unlockPaywall.js',
        'src/lib/checkoutRouting.js',
        'src/lib/ctfFlow.js',
        'src/lib/overmindPipeline.js',
        'src/lib/fuzzHarness.js',
        'src/lib/txDecode.js',
        'src/lib/xmtpFlow.js',
        'src/lib/voiceSession.js',
        'src/lib/micTurn.js',
      ],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 85,
        statements: 90,
      },
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
