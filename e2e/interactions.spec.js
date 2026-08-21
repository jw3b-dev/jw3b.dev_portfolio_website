/*
 * Journeys that RUN the tools, not just render them. Static render assertions passed happily
 * while /fuzz was unreachable and the escrow rail could never succeed — a page can look
 * correct and do nothing. These drive the real controls against the real build.
 */
import { test, expect } from '@playwright/test'

test('the audit console screens a contract end to end', async ({ page }) => {
  await page.goto('/audit')
  const box = page.locator('textarea').first()
  await expect(box).toBeVisible()
  await box.fill(`// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;
contract T {
  mapping(address => uint256) public b;
  function withdraw() external {
    uint256 a = b[msg.sender];
    (bool ok,) = msg.sender.call{value: a}("");
    require(ok);
    b[msg.sender] = 0;
  }
}`)
  await page.getByRole('button', { name: /run analysis/i }).click()

  // The deterministic heuristics run in-browser and must produce a verdict with no network.
  await expect(page.getByText(/findings/i).first()).toBeVisible({ timeout: 20_000 })
  // The honesty disclaimer travels with every result set — non-negotiable (BR-10).
  await expect(page.getByText(/not a substitute for a full manual audit/i).first()).toBeVisible({ timeout: 20_000 })
})

test('the fuzz tool generates a Foundry harness from pasted source', async ({ page }) => {
  await page.goto('/audit')
  await page.getByRole('tab', { name: /fuzz harness/i }).click()
  const box = page.locator('textarea').first()
  await expect(box).toBeVisible()
  await box.fill('contract Vault { function deposit() external payable {} }')
  await page.getByRole('button', { name: /generate harness/i }).click()
  await expect(page.getByText(/forge-std\/Test\.sol|VaultFuzzTest|testFuzz_/i).first()).toBeVisible({ timeout: 30_000 })
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
