/*
 * LIVE-ONLY smoke — runs against the DEPLOYED site (npm run e2e:prod), never in the build gate.
 *
 * These assert that real third-party-backed services actually answer. They are genuinely
 * network-dependent, so gating a merge on them would make the gate flaky and teach everyone
 * to ignore it. Instead they run post-deploy and on a schedule, where a failure means
 * "production is degraded right now" — which is exactly what you want to be told.
 */
import { test, expect } from '@playwright/test'

test.skip(!process.env.E2E_BASE_URL, 'live smoke — run with E2E_BASE_URL against a deployment')

test('the LIVE concierge returns a real answer, not the recorded fallback', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /open concierge chat/i }).click()
  const dialog = page.getByRole('dialog', { name: /ai concierge/i })
  await dialog.getByRole('textbox').fill('In one short sentence, what does John do?')
  await dialog.getByRole('button', { name: /^send$/i }).click()

  await expect(dialog.getByText(/recorded run — live agent unavailable/i)).toHaveCount(0, { timeout: 60_000 })
  await expect(dialog.locator('.bg-raised').last()).not.toHaveText('…', { timeout: 60_000 })
})

test('the LIVE audit route streams a model narrative, not just heuristics', async ({ request }) => {
  const res = await request.post('https://portfolio-agent.agilegypsy.workers.dev/audit', {
    headers: { 'Content-Type': 'application/json', Origin: 'https://jw3b.dev' },
    data: { source: 'contract T { function f() public {} }' },
    timeout: 60_000,
  })
  expect(res.status()).toBe(200)
  expect(await res.text()).toContain('data:')
})

test('LIVE security headers and cache rules are intact on the deployed origin', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  const csp = h['content-security-policy'] || ''
  expect(csp).toBeTruthy()

  // SCRIPT-src is the security-critical directive and must never gain 'unsafe-inline' — that
  // is the tempting "fix" for the Cloudflare-injected inline script, and it would gut the CSP.
  // STYLE-src legitimately carries it: the prerendered critical-CSS shell is inline by design.
  const scriptSrc = csp.split(';').map((d) => d.trim()).find((d) => d.startsWith('script-src')) || ''
  expect(scriptSrc, 'script-src must stay strict').not.toContain("'unsafe-inline'")
  expect(scriptSrc).toContain("'self'")

  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['cache-control']).toContain('no-store') // the shell must never be edge-cached
})
