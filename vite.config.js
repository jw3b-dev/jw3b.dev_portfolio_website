import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { nodePolyfills } from 'vite-plugin-node-polyfills' // re-enable if manual polyfills prove insufficient

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // nodePolyfills({ globals: { Buffer: true, global: true, process: false } }),
  ],
  optimizeDeps: {
    entries: ['index.html'], // avoid scanning stray HTML folders that crash the dep scanner
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
    rollupOptions: {
      output: {
        // Placeholder manual-chunk split (P0-01). Keeps the heavy Web3 libs — and
        // R3F once it is added — out of the app/vendor chunk so they cache
        // independently. P0-11 refines this alongside the hero-prerender + LCP work.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (
            id.includes('/wagmi/') ||
            id.includes('/viem/') ||
            id.includes('/@rainbow-me/') ||
            id.includes('/@walletconnect/') ||
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
