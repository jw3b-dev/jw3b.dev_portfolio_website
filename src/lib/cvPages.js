/*
 * jw3b.dev v2 — the CV pages (John, 2026-10-11: "v2 now")  ·  frontend-engineer + portfolio-evidence
 *
 * Pure logic behind scripts/build-cv.mjs. John's CVs are HTML documents: their sources live in
 * src/content/cv/<slug>.html, and the build turns each into the page at /cv/<slug>, then renders that
 * page to the PDF at the URL the CVs were first published at. No I/O here: the script reads the files,
 * the register and the font CSS, and calls these.
 *
 * The build stops on any of three things:
 *  - something the site's CSP would block. Fonts load from 'self' only, so the Google Fonts link a
 *    source carries is replaced by @font-face rules for the same families and weights, served from
 *    /cv/fonts/. Any other remote stylesheet, font or embed, and any script, is refused.
 *  - a figure bound to the register (data-claim="<id>") that is not a cleared claim, or whose numbers
 *    are not in the claim's value, in order. When the register moves, the build stops until the CV
 *    follows it, so a stale figure cannot ship.
 *  - a phrase the register forbids, anywhere in a CV's text (the claims gate's own scanner).
 */
import { isCleared, scanTextForForbidden } from './claimsValidate.js'

/** The three CVs: the page's slug, the PDF's published name, and the scale it prints at. */
export const CV_PAGES = Object.freeze([
  // Laid out 880 px wide: 0.9 fits that width on A4, as in the original four-page version.
  Object.freeze({ slug: 'ai-agentic-developer', pdf: 'John_Wellard_AI_Agentic_Developer_CV.pdf', scale: 0.9 }),
  Object.freeze({ slug: 'blockchain-engineer', pdf: 'John_Wellard_Blockchain_Engineer_CV.pdf', scale: 1 }),
  Object.freeze({ slug: 'web3-pm', pdf: 'John_Wellard_Web3_PM_CV.pdf', scale: 1 }),
])

/**
 * The unicode subsets self-hosted for each face. Every character the CVs set is in one of these, or in
 * no subset Google serves for these families either (arrows, emoji), so the fallback font is the same.
 */
export const FONT_SUBSETS = Object.freeze(['latin', 'latin-ext'])

/** What the PDF render removes from the page first: the page's own link to its PDF. */
export const PAGE_CHROME = '[data-cv-chrome]'

const GOOGLE_STYLESHEET = /<link\b[^>]*\bhref="(https:\/\/fonts\.googleapis\.com\/css2\?[^"]*)"[^>]*>/gi
const GOOGLE_PRECONNECT = /[ \t]*<link\b[^>]*\bhref="https:\/\/fonts\.(?:googleapis|gstatic)\.com\/?"[^>]*>[ \t]*\r?\n?/gi

/** The Google Fonts stylesheets a source links, in order, with `&amp;` read as `&`. */
export function googleFontLinks(html) {
  return [...html.matchAll(GOOGLE_STYLESHEET)].map(([, href]) => href.replace(/&amp;/g, '&'))
}

/** The families and weights one css2 link asks for: `family=Space+Mono:wght@400;700` → Space Mono, [400, 700]. */
export function googleFamilies(href) {
  return new URL(href).searchParams.getAll('family').map((spec) => {
    const [family, axes] = spec.split(':')
    if (axes === undefined) return { family, weights: [400] }
    const weights = /^wght@(\d{3}(?:;\d{3})*)$/.exec(axes)
    if (!weights) throw new Error(`${family}: the axes "${axes}" cannot be self-hosted; only wght@ weights can`)
    return { family, weights: weights[1].split(';').map(Number) }
  })
}

/** The npm package that carries a Google family: Space Mono → @fontsource/space-mono. */
export const fontPackage = (family) => `@fontsource/${family.toLowerCase().replace(/\s+/g, '-')}`

/**
 * One weight's @font-face rules from its fontsource CSS, kept for FONT_SUBSETS only and pointed at
 * fonts/<file>: relative to the page, so it renders the same from the site and from the build's own
 * local server. Returns the CSS and the files it names.
 */
export function fontFaces(css, family, weight) {
  const name = fontPackage(family).slice('@fontsource/'.length)
  const faces = []
  for (const [, body] of css.matchAll(/@font-face\s*\{([^}]*)\}/g)) {
    const file = /url\(\.\/files\/([^)]+?\.woff2)\)/.exec(body)?.[1]
    if (!FONT_SUBSETS.some((subset) => file === `${name}-${subset}-${weight}-normal.woff2`)) continue
    faces.push({ file, css: `@font-face {${body.replace(/src:[^;]*;/, `src: url(fonts/${file}) format('woff2');`)}}` })
  }
  if (!faces.length) throw new Error(`${family} ${weight}: its fontsource CSS has no ${FONT_SUBSETS.join(' or ')} face`)
  return { css: faces.map((face) => face.css).join('\n'), files: faces.map((face) => face.file) }
}

/** The source with its Google Fonts links gone: one <style> of self-hosted rules where the first stylesheet was. */
export function selfHostFonts(html, fontCss) {
  let first = true
  return html.replace(GOOGLE_PRECONNECT, '').replace(GOOGLE_STYLESHEET, () => {
    if (!first) return ''
    first = false
    return `<style>\n${fontCss}\n</style>`
  })
}

/** Everything in a page that would reach off the site. None may remain once the fonts are self-hosted. */
export function externalReferences(html) {
  return [
    ...html.matchAll(/<(?:script|iframe|object|embed)\b[^>]*>/gi),
    ...html.matchAll(/<link\b[^>]*\bhref="(?:https?:)?\/\/[^"]*"[^>]*>/gi),
    ...html.matchAll(/\bsrc(?:set)?="(?:https?:)?\/\/[^"]*"/gi),
    ...html.matchAll(/@import\b[^;]*;|url\(\s*['"]?(?:https?:)?\/\/[^)]*\)/gi),
  ].map(([reference]) => reference.replace(/\s+/g, ' '))
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** A page's text as a reader sees it: no markup, styles or comments; entities decoded; whitespace collapsed. */
export function visibleText(html) {
  return html
    .replace(/<(style|script)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (entity, dec, hex, name) => {
      if (dec) return String.fromCodePoint(Number(dec))
      if (hex) return String.fromCodePoint(parseInt(hex, 16))
      return ENTITIES[name.toLowerCase()] ?? entity
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/** The numbers in a text, in order: "1,430 EXP · 7 High" → [1430, 7]. */
export const numbersIn = (text) => [...text.matchAll(/\d[\d,]*(?:\.\d+)?/g)].map(([n]) => Number(n.replace(/,/g, '')))

/** Whether every one of `figures` appears in `value`, in the same order. */
export function inOrder(figures, value) {
  let next = 0
  for (const n of value) if (n === figures[next]) next += 1
  return next === figures.length
}

const BOUND = /<([a-z][a-z0-9]*)\b[^>]*\bdata-claim="([^"]*)"[^>]*>([\s\S]*?)<\/\1\s*>/gi

/**
 * Every figure the page binds to the register. A binding passes when its claim is cleared (the claims
 * gate's own rule) and the figures it shows are in the claim's value, in order: "7 High · 4 Medium ·
 * 3 Low" passes against "14 validated findings across 7 First Flights — 7 High, 4 Medium, 3 Low".
 */
export function checkClaimBindings(html, register) {
  const claims = new Map(register.claims.map((claim) => [claim.id, claim]))
  const errors = []
  const bound = []
  for (const [, , id, inner] of html.matchAll(BOUND)) {
    const shown = visibleText(inner)
    const claim = claims.get(id)
    bound.push(id)
    if (!claim) errors.push(`data-claim="${id}" names no register entry`)
    else if (!isCleared(claim)) errors.push(`data-claim="${id}" is not a cleared claim, so it cannot be shown`)
    else if (!numbersIn(shown).length) errors.push(`data-claim="${id}" binds "${shown}", which shows no figure`)
    else if (!inOrder(numbersIn(shown), numbersIn(claim.value))) {
      errors.push(`"${shown}" is bound to ${id}, but the register's value is now "${claim.value}"`)
    }
  }
  const declared = html.match(/\bdata-claim=/gi)?.length ?? 0
  if (declared > bound.length) {
    errors.push(`${declared - bound.length} data-claim attribute(s) could not be read: each needs an element with its own closing tag`)
  }
  return { errors, bound }
}

/** The forbidden phrases a page's text carries, each quoted with the words around it. */
export function forbiddenPhrases(html) {
  const text = visibleText(html)
  return scanTextForForbidden(text).map((source) => {
    const at = text.search(new RegExp(source, 'i'))
    return `"${text.slice(Math.max(0, at - 40), at + 60).trim()}" (rule /${source}/)`
  })
}

const PDF_LINK_STYLE = `
  .cv-pdf-link { position: absolute; top: 8px; right: 8px; padding: 6px 12px; border: 1px solid currentColor;
    border-radius: 4px; background: var(--bg-dark, #030014); color: var(--neon-cyan, #00f3ff); text-decoration: none;
    font: 700 11px/1.2 'Space Mono', monospace; letter-spacing: 0.08em; text-transform: uppercase; }
  .cv-pdf-link:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  @media print { .cv-pdf-link { display: none; } }`

/**
 * The page as served: its canonical URL, the PDF as its alternate, no favicon request (as the SPA), and a
 * link to the PDF that the render removes again (PAGE_CHROME).
 */
export function withPageChrome(html, { slug, pdf, origin }) {
  if (!/<\/head>/i.test(html) || !/<body\b[^>]*>/i.test(html)) throw new Error(`${slug}: a CV source needs a <head> and a <body>`)
  const head = [
    `<link rel="canonical" href="${origin}/cv/${slug}">`,
    `<link rel="alternate" type="application/pdf" href="${pdf}">`,
    '<link rel="icon" href="data:,">',
    `<style>${PDF_LINK_STYLE}\n</style>`,
  ].join('\n')
  const link = `\n<a class="cv-pdf-link" data-cv-chrome href="${pdf}" download>Download PDF</a>`
  return html.replace(/<\/head>/i, `${head}\n</head>`).replace(/<body\b[^>]*>/i, (body) => `${body}${link}`)
}

/** One CV source → the page served at /cv/<slug>, and every reason it may not ship. */
export function cvPage(source, { cv, register, fontCss, origin }) {
  const page = selfHostFonts(source, fontCss)
  const errors = [
    ...externalReferences(page).map((reference) => `reaches off the site, which the CSP blocks: ${reference}`),
    ...checkClaimBindings(page, register).errors,
    ...forbiddenPhrases(page).map((phrase) => `carries a phrase the register forbids: ${phrase}`),
  ]
  return { html: withPageChrome(page, { slug: cv.slug, pdf: cv.pdf, origin }), errors }
}
