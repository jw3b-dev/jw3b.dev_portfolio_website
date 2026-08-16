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
      // Coverage include-list + thresholds are intentionally NOT set yet. The CI
      // coverage gate (P0-12) wires thresholds against a scoped include-list once
      // feature files with tests exist — enforcing one now would gate on files
      // that do not exist.
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, './src') },
  },
})
