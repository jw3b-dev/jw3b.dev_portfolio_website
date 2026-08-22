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
import { NOTES } from '../lib/notesIndex.js'

const locs = [...sitemap.matchAll(/<loc>https:\/\/jw3b\.dev(\/[^<]*)<\/loc>/g)].map((m) => (m[1] === '/' ? '/' : m[1]))
// P5-04: two classes of path are NOT crawlable URLs and must be excluded before comparing.
//  * ':slug' — a parameter, not a page. The concrete note URLs are checked separately below.
//  * '/notes' — registered only when a note exists (App.jsx spreads it behind HAS_NOTES), and
//    this guard reads App.jsx SOURCE, so the literal is present even when the route is not.
const routes = [...appSrc.matchAll(/path:\s*'([^']+)'/g)]
  .map((m) => m[1])
  .filter((p) => p !== '*' && !p.includes(':') && p !== '/notes')

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
    const notePaths = new Set([...NOTES.map((n) => n.path), ...(NOTES.length ? ['/notes'] : [])])
    const orphan = locs.filter((l) => !routes.includes(l) && !notePaths.has(l))
    expect(orphan, `sitemap lists unregistered routes: ${orphan.join(', ')}`).toEqual([])
  })

  // P5-04 — the content pipeline's half of the drift guard: publishing a note must not silently
  // skip the sitemap. Adding a markdown file is the whole publishing step, so the sitemap entry
  // is the one thing that can still be forgotten — which is exactly what a gate is for.
  it('covers every published note, and lists none when nothing is published', () => {
    const notePaths = NOTES.map((n) => n.path)
    const missing = notePaths.filter((p) => !locs.includes(p))
    expect(missing, `published notes missing from sitemap.xml: ${missing.join(', ')}`).toEqual([])

    const indexListed = locs.includes('/notes')
    if (NOTES.length > 0) {
      expect(indexListed, '/notes is a live route but is not in sitemap.xml').toBe(true)
    } else {
      expect(indexListed, '/notes is in sitemap.xml but no note is published').toBe(false)
      expect(locs.filter((l) => l.startsWith('/notes/'))).toEqual([])
    }
  })

  it('robots.txt allows crawling and references the sitemap', () => {
    expect(robots).toMatch(/User-agent:\s*\*/)
    expect(robots).toMatch(/Allow:\s*\//)
    expect(robots).toContain('Sitemap: https://jw3b.dev/sitemap.xml')
  })
})
