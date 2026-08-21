/*
 * Playwright — the layer the suite was missing.
 *
 * Every one of the 570 vitest tests runs in jsdom: no layout engine, no real network, no
 * bundler output. That is structurally incapable of catching the defects that actually
 * shipped — a fixed button overlapping a footer link, a stale chunk served as HTML, a
 * finished tool mounted on no page. These specs run the REAL build in a REAL browser.
 *
 * Target: the locally previewed production build by default, or a deployed URL via E2E_BASE_URL
 * (so the same specs double as a post-deploy smoke against jw3b.dev).
 */
import { defineConfig, devices } from '@playwright/test'

const BASE = process.env.E2E_BASE_URL || 'http://localhost:4173'

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: BASE, trace: 'on-first-retry' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Only boot a local preview when we're not pointed at a deployed origin.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: 'npm run preview -- --port 4173 --strictPort',
        url: BASE,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
