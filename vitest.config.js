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
