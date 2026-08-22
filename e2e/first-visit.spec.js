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

test('the hero screen hands its contract to the full console — no second paste', async ({ page }) => {
  // Brief 01, next-need 1: the hero produced findings and then ended. An interested visitor had
  // to retype their contract on /audit, which is a dead end wearing a result. Asserted end to end
  // in a real browser because the handoff rides router state — jsdom can prove the wiring, only a
  // browser proves the navigation actually carries it.
  await page.goto('/')
  const editor = page.locator('#hero-audit-src')
  await expect(editor).toBeVisible()

  const marker = 'contract HandoffProbe { function drain() public {} }'
  await editor.fill(marker)

  const handoff = page.getByRole('link', { name: /open in the full console/i })
  await expect(handoff).toBeVisible()
  await handoff.click()

  await expect(page).toHaveURL(/\/audit$/)
  // The console's editor must already hold what was typed upstairs.
  await expect(page.locator('textarea').first()).toHaveValue(marker)
})

test('/ctf shows what a solve looks like, labelled as a recording', async ({ page }) => {
  // Brief 06, next-need 1. The leaderboard is honestly empty; nothing demonstrated success, so an
  // empty board read as "nobody has done this" rather than as an invitation. The walkthrough
  // artifact already shipped in the bundle and was rendered by nobody.
  await page.goto('/ctf')
  const section = page.locator('section[aria-labelledby="ctf-recorded"]')
  await expect(section).toBeVisible()

  // Labelled BEFORE any step is visible — a walkthrough mistakable for a live result is worse
  // than the empty board it replaces.
  await expect(section).toContainText(/Recorded/i)
  await expect(section).toContainText(/not a live result/i)
  await expect(section).toContainText(/not your solve/i)

  await section.getByRole('button', { name: /show the walkthrough/i }).click()
  await expect(section.getByRole('listitem').first()).toContainText(/Deploy Attacker/i)
})

test('/audit gives a visitor with no contract something to try', async ({ page }) => {
  // Brief 05, next-need 3. The site's main interactive tool assumed you brought your own Solidity.
  await page.goto('/audit')
  const load = page.getByRole('button', { name: 'Vault (reentrancy)', exact: true })
  await expect(load).toBeVisible()
  await load.click()

  // The editor takes the example AND the instant screen finds its bug — the demo has to demo.
  await expect(page.locator('#audit-src')).toHaveValue(/contract Vault/)
  await expect(page.locator('main')).toContainText(/Reentrancy/i)
})

test('the KTHULHU flagship does something ON this site, and attributes the corpus', async ({ page }) => {
  /*
   * FR-066 / finding 21. This card was a frame of kthulhu.co with an honest label, recorded for a
   * month as owner-gated on API access it never needed. The corpus panel is the on-site half.
   *
   * Two things are asserted, in this order, because they fail differently:
   *   1. ATTRIBUTION is visible before any interaction. These are other people's published
   *      findings; a panel that could read as John's audit output is a claims violation on the
   *      page whose argument is that claims here are governed.
   *   2. Driving it NEVER dead-ends. This is the one test here that crosses the origin (the
   *      corpus lives behind the Worker), and that is deliberate: the contract is that an
   *      unreachable corpus produces a stated reason, never an empty box. Both outcomes pass,
   *      which is what makes it safe in the build gate — it asserts the degrade, not the uptime.
   */
  await page.goto('/work')
  const corpus = page.locator('section[aria-labelledby="kthulhu-corpus"]')
  await expect(corpus).toBeVisible()

  await expect(corpus).toContainText(/other people’s findings, published by their authors/i)
  await expect(corpus).toContainText(/none of them is john’s audit work/i)

  // An empty box is a dead end; the suggestions are the way in for someone with no query in mind.
  const suggestion = corpus.getByRole('button', { name: 'reentrancy in withdraw', exact: true })
  await expect(suggestion).toBeVisible()
  await suggestion.click()

  const live = corpus.locator('[aria-live="polite"]')
  await expect
    .poll(async () => ((await live.textContent()) || '').trim().length > 0, { timeout: 20_000 })
    .toBe(true)
})

test('the Kointel flagship runs its rule, and says it is not the product', async ({ page }) => {
  /*
   * FR-066 / finding 21, the other half. Kointel's origin sends X-Frame-Options: DENY, so this
   * card never even reached an iframe — it was a description and a link, the weakest of the four.
   * Its documented differentiator is a build-failing CI gate, which is a pure rule, so it runs
   * here. Fully deterministic: no network, no wallet, no model.
   */
  await page.goto('/work')
  const gate = page.locator('section[aria-labelledby="kointel-gate"]')
  await expect(gate).toBeVisible()

  // The disclaimer is the load-bearing part — this demonstrates the rule, it is not the product.
  await expect(gate).toContainText(/not kointel’s source code/i)
  await expect(gate).toContainText(/does not trace dataflow/i)

  // Opens on a passing module…
  await expect(gate.getByRole('status')).toContainText(/build passes/i)

  // …and the verdict must actually respond to the code, not just render once.
  await gate.getByRole('textbox').fill('await wallet.sendTransaction(tx)')
  await expect(gate.getByRole('status')).toContainText(/build fails/i)
  await expect(gate).toContainText(/line 1/i)
})

test('the hero hat chips are actionable, not decoration', async ({ page }) => {
  // Brief 01, next-need 2: the four hats were rendered in the hero as static text and were
  // filterable four folds below, so a visitor learned the vocabulary in one place and discovered
  // it was interactive somewhere else. Clicking a chip now preselects that hat on the identity
  // section. Asserted in a browser because the handoff rides router state.
  await page.goto('/')
  // The accessible name is the chip's TEXT ("Auditor"); `title` does not override that when a
  // link has content. Scoped to the hero, since the identity section below names the hats too.
  const chip = page.locator('section').first().getByRole('link', { name: 'Auditor', exact: true })
  await expect(chip).toBeVisible()
  await chip.click()

  const hats = page.locator('section[aria-labelledby="fourhats-title"]')
  await expect(hats).toBeVisible()
  // The chosen hat is the active filter — the others are dimmed, never removed (BR-07).
  await expect(hats.getByRole('button', { name: /auditor/i })).toHaveAttribute('aria-pressed', 'true')
})
