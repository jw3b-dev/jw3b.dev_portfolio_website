/*
 * The 390px stacking order (brief 00, next-need 2).
 *
 * `layout-and-assets.spec.js` asserts the hire spine and concierge launcher never cover a footer
 * link — that is the FLOOR, not the design. The intended z-order was implicit: four fixed elements,
 * two of them using raw `z-40`/`z-50` that happened to match the token values, and the consent
 * banner TIED with the nav at 40 with no defined winner.
 *
 * This pins the order by reading the source, because the thing being protected is that the tokens
 * are used at all — a raw `z-50` renders identically today and silently forks the system.
 *
 *   nav (40) < overlay (50) < toast (60)
 *
 * The banner sits at `toast`: it is a blocking compliance notice, so it must be able to cover the
 * nav rather than tie with it.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = join(process.cwd(), 'src')
const read = (rel) => readFileSync(join(ROOT, rel), 'utf8')

const FIXED_SURFACES = [
  { file: 'components/layout/HireSpine.jsx', token: 'z-nav' },
  { file: 'components/chat/ChatWidget.jsx', token: 'z-overlay' },
  { file: 'components/compliance/ConsentBanner.jsx', token: 'z-toast' },
]

describe('fixed-position surfaces use the z-index TOKENS, never raw values', () => {
  it.each(FIXED_SURFACES.map((s) => [s.file, s]))('%s uses its semantic token', (_f, s) => {
    expect(read(s.file)).toContain(s.token)
  })

  it('no fixed surface carries a raw z-<number> — that is a silent fork of the token system', () => {
    for (const s of FIXED_SURFACES) {
      const raw = read(s.file).match(/\bz-\d+\b/g)
      expect(raw, `${s.file} uses raw ${raw}`).toBeNull()
    }
  })

  it('the tokens are actually defined, and strictly ordered nav < overlay < toast', () => {
    // A token that resolves to nothing would make every one of the above vacuous.
    const css = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')
    const val = (name) => {
      const m = css.match(new RegExp(`--z-${name}:\\s*(\\d+)`))
      expect(m, `--z-${name} is not defined`).toBeTruthy()
      return Number(m[1])
    }
    expect(val('nav')).toBeLessThan(val('overlay'))
    expect(val('overlay')).toBeLessThan(val('toast'))
  })
})
