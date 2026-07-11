import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// import { nodePolyfills } from 'vite-plugin-node-polyfills' // re-enable if manual polyfills prove insufficient

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // nodePolyfills({
    //   globals: {
    //     Buffer: true,
    //     global: true,
    //     process: false, // 🚨 Avoid buggy esbuild virtual-process-polyfill.js
    //   },
    // }),
  ],
  optimizeDeps: {
    entries: ['index.html'], // 🚨 Avoid scanning legacy HTML folders crashing scanner
  },
  define: {
    global: 'globalThis',
    'process.env': '{}', // 🛠️ Manual safe mock
  },
  resolve: {
    alias: {
      // 🚨 Fix for readable-stream require('string_decoder/') trailing slash crash
      'string_decoder/': 'string_decoder',
    }
  }
})
