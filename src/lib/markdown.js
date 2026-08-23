/*
 * jw3b.dev v2 — minimal markdown block parser (P1-20 support)  ·  frontend-engineer
 * A dependency-free parser for the SUBSET our content pages use: `#`/`##`/`###` headings,
 * `-`/`*` bullet lists, fenced code blocks, and blank-line-separated paragraphs. It exists so a
 * legal page (the privacy notice, FR-057) can render its full real text FROM a single canonical
 * source file — the rendered page IS the source document, so the two can never drift. Pure:
 * string in, block array out.
 *
 * ✎ 2026-08-23 — fenced code and `*` bullets. Publishing a real audit write-up (a Foundry PoC, a
 * Solidity root-cause snippet, a remediation diff) through the old parser would have joined every
 * fenced line into a paragraph and printed the ``` markers as text: product-audit finding 15
 * exactly, on the strongest proof surface the site has. Inside a fence NOTHING else parses — a `#`
 * comment in Solidity is not a heading, and a `*` in a comment is not a bullet.
 */

/**
 * @param {string} src markdown source
 * @returns {Array<{type:'h1'|'h2'|'h3'|'p'|'ul'|'code', text?:string, items?:string[], lang?:string}>}
 */
export function parseMarkdown(src = '') {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []
  let list = null
  // Non-null while inside a fence. Everything between the markers is captured verbatim.
  let fence = null

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: 'p', text: para.join(' ') })
      para = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push({ type: 'ul', items: list })
      list = null
    }
  }

  const flushFence = () => {
    if (fence) {
      // Trailing blank lines inside a fence are noise; leading indentation is meaning, so only the
      // ends are trimmed and never the individual lines.
      blocks.push({ type: 'code', lang: fence.lang, text: fence.lines.join('\n').replace(/^\n+|\s+$/g, '') })
      fence = null
    }
  }

  for (const raw of lines) {
    const line = raw.trim()

    // Fences first, and they win over everything: inside one, markdown syntax is just source code.
    const marker = /^```+\s*([A-Za-z0-9+#-]*)\s*$/.exec(line)
    if (fence) {
      if (marker) flushFence()
      else fence.lines.push(raw.replace(/\s+$/, ''))
      continue
    }
    if (marker) {
      flushPara()
      flushList()
      fence = { lang: marker[1] || null, lines: [] }
      continue
    }

    if (!line) {
      flushPara()
      // A blank line does NOT end a list. Markdown calls that a "loose" list and it is still one
      // list; flushing here turned the audit write-up's blank-line-separated Risk bullets into
      // twelve one-item lists. Any non-bullet content below still flushes it.
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      flushList()
      blocks.push({ type: `h${heading[1].length}`, text: heading[2].trim() })
      continue
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line)
    if (bullet) {
      flushPara()
      list = list || []
      list.push(bullet[1].trim())
      continue
    }
    flushList()
    para.push(line)
  }
  // An UNTERMINATED fence still renders as code. Dropping it would silently delete content, and
  // half a Foundry test rendered as prose is worse than an unclosed block shown honestly.
  flushFence()
  flushPara()
  flushList()
  return blocks
}
