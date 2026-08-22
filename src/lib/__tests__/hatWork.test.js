/*
 * hatWork (brief 03, next-needs 1 and 2).
 *
 * The load-bearing rule: a hat that surfaces no work is an identity claim with nothing behind it —
 * the exact shape this site refuses everywhere else. So coverage is asserted against the CANONICAL
 * hats rather than against this file's own keys, which would be circular.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { workForHat, HAT_WORK_KEYS, CANONICAL_HAT_KEYS } from '../hatWork.js'

describe('hatWork — every hat has work behind it', () => {
  it('covers all four canonical hats, and invents none', () => {
    expect([...HAT_WORK_KEYS].sort()).toEqual([...CANONICAL_HAT_KEYS].sort())
  })

  it.each(CANONICAL_HAT_KEYS)('%s surfaces at least one piece of work', (key) => {
    expect(workForHat(key).length).toBeGreaterThan(0)
  })

  it('every entry names itself, explains itself, and goes somewhere', () => {
    for (const key of CANONICAL_HAT_KEYS) {
      for (const item of workForHat(key)) {
        expect(item.label.trim()).not.toBe('')
        expect(item.detail.trim()).not.toBe('')
        expect(item.href).toMatch(/^(\/|#)/) // internal only — a hat must not navigate off-site
      }
    }
  })

  it('the PM hat carries the delivery record — FR-060 keeps it out of the flagships, not orphaned', () => {
    const labels = workForHat('pm').map((i) => i.label)
    expect(labels.some((l) => /delivery record/i.test(l))).toBe(true)
  })

  it('returns an empty list for an unknown hat rather than throwing', () => {
    expect(workForHat('nope')).toEqual([])
    expect(workForHat()).toEqual([])
    expect(workForHat(null)).toEqual([])
  })
})

describe('hatWork — every link lands somewhere that exists', () => {
  /*
   * The header claims entries point at surfaces already on the page. A comment cannot enforce
   * that: rename a section and every hat link to it becomes a scroll to nothing, silently. So the
   * fragments are checked against the real `id="…"` attributes in the tree, and the routes against
   * the router.
   */
  const SRC = join(process.cwd(), 'src')

  const jsxFiles = (dir, acc = []) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name)
      if (statSync(full).isDirectory()) jsxFiles(full, acc)
      else if (/\.jsx$/.test(name) && !/\.test\.jsx$/.test(name)) acc.push(full)
    }
    return acc
  }

  const allIds = new Set(
    jsxFiles(SRC)
      .flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/\bid="([^"]+)"/g)].map((m) => m[1])),
  )
  const routes = readFileSync(join(SRC, 'App.jsx'), 'utf8')

  it('every fragment target is a real id rendered somewhere', () => {
    for (const key of CANONICAL_HAT_KEYS) {
      for (const { href, label } of workForHat(key)) {
        const frag = href.split('#')[1]
        if (!frag) continue
        expect(allIds.has(frag), `${label} → #${frag} is not rendered anywhere`).toBe(true)
      }
    }
  })

  it('every route target is registered in the router', () => {
    for (const key of CANONICAL_HAT_KEYS) {
      for (const { href, label } of workForHat(key)) {
        const path = href.split('#')[0]
        if (!path || path === '/') continue
        expect(routes.includes(`'${path}'`), `${label} → ${path} is not a registered route`).toBe(true)
      }
    }
  })
})
