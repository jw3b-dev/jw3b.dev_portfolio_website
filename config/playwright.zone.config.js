/*
 * Playwright config for the ZONE POSTURE spec — deliberately separate from the CI suite.
 *
 * `e2e-zone/` is its own directory, not a `testIgnore` on the main config, for a blunt reason:
 * an ignore rule is one careless `npx playwright test` away from being forgotten, and this spec
 * MUST NOT run in CI. Two things would go wrong if it did:
 *
 *   1. It fails today, on purpose — it asserts a posture the zone is currently violating
 *      (see finding 23 / P5-GATE). A red CI on a known, owner-gated, un-fixable-in-code finding
 *      trains everyone to ignore red CI, which costs more than the finding.
 *   2. Worse, it would not even fail for that reason. GitHub runners are datacenter IPs and the
 *      apex challenges them, so a runner would measure Cloudflare's challenge page and report ITS
 *      properties as the site's — no cookies, no Google tag, all green. A test that passes by
 *      measuring the wrong document is worse than no test.
 *
 * So: separate directory, separate config, separate script (`npm run e2e:zone`), run by a person
 * from a normal connection. If apex egress is ever available to CI, this folds back into the
 * post-deploy job and the separation can go.
 */
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: '../e2e-zone',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  retries: 0, // a flaky verdict here is a finding about the zone, not something to retry away
  reporter: [['list']],
  use: { trace: 'off' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Never boots a preview server: the whole point is the deployed apex, which is the only origin
  // that has the zone layer this spec exists to inspect.
})
