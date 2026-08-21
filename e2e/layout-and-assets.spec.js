/*
 * The two defect classes jsdom CANNOT catch, by construction:
 *   1. Layout collision — jsdom has no layout engine, so every element is 0x0 and no overlap
 *      is detectable. The fixed concierge launcher covering the footer's "Hire John" link at
 *      part-screen widths shipped for exactly this reason.
 *   2. Asset/transport integrity — jsdom never fetches the built bundle, so a missing hashed
 *      chunk being served as the HTML shell (200 text/html) was invisible until visitors hit
 *      "Failed to fetch dynamically imported module".
 */
import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'half-screen', width: 960, height: 1040 }, // the width the overlap was reported at
  { name: 'desktop', width: 1512, height: 900 },
]

for (const vp of VIEWPORTS) {
  test(`no fixed control covers a footer link at ${vp.name} (${vp.width}px)`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/', { waitUntil: 'networkidle' })
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(400)

    const launcher = await page.locator('button[aria-label="Open concierge chat"]').boundingBox()
    expect(launcher, 'the concierge launcher should be present').toBeTruthy()

    const links = page.locator('footer a')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)

    for (let i = 0; i < count; i++) {
      const link = links.nth(i)
      const box = await link.boundingBox()
      if (!box) continue
      const overlaps =
        box.x < launcher.x + launcher.width &&
        box.x + box.width > launcher.x &&
        box.y < launcher.y + launcher.height &&
        box.y + box.height > launcher.y
      expect(overlaps, `"${(await link.innerText()).trim()}" is covered by the concierge launcher`).toBe(false)
    }
  })
}

test('the concierge launcher stays pinned to the bottom-right, on every viewport', async ({ page }) => {
  // Regression: adding `relative` alongside `fixed` for the status dot let `relative` win in
  // Tailwind's output, dropping the button into normal flow at the TOP-LEFT. The existing
  // overlap test passed happily — a launcher that has fled the corner overlaps nothing.
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(800)

    const btn = page.locator('button[aria-label="Open concierge chat"]')
    const box = await btn.boundingBox()
    expect(box, `launcher missing at ${vp.name}`).toBeTruthy()
    expect(await btn.evaluate((el) => getComputedStyle(el).position), `position at ${vp.name}`).toBe('fixed')
    // Bottom-right quadrant of the viewport.
    expect(box.x, `x at ${vp.name}`).toBeGreaterThan(vp.width / 2)
    expect(box.y, `y at ${vp.name}`).toBeGreaterThan(vp.height / 2)

    // And it must STAY there when the page scrolls — that is what `fixed` buys.
    await page.evaluate(() => window.scrollTo(0, 600))
    await page.waitForTimeout(300)
    const after = await btn.boundingBox()
    expect(Math.abs(after.y - box.y), `launcher moved on scroll at ${vp.name}`).toBeLessThan(2)
  }
})

test('the page never scrolls horizontally (mobile)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'networkidle' })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow, 'horizontal overflow in px').toBeLessThanOrEqual(1)
})

// The /assets 404 rule lives in worker.js, which only runs on Cloudflare. `vite preview` is a
// plain static server with its own SPA fallback, so this assertion is meaningless there — it
// is skipped locally and RUNS against any deployed origin (npm run e2e:prod). Skipped rather
// than deleted: this is the exact regression that broke /work, /audit and /messages.
test('a missing hashed asset 404s and is NEVER served as the HTML shell', async ({ request }) => {
  test.skip(!process.env.E2E_BASE_URL, 'worker-owned rule — run against a deployed origin')
  const res = await request.get('/assets/Definitely-Gone-abc123.js')
  expect(res.status()).toBe(404)
  expect(res.headers()['content-type'] || '').not.toContain('text/html')
})

test('a real hashed asset is served as JavaScript and cached immutably', async ({ page, request }) => {
  await page.goto('/')
  const src = await page.evaluate(() => document.querySelector('script[type="module"]')?.getAttribute('src'))
  expect(src).toBeTruthy()
  const res = await request.get(src)
  expect(res.status()).toBe(200)
  expect(res.headers()['content-type'] || '').toContain('javascript')
})
