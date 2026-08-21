/*
 * jw3b.dev v2 — split a markdown document into tabbable sections (P5)  ·  frontend-engineer
 *
 * The model's analysis arrives as a structured document — findings, the fix, a summary — and
 * was rendered as ONE preformatted block streaming down the page, with the markdown showing
 * raw. A reader looking for "the fix" had to scroll past everything else. This splits it on
 * its own headings so each part becomes a tab.
 *
 * PURE, and deliberately careful about two things:
 *   1. Fenced code blocks are never split, even though Solidity and shell samples are full of
 *      `#` comment lines that look exactly like headings.
 *   2. The split level is CHOSEN, not assumed: a document titled `# Analysis` with several
 *      `##` parts must split on `##`, or you get one useless tab containing everything.
 */

const FENCE = /^\s*(```|~~~)/
const HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/** Heading lines that are NOT inside a fenced code block. */
function scanHeadings(lines) {
  const out = []
  let fenced = false
  lines.forEach((line, i) => {
    if (FENCE.test(line)) {
      fenced = !fenced
      return
    }
    if (fenced) return
    const m = line.match(HEADING)
    if (m) out.push({ i, level: m[1].length, title: m[2].trim() })
  })
  return out
}

/**
 * A url-safe id from a heading title. Derived from the TITLE, not the position, so it stays
 * stable while a document streams: sections arrive and the split level can change underneath
 * a reader, and an index-based id would silently invalidate whichever tab they had open.
 * `index` is only the fallback for a title with no usable characters.
 */
export function sectionId(title, index) {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `section-${index}`
}

/** Assign ids, suffixing only genuine duplicates so every id stays unique AND stable. */
function withUniqueIds(sections) {
  const seen = new Map()
  return sections.map((sec, i) => {
    const base = sectionId(sec.title, i)
    const n = seen.get(base) || 0
    seen.set(base, n + 1)
    return { ...sec, id: n === 0 ? base : `${base}-${n + 1}` }
  })
}

/**
 * Split markdown into sections for tabbing.
 * @returns {Array<{id:string,title:string,level:number,body:string}>}
 *   Always returns at least one section when there is content; [] for empty input.
 */
export function splitSections(markdown, { preambleTitle = 'Overview' } = {}) {
  const src = typeof markdown === 'string' ? markdown : ''
  if (!src.trim()) return []

  const lines = src.split('\n')
  const headings = scanHeadings(lines)

  // Choose the shallowest heading level that actually yields more than one section —
  // otherwise a lone `# Title` swallows the whole document into a single tab.
  const levels = [...new Set(headings.map((h) => h.level))].sort((a, b) => a - b)
  const splitLevel = levels.find((lv) => headings.filter((h) => h.level === lv).length > 1) ?? levels[0]
  const cuts = headings.filter((h) => h.level === splitLevel)

  if (!cuts.length) return withUniqueIds([{ title: preambleTitle, level: 0, body: src.trim() }])

  const sections = []

  // Anything before the first heading is real content (often the lede) — keep it, titled.
  const preamble = lines.slice(0, cuts[0].i).join('\n').trim()
  if (preamble) sections.push({ title: preambleTitle, level: 0, body: preamble })

  cuts.forEach((cut, n) => {
    const end = n + 1 < cuts.length ? cuts[n + 1].i : lines.length
    // Drop the heading line itself — the tab label carries it, so repeating it wastes space.
    const body = lines.slice(cut.i + 1, end).join('\n').trim()
    sections.push({ title: cut.title, level: cut.level, body })
  })

  return withUniqueIds(sections)
}
