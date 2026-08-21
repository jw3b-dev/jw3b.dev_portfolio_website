import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

/*
 * ONE deploy target, and it is production.
 *
 * The project ran an isolated `-v2` preview alongside production for months. It sounded prudent
 * and cost more than it saved: "is that fixed?" depended on which of two URLs you had open, the
 * preview drifted from production in ways nobody tracked, and a fix verified on one could be
 * absent from the other. The preview worker was deleted on 2026-08-21.
 *
 * This guard exists because that arrangement came back once already, as a default: both wrangler
 * configs were NAMED for the preview, so a bare `wrangler deploy` quietly created a second live
 * site. A config default is not a comment — it is what happens when someone is in a hurry.
 */
const root = resolve(__dirname, '../..')
const read = (p) => readFileSync(resolve(root, p), 'utf8')

const CI = read('.github/workflows/ci.yml')
const SPA_CONFIG = read('wrangler.jsonc')
const AGENT_CONFIG = read('workers/portfolio-agent/wrangler.toml')

describe('deploy targets — exactly one, and it is production', () => {
  it('names production in both wrangler configs, so a bare `wrangler deploy` cannot invent a second site', () => {
    expect(SPA_CONFIG).toMatch(/"name":\s*"jw3b-dev-site"/)
    expect(AGENT_CONFIG).toMatch(/^name\s*=\s*"portfolio-agent"/m)
  })

  it('has no `-v2` deploy target left anywhere in the deploy surface', () => {
    for (const [file, text] of [
      ['ci.yml', CI],
      ['wrangler.jsonc', SPA_CONFIG],
      ['wrangler.toml', AGENT_CONFIG],
    ]) {
      // Prose may mention the retired preview; a NAME or --name flag may not.
      const live = text
        .split('\n')
        .filter((l) => !/^\s*(#|\/\/)/.test(l))
        .join('\n')
      expect(live, `${file} still targets a -v2 instance`).not.toMatch(/jw3b-dev-site-v2|portfolio-agent-v2/)
    }
  })

  it('deploys only from the release branch, and only after the full gate', () => {
    expect(CI).toMatch(/deploy --name portfolio-agent --config wrangler\.toml/)
    expect(CI).toMatch(/deploy --name jw3b-dev-site --config wrangler\.jsonc/)
    // Both deploy jobs gated on the same branch condition and on the verifying jobs.
    const deployGuards = CI.match(/if:\s*github\.event_name == 'push' && github\.ref == 'refs\/heads\/v2'/g) || []
    expect(deployGuards.length).toBeGreaterThanOrEqual(2)
    expect(CI).toMatch(/needs:\s*\[verify, e2e, contracts\]/)
  })

  it('keeps the CORS allowlist to production origins only', () => {
    const origins = AGENT_CONFIG.match(/ALLOWED_ORIGINS\s*=\s*"([^"]+)"/)?.[1] ?? ''
    expect(origins).toContain('https://jw3b.dev')
    expect(origins).not.toMatch(/-v2/)
  })
})
