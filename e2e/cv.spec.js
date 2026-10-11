/*
 * The CV pages (John, 2026-10-11: "v2 now"). Each CV is a page at /cv/<slug>, built from
 * src/content/cv/, and its PDF, rendered from that page by the build, stays at the URL the CVs
 * were first published at. Runs on the local production build, and after a deploy against the
 * deployed site (the post-deploy smoke), so a page or PDF the deploy lost fails there.
 */
import { test, expect } from '@playwright/test'
import { CV_PAGES } from '../src/lib/cvPages.js'

for (const cv of CV_PAGES) {
  test.describe(`/cv/${cv.slug}`, () => {
    test('renders the CV with its own fonts, and nothing the CSP blocks', async ({ page }) => {
      // The CV pages load nothing third-party, so the budget is zero from any source.
      const errors = []
      page.on('console', (message) => message.type() === 'error' && errors.push(`${message.text()} @ ${message.location()?.url}`))
      page.on('pageerror', (error) => errors.push(String(error)))
      const fonts = []
      page.on('response', (response) => response.url().includes('/cv/fonts/') && fonts.push(response.status()))

      const response = await page.goto(`/cv/${cv.slug}`, { waitUntil: 'load' })
      expect(response.status()).toBe(200)
      expect(response.headers()['content-type']).toContain('text/html')
      await expect(page).toHaveTitle(/John Wellard/)
      await page.evaluate(() => document.fonts.ready)

      expect(fonts.length).toBeGreaterThan(0)
      expect(fonts.every((status) => status === 200)).toBe(true)
      expect(errors).toEqual([])
    })

    test('reads on a phone without scrolling sideways', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/cv/${cv.slug}`, { waitUntil: 'load' })
      const { scroll, client } = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
      expect(scroll).toBeLessThanOrEqual(client)
    })

    test('links its PDF, rendered from this page, at the URL first published', async ({ page, request }) => {
      await page.goto(`/cv/${cv.slug}`)
      await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveAttribute('href', cv.pdf)

      const pdf = await request.get(`/cv/${cv.pdf}`)
      expect(pdf.status()).toBe(200)
      expect(pdf.headers()['content-type']).toContain('application/pdf')
      expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-')
    })
  })
}
