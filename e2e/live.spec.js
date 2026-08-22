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

test('the LIVE concierge answers IN the chat and never navigates on its own', async ({ page }) => {
  // P0 findings #4 and #6: the tool-call fired on informational questions, auto-navigated, and
  // closed the chat — so the visitor's answer was destroyed before they could read it. Mocked
  // tests cannot catch this; it is a property of what the deployed model decides to emit.
  await page.goto('/')
  const startUrl = page.url()
  await page.getByRole('button', { name: /open concierge chat/i }).click()
  const dialog = page.getByRole('dialog', { name: /ai concierge/i })

  await dialog.getByRole('textbox').fill('What is on the audit page?')
  await dialog.getByRole('button', { name: /^send$/i }).click()

  await expect
    .poll(async () => ((await dialog.textContent()) || '').length, { timeout: 60_000 })
    .toBeGreaterThan(200) // something substantive arrived

  // The three things that must all still be true after an INFORMATIONAL question.
  await expect(dialog).toBeVisible() // the chat did not close
  expect(page.url(), 'an informational question must not navigate').toBe(startUrl)
  await expect(dialog.getByRole('button', { name: /Open Mission Control/i })).toHaveCount(0)
})

test('the LIVE concierge describes THIS site truthfully, not plausibly', async ({ page }) => {
  // P0 finding #5: asked what the audit page did, the concierge invented a description. The KB
  // now carries the real one. This asserts a fact only the KB supplies — the metering figure —
  // so a fabricated-but-fluent answer fails where a "did it reply?" check passes.
  await page.goto('/')
  await page.getByRole('button', { name: /open concierge chat/i }).click()
  const dialog = page.getByRole('dialog', { name: /ai concierge/i })

  await dialog.getByRole('textbox').fill('How many AI analyses can I run per session on the audit page?')
  await dialog.getByRole('button', { name: /^send$/i }).click()

  await expect
    .poll(async () => (await dialog.textContent()) || '', { timeout: 60_000 })
    // "10" or "ten" — the figure, however the model words it. Anything else is invention.
    .toMatch(/\b(10|ten)\b/i)
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
