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
 * It lives OUTSIDE `e2e/`, with its own config, and that separation is deliberate rather than
 * tidy. A GitHub runner is a datacenter IP; the zone challenges it; the runner would then measure
 * Cloudflare's challenge page and report ITS properties as the site's — no cookies, no Google tag,
 * all green. A test that passes by measuring the wrong document is worse than no test.
 *
 * ✎ RESOLVED 2026-08-22, same day: the owner disabled the Google tag gateway at the zone, and this
 * suite went 3/3 green against the apex — no tag object, 0 cookies, `_gcl_ls` gone, only wallet
 * keys in storage. It STAYS a manual gate for the runner-challenge reason above; run it after any
 * zone-level change, because this file is the only check in the repo that can see one.
 *
 * If apex egress ever reaches CI, fold this into the post-deploy job and delete the separation.
 */
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test, expect } from '@playwright/test'

const ZONE = process.env.ZONE_BASE_URL || 'https://jw3b.dev'

/*
 * ✎ 2026-08-23 — this suite went 2/3 RED and the cause is Cloudflare Bot Fight Mode.
 *
 * BFM's JavaScript Detections serve `/cdn-cgi/challenge-platform/…/jsd/…` from our own origin and
 * store `cf_clearance`. Verified NOT to be a Playwright artifact: `curl` — not a browser, running
 * no JavaScript — already receives `challenge-platform/scripts/jsd/main.js` in the HTML, so every
 * visitor gets it.
 *
 * The temptation is to assert `[]` minus this one thing and move on. That is how a gate becomes
 * decoration. So the allowance is NAMED, and it is CONDITIONAL: the exception only holds while
 * `src/content/privacy.md` actually discloses the cookie to visitors. Weaken the notice and this
 * suite goes red again — the test enforces the disclosure, not the vendor's convenience.
 *
 * It is an exception on the strength of purpose, not of source. `cf_clearance` is a security
 * cookie, the one ePrivacy Art 5(3) purpose that needs no prior consent. Cloudflare serving it
 * buys it nothing: `/cdn-cgi/zaraz/*` comes from the same vendor and the same path family and
 * stays banned below, because that one is a tag injector.
 */
const SECURITY_COOKIES = ['cf_clearance']
const PRIVACY_NOTICE = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/content/privacy.md')

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
  test('the only cookie is the named security one, and the notice says so', async ({ page, context }) => {
    await page.goto(`${ZONE}/`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(2500)
    const cookies = await context.cookies()

    const undeclared = cookies.filter((c) => !SECURITY_COOKIES.includes(c.name))
    expect(
      undeclared.map((c) => `${c.name}@${c.domain}`),
      'an undeclared cookie — ADR-P5-01 says there is no consent obligation, and each of these is one',
    ).toEqual([])

    /*
     * The half that makes the allowance honest rather than convenient. A visitor's entitlement is
     * to be TOLD; if the notice stops telling them, the exception has no basis and this fails.
     */
    const notice = readFileSync(PRIVACY_NOTICE, 'utf8')
    for (const name of cookies.map((c) => c.name)) {
      expect(notice, `the live site sets \`${name}\` and the privacy notice never names it`).toContain(name)
    }
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
    /*
     * ALLOWED same-origin extras, named individually and never by prefix.
     *
     * `/cdn-cgi/speculation` is Cloudflare Speed Brain: it returns
     * `application/speculationrules+json` ({"tag":"cf-speed-brain","prefetch":…}) — declarative
     * prefetch hints, not executable code, no storage, no third party.
     *
     * The prefix `/cdn-cgi/` is deliberately NOT allowed wholesale, because `/cdn-cgi/zaraz/*` is
     * served from exactly there and IS a third-party tag injector. Allowing the family to make
     * this test green would blind it to the successor of the thing it was written to catch.
     */
    const ALLOWED_SAME_ORIGIN = ['/cdn-cgi/speculation']

    /*
     * Bot Fight Mode's JS challenge, allowed by exact path family and nothing wider. `zaraz` lives
     * one segment away under the same `/cdn-cgi/` parent and must keep failing this test.
     */
    const ALLOWED_SAME_ORIGIN_PREFIX = [/^\/cdn-cgi\/challenge-platform\//]

    const proxied = []
    page.on('request', (r) => {
      const u = new URL(r.url())
      if (u.origin !== new URL(ZONE).origin) return
      if (/^\/assets\//.test(u.pathname) || u.pathname === '/' || /\.(css|js|png|svg|webp|json|txt|xml|ico)$/.test(u.pathname)) return
      if (ALLOWED_SAME_ORIGIN.includes(u.pathname)) return
      if (ALLOWED_SAME_ORIGIN_PREFIX.some((re) => re.test(u.pathname))) return
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
