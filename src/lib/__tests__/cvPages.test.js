/*
 * The CV pages (John, 2026-10-11: "v2 now") — src/lib/cvPages.js, the pure half of scripts/build-cv.mjs.
 * The last block runs John's three real sources through every rule, so a CV edit that would fail the build
 * fails here first, with the same message.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  CV_PAGES, FONT_SUBSETS, PAGE_CHROME, googleFontLinks, googleFamilies, fontPackage, fontFaces, selfHostFonts,
  externalReferences, visibleText, numbersIn, inOrder, checkClaimBindings, forbiddenPhrases, withPageChrome, cvPage,
} from '../cvPages.js'

const ROOT = resolve(__dirname, '../../..')
const register = JSON.parse(readFileSync(resolve(ROOT, 'src/data/evidence-register.json'), 'utf8'))
const source = (slug) => readFileSync(resolve(ROOT, 'src/content/cv', `${slug}.html`), 'utf8')

const GOOGLE = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400&amp;family=Space+Mono:wght@700&amp;display=swap'
const SOURCE = `<!DOCTYPE html><html><head>
    <link rel="preconnect" href="https://fonts.googleapis.com/">
    <link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin="">
    <link
        href="${GOOGLE}"
        rel="stylesheet">
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500" rel="stylesheet">
    <style>body { color: red; }</style>
</head>
<body class="cv"><h1>John Wellard</h1></body></html>`

const face = (file, range = 'U+0000-00FF') =>
  `/* ${file} */\n@font-face {\n  font-family: 'Inter';\n  font-weight: 400;\n  src: url(./files/${file}.woff2) format('woff2'), url(./files/${file}.woff) format('woff');\n  unicode-range: ${range};\n}\n`

describe('CV_PAGES — the three CVs, at the URLs they were first published at', () => {
  it('names each page once, each PDF by its published name, and a source for every page', () => {
    expect(CV_PAGES.map((cv) => cv.slug)).toEqual(['ai-agentic-developer', 'blockchain-engineer', 'web3-pm'])
    expect(CV_PAGES.map((cv) => cv.pdf)).toEqual([
      'John_Wellard_AI_Agentic_Developer_CV.pdf', 'John_Wellard_Blockchain_Engineer_CV.pdf', 'John_Wellard_Web3_PM_CV.pdf',
    ])
    for (const cv of CV_PAGES) expect(source(cv.slug)).toMatch(/<\/head>/)
    expect(Object.isFrozen(CV_PAGES[0])).toBe(true)
  })

  it('prints the 880 px agentic CV at 0.9 and the others at 1', () => {
    expect(CV_PAGES.map((cv) => cv.scale)).toEqual([0.9, 1, 1])
  })
})

describe('fonts — self-hosted, because the CSP allows fonts from the site only', () => {
  it('reads the css2 links a source carries, and no preconnect', () => {
    expect(googleFontLinks(SOURCE)).toEqual([GOOGLE.replace(/&amp;/g, '&'), 'https://fonts.googleapis.com/css2?family=Outfit:wght@500'])
    expect(googleFontLinks('<p>no fonts</p>')).toEqual([])
  })

  it('reads the families and weights a link asks for', () => {
    expect(googleFamilies(googleFontLinks(SOURCE)[0])).toEqual([
      { family: 'Inter', weights: [300, 400] },
      { family: 'Space Mono', weights: [700] },
    ])
    expect(googleFamilies('https://fonts.googleapis.com/css2?family=Outfit')).toEqual([{ family: 'Outfit', weights: [400] }])
  })

  it('refuses an axis it cannot self-host, rather than drop it', () => {
    expect(() => googleFamilies('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;1,400')).toThrow(/cannot be self-hosted/)
  })

  it('names the package that carries a family', () => {
    expect(fontPackage('Space Mono')).toBe('@fontsource/space-mono')
    expect(fontPackage('Inter')).toBe('@fontsource/inter')
  })

  it('keeps the latin and latin-ext faces, pointed at fonts/, and nothing else', () => {
    const css = face('inter-cyrillic-400-normal') + face('inter-latin-400-normal') + face('inter-latin-ext-400-normal', 'U+0100-02BA') +
      '@font-face { font-family: Inter; src: local(Inter); }'
    const { css: rules, files } = fontFaces(css, 'Inter', 400)
    expect(FONT_SUBSETS).toEqual(['latin', 'latin-ext'])
    expect(files).toEqual(['inter-latin-400-normal.woff2', 'inter-latin-ext-400-normal.woff2'])
    expect(rules).toContain("src: url(fonts/inter-latin-400-normal.woff2) format('woff2');")
    expect(rules).toContain('unicode-range: U+0100-02BA;')
    expect(rules).not.toMatch(/cyrillic|\.woff\)|\.\/files/)
  })

  it('refuses a weight with no face to keep', () => {
    expect(() => fontFaces(face('inter-cyrillic-400-normal'), 'Inter', 400)).toThrow(/Inter 400: .* no latin or latin-ext face/)
  })

  it('reads the installed fontsource CSS for every weight a CV asks for', () => {
    for (const cv of CV_PAGES) {
      for (const { family, weights } of googleFontLinks(source(cv.slug)).flatMap(googleFamilies)) {
        for (const weight of weights) {
          const css = readFileSync(resolve(ROOT, 'node_modules', fontPackage(family), `${weight}.css`), 'utf8')
          expect(fontFaces(css, family, weight).files.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('replaces the Google links with one <style> of rules where the first stylesheet was', () => {
    const page = selfHostFonts(SOURCE, '@font-face { font-family: X; }')
    expect(page).not.toMatch(/fonts\.(googleapis|gstatic)/)
    expect(page.match(/<style>/g)).toHaveLength(2)
    expect(page.indexOf('@font-face { font-family: X; }')).toBeLessThan(page.indexOf('body { color: red; }'))
  })
})

describe('externalReferences — nothing on a CV page may reach off the site', () => {
  it('finds every kind of remote reference and any script', () => {
    const html = `<script>1</script><iframe src="https://x.test/a"></iframe><object data="a"></object><embed src="a.swf">
      <link rel="stylesheet" href="https://cdn.test/a.css"><link href="//cdn.test/b.css">
      <img src="https://img.test/p.png" srcset="//img.test/p2.png 2x">
      <style>@import "x.css"; .a { background: url( 'https://img.test/bg.png' ) } .b { background: url(//img.test/c.png) }</style>`
    const found = externalReferences(html)
    expect(found.filter((reference) => reference.startsWith('<'))).toHaveLength(6)
    expect(found).toContain('src="https://img.test/p.png"')
    expect(found).toContain('srcset="//img.test/p2.png 2x"')
    expect(found).toContain('@import "x.css";')
    expect(found).toContain("url( 'https://img.test/bg.png' )")
    expect(found).toContain('url(//img.test/c.png)')
  })

  it('leaves links to other sites and the page’s own files alone', () => {
    expect(externalReferences('<a href="https://github.com/jw3b-dev">GitHub</a><style>@font-face { src: url(fonts/a.woff2) }</style>')).toEqual([])
  })
})

describe('visibleText, numbersIn, inOrder — reading a figure the way a reader does', () => {
  it('keeps only what renders', () => {
    const html = '<style>p { color: red }</style><script>var x = 1</script><!-- a note --><p>A&amp;B&#8212;C&#x2014;D&nbsp;E &copy; F</p>\n\n<b>G</b>'
    expect(visibleText(html)).toBe('A&B—C—D E &copy; F G')
  })

  it('reads numbers with thousands separators and decimals, in order', () => {
    expect(numbersIn('1,430 EXP · 7 High · 98.7% · 77k')).toEqual([1430, 7, 98.7, 77])
    expect(numbersIn('no figure')).toEqual([])
  })

  it('accepts the figures only in the order the value gives them', () => {
    expect(inOrder([7, 4, 3], [14, 7, 7, 4, 3])).toBe(true)
    expect(inOrder([4, 7], [14, 7, 7, 4, 3])).toBe(false)
    expect(inOrder([17, 8], [14, 7, 7, 4, 3])).toBe(false)
  })
})

describe('checkClaimBindings — a bound figure is the register’s, or the build stops (FR-043/046/047)', () => {
  const fixture = {
    claims: [
      { id: 'done', value: '5 things across 2 places', status: 'cleared', evidence_pointer: 'a record' },
      { id: 'open', value: '9 things', status: 'requires_resolution', evidence_pointer: 'a record' },
    ],
  }

  it('passes a figure the register states, in part or whole', () => {
    const html = '<li data-claim="done">5 things across 2 places</li><span class="b" data-claim="done">2 places</span>'
    expect(checkClaimBindings(html, fixture)).toEqual({ errors: [], bound: ['done', 'done'] })
  })

  it('stops a binding to no entry, to an uncleared claim, to no figure, or to figures the register no longer states', () => {
    const html = '<b data-claim="gone">3 x</b><b data-claim="open">9 things</b><b data-claim="done">things</b><b data-claim="done">2 places, 5 things</b>'
    const { errors } = checkClaimBindings(html, fixture)
    expect(errors).toEqual([
      'data-claim="gone" names no register entry',
      'data-claim="open" is not a cleared claim, so it cannot be shown',
      'data-claim="done" binds "things", which shows no figure',
      '"2 places, 5 things" is bound to done, but the register\'s value is now "5 things across 2 places"',
    ])
  })

  it('stops a binding it cannot read rather than skip it', () => {
    const { errors, bound } = checkClaimBindings('<img data-claim="done" alt="5 things">', fixture)
    expect(bound).toEqual([])
    expect(errors).toEqual(['1 data-claim attribute(s) could not be read: each needs an element with its own closing tag'])
  })

  it('stops the README\'s old stale record against the real register', () => {
    const { errors } = checkClaimBindings('<li data-claim="codehawks-validated-findings">17 findings (8 High)</li>', register)
    expect(errors).toHaveLength(1)
  })
})

describe('forbiddenPhrases — the register’s blocklist applies to a CV like any page', () => {
  it('quotes each forbidden phrase with the words around it', () => {
    const [hit] = forbiddenPhrases('<p>Delivery lead, PMP certified, fifteen years.</p>')
    expect(hit).toMatch(/^"Delivery lead, PMP certified, fifteen years\." \(rule \/.*PMP.*\/\)$/)
    expect(forbiddenPhrases('<p>AgilePM Practitioner</p>')).toEqual([])
  })
})

describe('withPageChrome and cvPage — the page as served', () => {
  it('adds the canonical URL, the PDF alternate, no favicon request, and a PDF link the render removes', () => {
    const html = withPageChrome(SOURCE, { slug: 'web3-pm', pdf: 'John_Wellard_Web3_PM_CV.pdf', origin: 'https://jw3b.dev' })
    const head = html.slice(0, html.indexOf('</head>'))
    expect(head).toContain('<link rel="canonical" href="https://jw3b.dev/cv/web3-pm">')
    expect(head).toContain('<link rel="alternate" type="application/pdf" href="John_Wellard_Web3_PM_CV.pdf">')
    expect(head).toContain('<link rel="icon" href="data:,">')
    expect(html).toContain('<body class="cv">\n<a class="cv-pdf-link" data-cv-chrome href="John_Wellard_Web3_PM_CV.pdf" download>Download PDF</a>')
    expect(PAGE_CHROME).toBe('[data-cv-chrome]')
  })

  it('refuses a source with no head or no body', () => {
    expect(() => withPageChrome('<body></body>', { slug: 'x', pdf: 'x.pdf', origin: 'o' })).toThrow(/x: a CV source needs a <head> and a <body>/)
    expect(() => withPageChrome('<head></head>', { slug: 'x', pdf: 'x.pdf', origin: 'o' })).toThrow(/needs a <head> and a <body>/)
  })

  it('returns the page with every reason it may not ship', () => {
    const bad = SOURCE.replace('<h1>', '<script src="https://x.test/t.js"></script><p data-claim="codehawks-exp">2,000 EXP</p><p>50 audits completed</p><h1>')
    const { html, errors } = cvPage(bad, { cv: CV_PAGES[2], register, fontCss: '/* faces */', origin: 'https://jw3b.dev' })
    expect(html).toContain('<style>\n/* faces */\n</style>')
    expect(errors).toHaveLength(5)
    expect(errors[0]).toBe('reaches off the site, which the CSP blocks: <script src="https://x.test/t.js">')
    expect(errors[1]).toBe('reaches off the site, which the CSP blocks: src="https://x.test/t.js"')
    expect(errors[2]).toBe('"2,000 EXP" is bound to codehawks-exp, but the register\'s value is now "1,430 EXP"')
    // "50 audits completed" breaks two of the register's rules: an audit count, and the inflated one.
    expect(errors.slice(3).every((error) => error.startsWith('carries a phrase the register forbids: "'))).toBe(true)
  })
})

describe('John’s three CVs — every rule the build applies, on the real sources', () => {
  for (const cv of CV_PAGES) {
    it(`${cv.slug} ships: nothing off-site, every bound figure the register's, no forbidden phrase`, () => {
      const { html, errors } = cvPage(source(cv.slug), { cv, register, fontCss: '', origin: 'https://jw3b.dev' })
      expect(errors).toEqual([])
      expect(html).toContain(`href="${cv.pdf}"`)
    })
  }

  it('binds the audit record and the GraphRAG figures to the register', () => {
    const ids = CV_PAGES.flatMap((cv) => checkClaimBindings(source(cv.slug), register).bound)
    expect(new Set(ids)).toEqual(new Set(['codehawks-validated-findings', 'graphrag-retriever-uplift', 'graphrag-chunks', 'graphrag-entities']))
  })
})
