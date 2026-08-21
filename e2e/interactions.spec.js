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
