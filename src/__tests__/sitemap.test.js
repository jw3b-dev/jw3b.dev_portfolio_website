/*
 * P4-03 SEO — sitemap/robots integrity + a DRIFT GUARD against the App router.
 * Reads App.jsx source, extracts every registered path, and asserts each crawlable route
 * (not the '*' wildcard) has a <loc> in public/sitemap.xml — so adding a route without a
 * sitemap entry fails CI. Also asserts robots.txt points at the sitemap.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (rel) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8')
const sitemap = read('../../public/sitemap.xml')
const robots = read('../../public/robots.txt')
const appSrc = read('../App.jsx')

const locs = [...sitemap.matchAll(/<loc>https:\/\/jw3b\.dev(\/[^<]*)<\/loc>/g)].map((m) => (m[1] === '/' ? '/' : m[1]))
const routes = [...appSrc.matchAll(/path:\s*'([^']+)'/g)].map((m) => m[1]).filter((p) => p !== '*')

describe('sitemap.xml (P4-03)', () => {
  it('is valid XML with a urlset and at least the home route', () => {
    expect(sitemap).toMatch(/<\?xml/)
    expect(sitemap).toContain('<urlset')
    expect(locs).toContain('/')
  })

  it('covers every crawlable App route (drift guard)', () => {
    const missing = routes.filter((r) => !locs.includes(r))
    expect(missing, `routes missing from sitemap.xml: ${missing.join(', ')}`).toEqual([])
  })

  it('lists no route that is not registered in the router', () => {
    const orphan = locs.filter((l) => !routes.includes(l))
    expect(orphan, `sitemap lists unregistered routes: ${orphan.join(', ')}`).toEqual([])
  })

  it('robots.txt allows crawling and references the sitemap', () => {
    expect(robots).toMatch(/User-agent:\s*\*/)
    expect(robots).toMatch(/Allow:\s*\//)
    expect(robots).toContain('Sitemap: https://jw3b.dev/sitemap.xml')
  })
})
