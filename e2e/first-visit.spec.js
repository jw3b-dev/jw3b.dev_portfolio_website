/*
 * FIRST VISIT — the gate the pipeline never had.
 *
 * The postmortem's root cause 3: no gate in the entire MAS pipeline ever walked a page
 * walletless, in its empty state, as somebody arriving for the first time. Every surface was
 * verified by a test that already knew the answer — a mounted component, a mocked stream, a
 * reducer with state pre-loaded. So four surfaces shipped that were correct for a returning,
 * wallet-connected, post-run visitor and useless for everyone else: /ctf was a 42-line login
 * wall, /audit's fourth workflow step was invisible until you paid for a run, and both thesis
 * pages argued "operable, not prose" in prose ending in a link.
 *
 * These tests assert what a first-time visitor can SEE AND DO before connecting anything,
 * spending anything, or completing anything. They are deterministic — no model call, no wallet,
 * no network beyond the origin — so they belong in the BUILD gate, not the live smoke.
 *
 * The rule they encode: a surface must be legible before it is transactional.
 */
import { test, expect } from '@playwright/test'

/** A first-time visitor has no wallet, no history, and no patience for a wall. */
const MOBILE = { width: 390, height: 844 } // iPhone 12/13/14 class — the smallest we design for

test.describe('a first-time visitor, walletless, on an empty state', () => {
  test('/audit teaches the whole workflow BEFORE anything is spent', async ({ page }) => {
    await page.goto('/audit')

    // All four numbered steps, visible on arrival. Step 4 used to exist only after a run.
    const strip = page.locator('section[aria-labelledby="how-it-works"]')
    await expect(strip).toBeVisible()
    for (const title of ['Your contract', 'Instant screen', 'AI analysis', 'AI analyses']) {
      await expect(strip.getByText(title, { exact: false }).first()).toBeVisible()
    }

    // And what each tier costs, stated before the visitor can spend it.
    await expect(strip).toContainText(/free/i)
    await expect(strip).toContainText(/10 per\s+session/i)

    // The bridge from the old vocabulary to the new name, so a returning reader isn't lost.
    await expect(page.locator('main')).toContainText(/heuristic/i)
  })

  test('/ctf explains the challenge BEFORE it asks for a wallet', async ({ page }) => {
    await page.goto('/ctf')

    const brief = page.locator('section[aria-labelledby="ctf-brief"]')
    await expect(brief).toBeVisible()

    // The four steps of the attack, readable with no wallet attached.
    for (const n of ['1', '2', '3', '4']) {
      await expect(brief.getByText(n, { exact: true }).first()).toBeVisible()
    }
    await expect(brief).toContainText(/withdraw\(\)/)
    await expect(brief).toContainText(/Base Sepolia/i)

    // The target is named: contract address + explorer link, before any wallet.
    await expect(page.locator('section[aria-labelledby="ctf-target"]')).toBeVisible()

    // The leaderboard is present and honest about WHY it is empty — absent, unreachable and
    // zero-solves are three different states and it must say which. (Off-production it reports
    // "offsite": the Worker's CORS allowlist is production-only, so the fetch is not attempted.)
    await expect(page.getByRole('heading', { name: /^Solves$/i })).toBeVisible()

    // The wallet ask comes AFTER the brief in document order, not instead of it.
    const briefBox = await brief.boundingBox()
    const ask = page.getByText(/Ready\? Connect a wallet/i)
    await expect(ask).toBeVisible()
    const askBox = await ask.boundingBox()
    expect(askBox.y, 'the wallet ask must sit below the brief').toBeGreaterThan(briefBox.y)
  })

  test('both thesis pages DO the thing they argue for', async ({ page }) => {
    // systems-are-graphs claimed "the surfaces here are consoles, not slideshows … the work is
    // traversing it in front of you" while no surface on the site traversed any graph.
    await page.goto('/thesis/systems-are-graphs')
    const walk = page.locator('section[aria-labelledby="graph-walk"]')
    await expect(walk).toBeVisible()
    const before = await walk.textContent()
    await walk.getByRole('button').first().click()
    await expect
      .poll(async () => (await walk.textContent()) !== before, { timeout: 5_000 })
      .toBe(true) // following an edge changed what is on screen

    // zero-trust-validator argued a claims gate; now it runs the real one, in the page.
    await page.goto('/thesis/zero-trust-validator')
    const gate = page.locator('section[aria-labelledby="gate-demo"]')
    await expect(gate).toBeVisible()
    await gate.getByRole('button').first().click()
    await expect(gate.locator('[role="status"]')).not.toBeEmpty()
  })

  test('the hire floor is reachable on a phone, with no wallet', async ({ page }) => {
    // The desktop path is asserted in interactions.spec.js. Mobile is where the escape hatch
    // gets pushed below three folds of configurator and stops being an escape hatch.
    await page.setViewportSize(MOBILE)
    await page.goto('/hire-me')
    await expect(page.locator('main')).not.toBeEmpty()

    const floor = page.getByRole('button', { name: /book a call →/i }).first()
    await expect(floor).toBeVisible()
    await floor.click()

    const input = page.locator('input[type="text"], input[type="email"], input:not([type])').first()
    await expect(input).toBeVisible({ timeout: 15_000 })
    await expect(input).toBeInViewport() // reachable, not merely present in the DOM
  })

  test('no surface promises a capability behind a wall it never opens', async ({ page }) => {
    // /messages sold XMTP end-to-end chat from the primary nav while being a stub, and its
    // "← Back to the console" went home. The route stays (linked from the footer); what must
    // not return is the primary-nav promotion.
    await page.goto('/')
    const primaryNav = page.locator('header').first()
    await expect(primaryNav.getByRole('link', { name: /messages/i })).toHaveCount(0)
  })
})
