/*
 * Journeys that RUN the tools, not just render them. Static render assertions passed happily
 * while /fuzz was unreachable and the escrow rail could never succeed — a page can look
 * correct and do nothing. These drive the real controls against the real build.
 */
import { test, expect } from '@playwright/test'

// NOTE: the mapping must be named `balances` — the reentrancy detector looks for a balance write
// after the value-bearing call. The version of this fixture that shipped called it `b`, so it
// triggered NO finding at all, and the test passed anyway because it only asserted that the
// "Findings" heading was visible — which is true of an empty panel. Assert the finding itself.
const REENTRANT = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
contract T {
  mapping(address => uint256) public balances;
  function withdraw() external {
    uint256 a = balances[msg.sender];
    (bool ok,) = msg.sender.call{value: a}("");
    require(ok);
    balances[msg.sender] = 0;
  }
}`

const CLEAN = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
contract Safe {
  uint256 public total;
  function add(uint256 n) external { total += n; }
}`

/*
 * The console is mounted on BOTH routes (the /work flagship strip embeds it), and it shipped
 * broken on both: the heuristics were computed in the click handler and frozen into state, so
 * editing the contract changed nothing on screen. The old test here clicked "run" first and then
 * asserted — which passes whether or not the result tracks the input. So: no clicks at all.
 */
for (const route of ['/audit', '/work']) {
  test(`the audit console re-screens as the contract is edited (${route})`, async ({ page }) => {
    await page.goto(route)
    const box = page.locator('#audit-src')
    await expect(box).toBeVisible()

    await box.fill(REENTRANT)
    // No button press anywhere in this test — the deterministic pass must simply follow the box.
    await expect(page.getByText('Reentrancy — external call before state update')).toBeVisible({ timeout: 10_000 })
    // The honesty disclaimer travels with every result set — non-negotiable (BR-10).
    await expect(page.getByText(/not a substitute for a full manual audit/i).first()).toBeVisible()

    await box.fill(CLEAN)
    // The finding must CLEAR too: a panel that only ever adds is just as stale as a frozen one.
    await expect(page.getByText('Reentrancy — external call before state update')).toHaveCount(0)
    await expect(page.getByText(/no common-pattern issues/i)).toBeVisible()
  })

  /*
   * The iterative loop (ADR-P5-02), driven the way a person drives it: apply the offered fix,
   * watch the free screen re-run on the result, then go back. No model call anywhere in here —
   * the whole loop is client-side, which is exactly why it can be a build gate.
   */
  test(`apply a fix, re-screen, and restore the original (${route})`, async ({ page }) => {
    await page.goto(route)
    const box = page.locator('#audit-src')
    await expect(box).toBeVisible()
    await box.fill(REENTRANT)

    const reentrancy = page.getByText('Reentrancy — external call before state update')
    await expect(reentrancy).toBeVisible({ timeout: 10_000 })

    // The fix is offered against the finding it remediates.
    const applyFix = page.getByRole('button', { name: /apply fix/i }).first()
    await expect(applyFix).toBeVisible()
    await applyFix.click()

    // It edited the source, and the console reports the RE-SCREEN — not a claim that it worked.
    await expect(page.getByText(/re-screened, and the finding is gone/i)).toBeVisible()
    await expect(page.getByText(/it is not an audit/i)).toBeVisible()
    await expect(reentrancy).toHaveCount(0)
    await expect(box).toHaveValue(/balances\[msg\.sender\] = 0;[\s\S]*\.call\{value/)

    // The pre-fix text was pinned on the way past, so undoing the fix returns YOUR contract —
    // not the sample the page happened to ship with.
    await expect(page.getByRole('button', { name: /^Fix · / })).toBeVisible()
    await page.getByRole('button', { name: /^Edit 1 ·/ }).click()
    await expect(box).toHaveValue(REENTRANT)
    await expect(reentrancy).toBeVisible()

    // ...and the contract the page loaded with is still reachable behind it.
    await page.getByRole('button', { name: /^Sample ·/ }).click()
    await expect(box).toHaveValue(/contract Vault/)
  })

  test(`auto re-run is off by default and says so (${route})`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByRole('checkbox', { name: /re-run on edit/i })).not.toBeChecked()
    await expect(page.getByText(/auto re-run is off/i)).toBeVisible()
    await expect(page.getByText(/10 of 10 AI analyses left this session/i)).toBeVisible()
  })

  /*
   * Owner-reported, three ways: clicking a checkpoint fired a rerun; the version chips "got mixed
   * up and lost"; and re-run fired with no original run to re-run. The /audit endpoint is ROUTED
   * to a stub so the whole journey is deterministic and costs nothing — the budget counter is the
   * tell, because it only moves when a run actually starts.
   */
  test(`browsing versions never spends an analysis (${route})`, async ({ page }) => {
    // Match the WORKER endpoint only — a bare '**/audit' glob also matches the SPA route itself,
    // which serves the stub as the page document and leaves you with no editor to type into.
    await page.route(
      (url) => url.pathname === '/audit' && url.host.includes('workers.dev'),
      (r) =>
        r.fulfill({ status: 200, contentType: 'text/event-stream', body: 'data: {"response":"## Summary\\nstubbed"}\n\ndata: [DONE]\n\n' }),
    )
    await page.goto(route)
    const box = page.locator('#audit-src')
    await box.fill(REENTRANT)
    await page.getByRole('checkbox', { name: /re-run on edit/i }).check()

    // Nothing analysed yet, so there is nothing to RE-run — it says so instead of firing a first
    // call nobody asked for.
    await expect(page.getByText(/nothing to re-run yet/i)).toBeVisible()
    await expect(page.getByText(/10 of 10 AI analyses left this session/i)).toBeVisible()

    // One deliberate press establishes the baseline.
    await page.getByRole('button', { name: 'Run AI analysis' }).click()
    await expect(page.getByRole('tab', { name: /Run 1/ })).toBeVisible()
    await expect(page.getByText(/9 of 10 AI analyses left this session/i)).toBeVisible()

    // Now LOOK at an earlier version — repeatedly. Navigation must cost nothing and add nothing.
    const chipsBefore = await page.getByRole('button', { name: /^(Original|Edit \d|Fix · )/ }).count()
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: /^Sample ·/ }).click()
      await page.getByRole('button', { name: /^Edit 1 ·/ }).click()
    }
    await expect(page.getByText(/looking back through your own history/i)).toBeVisible()
    await page.waitForTimeout(1500)

    await expect(page.getByText(/9 of 10 AI analyses left this session/i)).toBeVisible()
    await expect(page.getByRole('tab', { name: /Run 2/ })).toHaveCount(0)
    // ...and the chip list is exactly as it was — browsing does not rewrite the history.
    await expect(page.getByRole('button', { name: /^(Original|Edit \d|Fix · )/ })).toHaveCount(chipsBefore)
  })

  test(`each section states what it costs (${route})`, async ({ page }) => {
    await page.goto(route)
    await expect(page.getByText(/no network, no cost/i)).toBeVisible()
    await expect(page.getByText(/one model call per run, metered at 10 per session/i)).toBeVisible()
    // "live" is reserved for model provenance — the free tier is never described that way.
    // Target the section by its own label id — `filter({hasText})` also matches every ancestor
    // section, so `.first()` returns the whole page and the assertion becomes meaningless.
    const instant = page.locator('section[aria-labelledby="ac-screen-title"]')
    await expect(instant.getByText(/\blive\b/i)).toHaveCount(0)
  })
}

test('the fuzz tool regenerates the harness as the source is edited', async ({ page }) => {
  await page.goto('/audit')
  await page.getByRole('tab', { name: /fuzz harness/i }).click()
  const box = page.locator('#fuzz-src')
  await expect(box).toBeVisible()

  await box.fill('contract Vault { function deposit() external payable {} }')
  await expect(page.getByText(/VaultFuzzTest/).first()).toBeVisible({ timeout: 10_000 })
  await expect(page.getByText(/testFuzz_deposit/).first()).toBeVisible()

  // Rename the contract: the scaffold must follow, not keep targeting the old one.
  await box.fill('contract Router { function swap(uint256 amountIn) external {} }')
  await expect(page.getByText(/RouterFuzzTest/).first()).toBeVisible()
  await expect(page.getByText(/testFuzz_swap/).first()).toBeVisible()
  await expect(page.getByText(/VaultFuzzTest/)).toHaveCount(0)
})

test('the concierge always resolves to an answer OR an honest labelled fallback', async ({ page }) => {
  // The BUILD GATE must be deterministic, so this asserts the PRODUCT PROMISE (FR-020), not
  // the reachability of a third-party model: a visitor gets a real reply, or a clearly
  // labelled recorded run with book-a-call — never a blank, a spinner, or an error. CI proved
  // why: from a runner the live agent was unreachable and the site degraded exactly as
  // designed, yet the old assertion called that a failure. Whether the LIVE agent answers is
  // asserted separately in live.spec.js, against the deployed site.
  await page.goto('/')
  await page.getByRole('button', { name: /open concierge chat/i }).click()

  const dialog = page.getByRole('dialog', { name: /ai concierge/i })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText(/ai-generated/i)).toBeVisible() // FR-021, persistent disclosure

  await dialog.getByRole('textbox').fill('In one short sentence, what does John do?')
  await dialog.getByRole('button', { name: /^send$/i }).click()

  const answered = dialog.locator('.bg-raised').last()
  const degraded = dialog.getByText(/recorded run — live agent unavailable/i)
  await expect
    .poll(async () => {
      if (await degraded.count()) return 'degraded'
      const t = (await answered.textContent().catch(() => '')) || ''
      return t.trim() && t.trim() !== '…' ? 'answered' : 'pending'
    }, { timeout: 60_000 })
    .not.toBe('pending')

  // Either ending is acceptable; a dead end is not.
  if (await degraded.count()) {
    await expect(dialog.getByRole('link', { name: /book a call/i })).toBeVisible()
  }
})

test('the guaranteed floor is reachable WITHOUT completing the configurator', async ({ page }) => {
  // /hire-me promised "booking a call is always the floor" while offering no way to do it
  // without answering four questions first — the promise was true of the design and false of
  // the surface. This asserts the escape hatch exists AND lands on a usable form, because a
  // button that reaches a broken step would pass a visibility check and convert nobody.
  await page.goto('/hire-me')
  await expect(page.locator('main')).not.toBeEmpty()

  await page.getByRole('button', { name: /book a call →/i }).first().click()

  const input = page.locator('input[type="text"], input[type="email"], input:not([type])').first()
  await expect(input).toBeVisible({ timeout: 15_000 })
  await input.fill('someone@example.com')
  await expect(input).toHaveValue('someone@example.com')
  await expect(page.locator('body')).not.toContainText('Unexpected Application Error')
})
