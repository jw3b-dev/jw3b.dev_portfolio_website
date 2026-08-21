/*
 * Journeys — what a visitor actually does. Each test here maps to a defect that reached
 * production because only jsdom unit tests existed.
 */
import { test, expect } from '@playwright/test'

const ROUTES = ['/', '/work', '/audit', '/ctf', '/hire-me', '/messages', '/privacy', '/thesis/systems-are-graphs', '/thesis/zero-trust-validator']

test.describe('every route renders in a real browser without console errors', () => {
  for (const route of ROUTES) {
    test(`${route} loads clean`, async ({ page }) => {
      const errors = []
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
      page.on('pageerror', (e) => errors.push(String(e)))

      // NOT networkidle: the wallet SDK holds long-lived connections, so idle never arrives
      // and the test times out rather than testing anything.
      await page.goto(route, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('load')
      await page.waitForTimeout(1500) // let lazy route chunks resolve

      // The developer error screen must never reach a visitor.
      await expect(page.locator('body')).not.toContainText('Unexpected Application Error')
      await expect(page.locator('body')).not.toContainText('Hey developer')
      // Real content, not an empty shell.
      await expect(page.locator('main')).not.toBeEmpty()

      // Separate OUR failures from noise we neither ship nor control:
      //  - wallet SDK chatter (WalletConnect/Reown/Coinbase)
      //  - Cloudflare's own bot-detection script, which the zone INJECTS inline and our strict
      //    CSP then blocks (tracked in docs/DEFERRED.md — the fix is a zone setting, not code;
      //    weakening script-src to 'unsafe-inline' to silence it would be strictly worse)
      //  - third-party analytics injected by the flagship iframes' own origins
      const NOISE =
        /walletconnect|reown|coinbase|Failed to load resource|cdn-cgi\/challenge-platform|__CF\$cv\$params|cloudflareinsights|googletagmanager|gtag|Executing inline script violates/i
      const ours = errors.filter((e) => !NOISE.test(e))
      expect(ours, `console errors on ${route}:\n${ours.join('\n')}`).toEqual([])
    })
  }
})

test('the audit console exposes all three tools, and each one actually mounts', async ({ page }) => {
  // Regression: FuzzTool + TxExplainer shipped mounted on no page.
  await page.goto('/audit')
  const tabs = page.getByRole('tab')
  await expect(tabs).toHaveCount(3)
  for (const name of [/screen a contract/i, /fuzz harness/i, /explain a transaction/i]) {
    await tabs.filter({ hasText: name }).click()
    await expect(page.getByRole('tabpanel').filter({ has: page.locator(':visible') }).first()).toBeVisible()
  }
})

test('a captured failure replays into an EDITABLE console', async ({ page }) => {
  await page.goto('/audit?case=audit-heuristic-blindspot')
  const box = page.locator('textarea').first()
  await expect(box).toBeVisible()
  await expect(box).toContainText('contract Treasury')
  await expect(box).toBeEditable()
})
