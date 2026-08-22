/*
 * ZONE POSTURE — the checks that only mean anything against the REAL domain.
 *
 * WHY THIS FILE EXISTS SEPARATELY, and it is the most important sentence here: every other
 * automated check in this repo runs against `jw3b-dev-site.agilegypsy.workers.dev`, because the
 * apex sits behind the zone's bot protection and serves every GitHub runner a managed challenge.
 * That workaround is correct for verifying what we shipped — same worker, same code — and it has
 * a consequence nobody wrote down: **the workers.dev origin has no zone layer**, so anything
 * Cloudflare injects at the zone is invisible to the entire gate suite.
 *
 * That blind spot is exactly where a real problem was living. On 2026-08-22, `jw3b.dev` was found
 * to be serving Google Tag Manager from its OWN origin (`/12am/`) via Cloudflare's first-party
 * tag proxy — a feature whose purpose is to defeat exactly the controls we rely on. Our
 * `script-src 'self'` allows it because it IS self. It writes `_gcl_ls` to localStorage on every
 * page load, on every route, including /privacy. None of it appears on workers.dev, so none of it
 * appeared in CI, and the product-audit register described the symptom (four console errors) as
 * cosmetic P2 noise for a month.
 *
 * HOW TO RUN IT. From a normal (non-datacenter) IP:
 *
 *     npm run e2e:zone
 *
 * It is deliberately NOT in the CI suite. A GitHub runner gets challenged by the zone, and a test
 * that reports the challenge page's properties as though they were the site's would be worse than
 * no test — it would go green while asserting nothing. If the bot protection is ever relaxed for
 * CI egress, move it into the post-deploy job; until then it is a manual gate, named and scripted
 * so it is a step someone can run rather than a paragraph someone must remember.
 */
import { test, expect } from '@playwright/test'

const ZONE = process.env.ZONE_BASE_URL || 'https://jw3b.dev'

/*
 * Storage the site legitimately needs to function, under the ePrivacy Art 5(3) "strictly
 * necessary" exemption: wallet connection state the visitor's own action creates. Everything here
 * is written by the wallet stack (RainbowKit, wagmi, Reown AppKit, Base account SDK) to remember a
 * connection the visitor deliberately made. Anything NOT on this list is the finding.
 */
const FUNCTIONAL_KEYS = [
  /^rk-/, // RainbowKit
  /^wagmi\./, // wagmi connection cache
  /^@appkit\//, // Reown AppKit
  /^base-acc-sdk\./, // Base account SDK
  /^@w3m\//, // WalletConnect modal
  /^wc@/, // WalletConnect session
]

const isFunctional = (key) => FUNCTIONAL_KEYS.some((re) => re.test(key))

test.describe('the cookieless posture ADR-P5-01 claims, checked on the domain visitors use', () => {
  test('no cookies are set on a plain first visit', async ({ page, context }) => {
    await page.goto(`${ZONE}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const cookies = await context.cookies()
    expect(cookies.map((c) => `${c.name}@${c.domain}`), 'ADR-P5-01: no cookie, therefore no consent banner').toEqual([])
  })

  test('nothing writes NON-FUNCTIONAL storage — localStorage is a consent surface too', async ({ page }) => {
    /*
     * Art 5(3) covers "storing of information, or the gaining of access to information already
     * stored, in the terminal equipment" — the mechanism is irrelevant, so a localStorage write is
     * a cookie for consent purposes. The ADR's conclusion (no consent banner required) depends on
     * this being empty of anything the visitor did not ask for.
     */
    await page.goto(`${ZONE}/privacy`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const keys = await page.evaluate(() => Object.keys(localStorage))
    const nonFunctional = keys.filter((k) => !isFunctional(k))
    expect(
      nonFunctional,
      'non-functional storage on /privacy — a page nobody visits to connect a wallet. ' +
        'Each key here is a consent obligation the site currently says it does not have.',
    ).toEqual([])
  })

  test('no third-party tag executes — including one proxied through our own origin', async ({ page }) => {
    /*
     * The direct googletagmanager.com and cloudflareinsights.com loads are CSP-blocked, which is
     * why they show as console errors. The FIRST-PARTY-PROXIED copy is not blocked, because
     * `script-src 'self'` cannot tell Google's tag from ours when Cloudflare serves it from our
     * domain. So this asserts the outcome (no tag running) rather than the mechanism.
     */
    const proxied = []
    page.on('request', (r) => {
      const u = new URL(r.url())
      if (u.origin !== new URL(ZONE).origin) return
      if (/^\/assets\//.test(u.pathname) || u.pathname === '/' || /\.(css|js|png|svg|webp|json|txt|xml|ico)$/.test(u.pathname)) return
      proxied.push(u.pathname)
    })

    await page.goto(`${ZONE}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)

    const tagRunning = await page.evaluate(
      () => typeof window.gtag === 'function' || Array.isArray(window.dataLayer) || 'google_tag_manager' in window,
    )
    expect(tagRunning, 'a Google tag is executing on the page').toBe(false)

    // A same-origin path serving third-party tag code is the exact bypass this test exists for.
    expect(proxied, 'unexpected same-origin script paths — check for a first-party tag proxy').toEqual([])
  })
})
