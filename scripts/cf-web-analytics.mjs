#!/usr/bin/env node
/*
 * cf-web-analytics — turn Cloudflare Web Analytics' automatic beacon injection OFF for a zone.
 *
 * WHY. jw3b.dev serves a strict CSP with no 'unsafe-inline' and no third-party script hosts. The
 * zone injects `static.cloudflareinsights.com/beacon.min.js` at the edge anyway (one-click setup
 * on a proxied zone), the browser blocks it, and every page load logs two CSP errors. Product
 * audit finding 23. The fix is a zone/account setting, NOT code: widening script-src to admit the
 * beacon would trade a console error for an unrequested tracker on a site whose whole argument is
 * that it does not do that.
 *
 * WHAT IT DOES. Sets `auto_install: false` on the RUM site — the least destructive option and
 * fully reversible from the dashboard. It does NOT delete the site or the historical data.
 *
 * DRY RUN BY DEFAULT. Prints what it would change; `--apply` is required to write anything.
 *
 * CREDENTIAL. Read from CLOUDFLARE_API_TOKEN in the environment. Never printed, never logged, and
 * never committed — pull it from Infisical at call time:
 *
 *   CLOUDFLARE_API_TOKEN=$(infisical secrets get CLOUDFLARE_API_TOKEN --plain) \
 *     node scripts/cf-web-analytics.mjs --apply
 *
 * REQUIRED PERMISSION. None of the tokens on this machine have it (checked 2026-08-23: three valid
 * Cloudflare tokens, all denied on /rum/site_info/list; the wrangler OAuth session carries only
 * account:read, user:read, workers, d1, pages). Mint or extend a token with the ACCOUNT-level
 * Web Analytics / Account Analytics WRITE permission.
 */
/*
 * ✎ 2026-08-23 — the account is DISCOVERED, never assumed.
 *
 * The first version hardcoded the account id from `wrangler whoami` and reported "RUM denied" for
 * three perfectly good tokens. They were not denied: they belong to a DIFFERENT Cloudflare account
 * (the KTHULHU one), where the RUM site is kthulhu.co. jw3b.dev lives on the AgileGypsy account,
 * which those tokens cannot see. A wrong account id and a missing permission produce the identical
 * 403, so the assumption was invisible in the error.
 *
 * So: enumerate the accounts the token can actually see, and print them. An operator staring at a
 * list of real accounts cannot make the mistake I made.
 */
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || null
const HOST = process.env.CF_TARGET_HOST || 'jw3b.dev'
const APPLY = process.argv.includes('--apply')
const API = 'https://api.cloudflare.com/client/v4'

const token = process.env.CLOUDFLARE_API_TOKEN
if (!token) {
  console.error('✗ CLOUDFLARE_API_TOKEN is not set.\n' +
    '  CLOUDFLARE_API_TOKEN=$(infisical secrets get CLOUDFLARE_API_TOKEN --plain) node scripts/cf-web-analytics.mjs')
  process.exit(2)
}

const call = async (path, init = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
  })
  let body
  try { body = await res.json() } catch { body = null }
  return { ok: res.ok, status: res.status, body }
}

// Which accounts can this token even see? Printed, because "wrong account" and "missing
// permission" are the same 403 and only this distinguishes them.
const accounts = await call('/accounts')
if (accounts.ok && accounts.body?.success) {
  const rows = accounts.body.result || []
  console.log(`Token can see ${rows.length} account(s):`)
  for (const a of rows) console.log(`  ${a.id}  ${a.name}`)
} else {
  console.log('Token cannot list accounts (needs account:read) — proceeding with the id given.')
}

const accountId = ACCOUNT_ID || (accounts.body?.result || [])[0]?.id
if (!accountId) {
  console.error('✗ No account id: pass CLOUDFLARE_ACCOUNT_ID, or use a token that can list accounts.')
  process.exit(2)
}

// Fail on the PERMISSION, clearly, rather than on a confusing downstream 404.
const list = await call(`/accounts/${accountId}/rum/site_info/list`)
if (!list.ok || !list.body?.success) {
  const errs = (list.body?.errors || []).map((e) => `${e.code} ${e.message}`).join('; ')
  console.error(`✗ Cannot read RUM sites (HTTP ${list.status}): ${errs || 'unknown error'}`)
  console.error('  Either the token lacks the account-level Web Analytics permission, or this is')
  console.error('  the wrong account — those produce the SAME 403. Check the account list above.')
  process.exit(1)
}

const sites = list.body.result || []
console.log(`Found ${sites.length} RUM site(s) on account ${accountId}:`)
for (const s of sites) {
  const zone = s.ruleset?.zone_name || s.ruleset?.zone_tag || '(no zone)'
  console.log(`  ${s.site_tag}  zone=${zone}  auto_install=${s.auto_install}  ruleset_enabled=${s.ruleset?.enabled}`)
}

const target = sites.filter((s) => (s.ruleset?.zone_name || '').includes(HOST))
if (target.length === 0) {
  console.log(`\nNo RUM site matches "${HOST}". Nothing to do — the injection may come from another zone.`)
  process.exit(0)
}

for (const s of target) {
  if (s.auto_install === false) {
    console.log(`\n${s.site_tag}: auto_install already false — nothing to change.`)
    continue
  }
  if (!APPLY) {
    console.log(`\n[dry run] would set auto_install=false on ${s.site_tag} (${s.ruleset?.zone_name}).`)
    console.log('          re-run with --apply to make the change.')
    continue
  }
  const out = await call(`/accounts/${accountId}/rum/site_info/${s.site_tag}`, {
    method: 'PUT',
    body: JSON.stringify({ zone_tag: s.ruleset?.zone_tag, auto_install: false }),
  })
  if (out.ok && out.body?.success) {
    console.log(`\n✓ ${s.site_tag}: auto_install set to false. The beacon will stop being injected.`)
    console.log('  Reversible from the dashboard: Web Analytics → Manage Site → enable automatic setup.')
  } else {
    const errs = (out.body?.errors || []).map((e) => `${e.code} ${e.message}`).join('; ')
    console.error(`\n✗ ${s.site_tag}: update failed (HTTP ${out.status}): ${errs || 'unknown error'}`)
    process.exit(1)
  }
}
