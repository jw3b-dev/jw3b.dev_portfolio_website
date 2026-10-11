#!/usr/bin/env node
/*
 * The CV pages (John, 2026-10-11: "v2 now"). The second half of `npm run build`, after `vite build`:
 *
 *   src/content/cv/<slug>.html          →  dist/cv/<slug>.html, served at /cv/<slug>
 *   the fonts each source asks for      →  dist/cv/fonts/, from the @fontsource packages
 *   each page, rendered by Chromium     →  dist/cv/<published name>.pdf, the URLs the CVs were first published at
 *
 * So the PDFs are always rendered from the pages being deployed, and nobody edits a PDF by hand. The rules a
 * page must pass are in src/lib/cvPages.js; any failure stops the build. It needs Playwright's Chromium
 * (`npx playwright install chromium`): without it the build fails rather than ship pages without their PDFs.
 */
import { createServer } from 'node:http'
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { SITE } from '../src/constants/index.js'
import { CV_PAGES, PAGE_CHROME, cvPage, fontFaces, fontPackage, googleFamilies, googleFontLinks } from '../src/lib/cvPages.js'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const OUT = join(DIST, 'cv')
const register = JSON.parse(readFileSync(join(ROOT, 'src/data/evidence-register.json'), 'utf8'))

function fail(lines) {
  console.error(`\n✗ CV BUILD FAILED (${lines.length}):`)
  for (const line of lines) console.error(`  · ${line}`)
  process.exit(1)
}

if (!existsSync(join(DIST, 'index.html'))) fail(['dist/ holds no build: run `vite build` first (`npm run build` runs both)'])

// 1) The pages, and every font file they name.
const errors = []
const fonts = new Map()
const pages = []
for (const cv of CV_PAGES) {
  try {
    const source = readFileSync(join(ROOT, 'src/content/cv', `${cv.slug}.html`), 'utf8')
    const rules = googleFontLinks(source).flatMap(googleFamilies).flatMap(({ family, weights }) =>
      weights.map((weight) => {
        const pkg = join(ROOT, 'node_modules', fontPackage(family))
        const css = join(pkg, `${weight}.css`)
        if (!existsSync(css)) throw new Error(`${family} ${weight} is not installed: npm install ${fontPackage(family)}`)
        const faces = fontFaces(readFileSync(css, 'utf8'), family, weight)
        for (const file of faces.files) fonts.set(file, join(pkg, 'files', file))
        return faces.css
      }))
    const page = cvPage(source, { cv, register, fontCss: rules.join('\n'), origin: SITE.domain })
    errors.push(...page.errors.map((error) => `${cv.slug}: ${error}`))
    pages.push({ cv, html: page.html })
  } catch (error) {
    errors.push(`${cv.slug}: ${error.message}`)
  }
}
if (errors.length) fail(errors)

mkdirSync(join(OUT, 'fonts'), { recursive: true })
for (const { cv, html } of pages) writeFileSync(join(OUT, `${cv.slug}.html`), html)
for (const [file, from] of fonts) copyFileSync(from, join(OUT, 'fonts', file))

// 2) Each page rendered to its PDF, served from dist/ over a local server (Chromium refuses fonts from file://).
const TYPES = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.pdf': 'application/pdf' }
const server = createServer((request, response) => {
  const path = resolve(DIST, `.${decodeURIComponent(new URL(request.url, 'http://localhost').pathname)}`)
  if (!path.startsWith(DIST + sep) || !existsSync(path) || !statSync(path).isFile()) return response.writeHead(404).end()
  response.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(readFileSync(path))
})
await new Promise((listening) => server.listen(0, '127.0.0.1', listening))
const base = `http://127.0.0.1:${server.address().port}`

let browser
try {
  browser = await chromium.launch()
} catch (error) {
  server.close()
  fail([`Chromium would not start, so no PDF was rendered (npx playwright install chromium): ${error.message.split('\n')[0]}`])
}
try {
  for (const { cv } of pages) {
    const page = await browser.newPage({ viewport: { width: 800, height: 600 } })
    const problems = []
    page.on('requestfailed', (request) => problems.push(`${request.url()} failed`))
    page.on('response', (response) => response.status() >= 400 && problems.push(`${response.url()} answered ${response.status()}`))
    page.on('console', (message) => message.type() === 'error' && problems.push(message.text()))
    await page.goto(`${base}/cv/${cv.slug}.html`, { waitUntil: 'networkidle' })
    await page.emulateMedia({ media: 'screen' })
    const broken = await page.evaluate(async () => {
      await document.fonts.ready
      return [...document.fonts].filter((face) => face.status === 'error').map((face) => `${face.family} ${face.weight}`)
    })
    problems.push(...broken.map((face) => `the font ${face} did not load`))
    if (problems.length) throw new Error(`${cv.slug}: ${problems.join('; ')}`)
    await page.evaluate((selector) => document.querySelectorAll(selector).forEach((node) => node.remove()), PAGE_CHROME)
    const pdf = await page.pdf({ format: 'A4', scale: cv.scale, printBackground: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } })
    if (pdf.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${cv.slug}: the render is not a PDF`)
    writeFileSync(join(OUT, cv.pdf), pdf)
    await page.close()
    console.log(`✓ /cv/${cv.slug} → /cv/${cv.pdf} (${Math.round(pdf.length / 1024)} KB)`)
  }
} catch (error) {
  errors.push(error.message)
} finally {
  await browser.close()
  server.close()
}
if (errors.length) fail(errors)
console.log(`✓ CV pages: ${pages.length} pages, ${pages.length} PDFs, ${fonts.size} font files`)
