/*
 * Journeys — what a visitor actually does. Each test here maps to a defect that reached
 * production because only jsdom unit tests existed.
 */
import { test, expect } from '@playwright/test'

// '/findings/50-L-01' is the published audit finding. It only exists while its markdown file
// does — the route is registered from the glob — so a route that vanishes takes its test with it.
const ROUTES = ['/', '/work', '/audit', '/ctf', '/hire-me', '/messages', '/privacy', '/thesis/systems-are-graphs', '/thesis/zero-trust-validator', '/findings/50-L-01']

test.describe('every route renders in a real browser without console errors', () => {
  for (const route of ROUTES) {
    test(`${route} loads clean`, async ({ page }) => {
      // Capture the SOURCE URL alongside the text. A generic "Failed to load resource" says
      // nothing about whose resource failed, and filtering it by text alone silently excused
      // our own 404s and 5xx — the budget could not fail on the class of defect it exists for.
      const errors = []
      page.on('console', (m) => {
        if (m.type() !== 'error') return
        errors.push({ text: m.text(), url: m.location()?.url || '' })
      })
      page.on('pageerror', (e) => errors.push({ text: String(e), url: '' }))

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

      // Separate OUR failures from noise we neither ship nor control. Two different filters,
      // because they answer two different questions.

      // 1) WHOSE code produced it. Wallet SDK chatter (WalletConnect/Reown/Coinbase), the
      //    flagship products' own origins and the analytics they inject, and Cloudflare's
      //    zone-injected scripts. Matched on the ORIGINATING URL, not the message text.
      //    ✎ 2026-08-23: `cloudflareinsights` REMOVED from this list. Web Analytics' automatic
      //    beacon injection is now off for the zone (auto_install=false, set via
      //    scripts/cf-web-analytics.mjs), so the beacon must never appear again — and while this
      //    forgave it by host, a re-enable would have been silently tolerated. Now it fails.
      const THIRD_PARTY_HOST =
        /walletconnect|reown|coinbase|cdn-cgi\/challenge-platform|googletagmanager|google-analytics|doubleclick|kthulhu\.co|kointel\.co\.za/i

      // 2) Messages that carry no useful URL of their own.
      //    ✎ 2026-08-23: this list is now EMPTY, and that is the point.
      //    It used to excuse `Executing inline script violates …` / `__CF$cv$params` — Bot Fight
      //    Mode's JavaScript Detections hitting our strict CSP. That is fixed at the SOURCE: the
      //    worker publishes a per-response CSP nonce and Cloudflare signs its own injected script
      //    with it (worker.js nonceCsp). Production is at ZERO console errors on / and /audit.
      //    Keeping the excuse would mean a future regression — someone dropping the nonce, or
      //    making the HTML cacheable so the nonce has to go — would read as green. So it fails now.
      const KNOWN_TEXT = /$^/

      // NOTE: a bare "Failed to load resource" is NO LONGER excused. If the URL that produced
      // it is ours, it is our defect and this budget must fail on it.
      const ours = errors.filter(
        (e) => !THIRD_PARTY_HOST.test(e.url) && !THIRD_PARTY_HOST.test(e.text) && !KNOWN_TEXT.test(e.text),
      )
      const detail = ours.map((e) => `  ${e.text}${e.url ? `\n    ↳ ${e.url}` : ''}`).join('\n')
      expect(ours, `console errors on ${route}:\n${detail}`).toEqual([])
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

test('the published finding renders its code, not backticks', async ({ page }) => {
  // The strongest proof surface on the site is mostly Solidity. Before the parser learned fences,
  // rendering this page would have printed ``` markers and joined a Foundry test into a paragraph
  // — product-audit finding 15, on the one page a skeptical auditor would actually read.
  await page.goto('/findings/50-L-01')
  await page.getByRole('heading', { level: 1 }).waitFor()

  const body = await page.locator('body').innerText()
  expect(body).not.toContain('```')

  const codeBlocks = page.locator('pre code')
  expect(await codeBlocks.count()).toBeGreaterThan(0)
  await expect(page.locator('pre code', { hasText: 'forge-std/Test.sol' })).toBeVisible()

  // Wide source scrolls inside its own box; the page never scrolls sideways.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)

  // Provenance must travel with the prose.
  await expect(page.getByText(/severity is cyfrin.s classification/i)).toBeVisible()
  await expect(page.getByRole('link', { name: /contest on codehawks/i })).toBeVisible()
})
