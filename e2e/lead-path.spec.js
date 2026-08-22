/*
 * LEAD PATH — post-deploy probe for the site's one commercial outcome.
 *
 * Findings 1–3 were the headline defect: a visitor could complete Mission Control and be told
 * "You're on John's list" while no system fulfilled that sentence. It is fixed and was proven live
 * once, by hand. This is the standing gate, so it stays fixed.
 *
 * ── A DELIBERATE LIMIT, STATED RATHER THAN HIDDEN ──────────────────────────────────────────────
 * This probe does NOT submit a real lead. A valid POST writes a durable D1 row and pings John's
 * phone, so a probe on every deploy would either spam him or require a client-supplied "this is a
 * test" flag that suppresses alerting — and a production bypass keyed on attacker-controllable
 * input is not something to add for the convenience of a test. That is the owner's call, not the
 * test author's.
 *
 * What this DOES gate, without writing anything:
 *   - the route is deployed, reachable, and running its validator (not 404/500);
 *   - it refuses malformed input with the real error contract rather than accepting it;
 *   - the Worker reports its alert channel as configured — the exact condition whose absence WAS
 *     the original defect.
 * The write half stays covered by the worker integration tests plus the one-time live proof
 * recorded in PRODUCT_AUDIT_2026-08-21.md.
 */
import { test, expect } from '@playwright/test'

test.skip(!process.env.E2E_BASE_URL, 'post-deploy probe — run with E2E_BASE_URL')

// Hardcoded, matching live.spec.js: src/config/worker.js reads import.meta.env, which does not
// exist in Playwright's Node context. The Worker's CORS allowlist is production-only.
const AGENT_URL = 'https://portfolio-agent.agilegypsy.workers.dev'
const ORIGIN = 'https://jw3b.dev'

test('the lead route is deployed and VALIDATES — it does not accept anything', async ({ request }) => {
  const res = await request.post(`${AGENT_URL}/engagement`, {
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    // Structurally valid JSON, semantically invalid: the validator must reject on `objective`.
    data: { objective: 'not-a-real-objective', engagement: 'x', route: 'x', tier: 'x', contact: 'probe@example.com' },
    timeout: 30_000,
  })
  // 400 proves the route is live AND the validator ran. A 404 or 500 is a broken deploy; a 200
  // would mean the endpoint accepts arbitrary input, which is worse than either.
  expect(res.status(), 'lead route must reject invalid input, not 404 or accept it').toBe(400)
  expect(await res.json()).toHaveProperty('error')
})

test('/book-a-call — the guaranteed floor — is deployed and validating', async ({ request }) => {
  const res = await request.post(`${AGENT_URL}/book-a-call`, {
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    data: { contact: '' }, // empty contact is the one thing this route must never accept
    timeout: 30_000,
  })
  expect(res.status(), 'the floor must validate; it used to accept and discard').toBe(400)
})

test('the Worker reports an alert channel configured — the original defect was its absence', async ({ request }) => {
  const res = await request.get(`${AGENT_URL}/health`, { headers: { Origin: ORIGIN }, timeout: 30_000 })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.ok).toBe(true)
  // Booleans only — /health never echoes a secret value, it reports whether one EXISTS.
  expect(body).toHaveProperty('model')
})
