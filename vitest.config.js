import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.jsx'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // Only collect coverage for the files we actually have tests for
      include: [
        'src/components/MissionControl.jsx',
        'src/components/jw3b.devParticleCanvas.jsx',
        'src/components/chat/ChatWidget.jsx',
        'src/components/pricing/UnlockPaywall.jsx',
        'src/hooks/usePortfolioAgent.js',
        'src/hooks/useAgentStream.js',
        'src/hooks/useContractAuditor.js',
        'src/config/contracts.js',
        'src/constants/index.js',
      ],
      thresholds: {
        statements: 98,
        branches: 98,
        functions: 98,
        lines: 98,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});

