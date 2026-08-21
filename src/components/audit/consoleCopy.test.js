import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'fs'
import { resolve, join } from 'path'
import { CONSOLE_SECTIONS, section, INSTANT_SCREEN_BRIDGE } from './consoleCopy.js'

/*
 * The console's vocabulary has ONE source, and the surfaces around it must not contradict it.
 *
 * The defect this prevents, in the owner's words: "the old heading still talks about the
 * heuristics but the section is now called instant screen with nothing talking about it being the
 * same section … the page was not updated along with the updated auditor."
 *
 * The redesign renamed the console's sections and was scoped to the console's own components, so
 * /audit went on introducing the tool with vocabulary the tool no longer used. Nothing structural
 * connected the two, so nothing failed. These tests are that connection.
 */
const SRC = resolve(__dirname, '../../..', 'src')
const read = (p) => readFileSync(resolve(SRC, p), 'utf8')

/** Every .jsx under src/, so the "live" rule is checked site-wide, not on a hand-listed few. */
function jsxFiles(dir = SRC) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) return entry === 'archive' ? [] : jsxFiles(full)
    return /\.jsx$/.test(full) && !/\.test\.jsx$/.test(full) ? [full] : []
  })
}

describe('console copy — one source for the four steps', () => {
  it('has exactly four numbered sections, each with a title and a cost line', () => {
    expect(CONSOLE_SECTIONS).toHaveLength(4)
    CONSOLE_SECTIONS.forEach((s, i) => {
      expect(s.n).toBe(String(i + 1))
      expect(s.title.length).toBeGreaterThan(0)
      // The brief's hard constraint: a section that doesn't say what it costs does not ship.
      expect(s.cost.length, `section ${s.n} has no cost line`).toBeGreaterThan(0)
      expect(s.blurb.length, `section ${s.n} has no blurb for the How-it-works strip`).toBeGreaterThan(0)
    })
  })

  it('names the steps the visitor actually sees', () => {
    expect(CONSOLE_SECTIONS.map((s) => s.title)).toEqual([
      'Your contract',
      'Instant screen',
      'AI analysis',
      'AI analyses',
    ])
  })

  it('uses the identical noun phrase for the run button and the history heading', () => {
    // "Run AI analysis" (button) vs "AI analyses (2)" (history): one noun, singular and plural —
    // NOT two different names for one thing, which is what "Analyses (2)" vs "Run AI analysis"
    // was. Compare the stem so the plural is allowed and a rename is not.
    const stem = (t) => t.toLowerCase().replace(/(is|es)$/, '')
    expect(stem(section('4').title)).toBe(stem(section('3').title))
  })

  it('section() resolves by number and returns undefined otherwise', () => {
    expect(section(2).title).toBe('Instant screen')
    expect(section('2').title).toBe('Instant screen')
    expect(section(9)).toBeUndefined()
  })
})

describe('the console and its wrappers render FROM the shared source', () => {
  it('AuditConsole and RunTabs import it rather than restating names', () => {
    for (const f of ['components/audit/AuditConsole.jsx', 'components/audit/RunTabs.jsx']) {
      expect(read(f), `${f} must import consoleCopy`).toMatch(/from '\.\/consoleCopy\.js'/)
    }
  })

  it('the /audit page explains the workflow from the same array', () => {
    const page = read('pages/Audit.jsx')
    expect(page).toMatch(/CONSOLE_SECTIONS/)
    expect(page).toMatch(/INSTANT_SCREEN_BRIDGE/)
    expect(page).toMatch(/How screening a contract works/)
  })

  it('the page bridges the old term to the new name exactly once', () => {
    // A reader who knew "heuristic pass" must be able to learn it is the same thing…
    expect(INSTANT_SCREEN_BRIDGE).toMatch(/heuristic/i)
    expect(INSTANT_SCREEN_BRIDGE).toMatch(/instant screen/i)
    // …and the page must not then keep using the old term as a name.
    const page = read('pages/Audit.jsx')
    const jsxText = page.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/^\s*\/\*[\s\S]*?\*\//m, '')
    expect(jsxText).not.toMatch(/deterministic heuristics|heuristic pass|heuristic pre-screen/i)
  })
})

describe('"live" means model provenance, and nothing else', () => {
  // The single worst thing on the old page: "Heuristic pass · live" (updates as you type) sitting
  // above run badges reading "live" (came from the live model). One word, two meanings, one
  // screen. The free tier is INSTANT — permanently.
  const ALLOWED = /live model|live agent|live voice|liveness|Live —|olive|delivered|deliver/i

  it.each(jsxFiles().map((f) => [f.slice(SRC.length + 1), f]))('%s never calls the free tier "live"', (_name, file) => {
    // Comments legitimately QUOTE the banned copy while explaining why it is banned, so strip
    // them: this rule is about what a visitor reads, not what a maintainer reads.
    const text = readFileSync(file, 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^\s*\/\/.*$/gm, '')
    const offenders = [...text.matchAll(/[^\n]*\blive\b[^\n]*/gi)]
      .map((m) => m[0].trim())
      .filter((line) => /heuristic|instant screen|pattern (screen|match)/i.test(line))
      .filter((line) => !ALLOWED.test(line))
    expect(offenders, `"live" must describe model provenance only:\n${offenders.join('\n')}`).toEqual([])
  })
})
