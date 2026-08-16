/*
 * jw3b.dev v2 — minimal markdown block parser (P1-20 support)  ·  frontend-engineer
 * A dependency-free parser for the SUBSET our content pages use: `#`/`##`/`###` headings,
 * `-` bullet lists, and blank-line-separated paragraphs. It exists so a legal page (the privacy
 * notice, FR-057) can render its full real text FROM a single canonical source file — the rendered
 * page IS the source document, so the two can never drift. Pure: string in, block array out.
 */

/**
 * @param {string} src markdown source
 * @returns {Array<{type:'h1'|'h2'|'h3'|'p'|'ul', text?:string, items?:string[]}>}
 */
export function parseMarkdown(src = '') {
  const lines = String(src).replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let para = []
  let list = null

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

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) {
      flushPara()
      flushList()
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      flushList()
      blocks.push({ type: `h${heading[1].length}`, text: heading[2].trim() })
      continue
    }
    const bullet = /^-\s+(.*)$/.exec(line)
    if (bullet) {
      flushPara()
      list = list || []
      list.push(bullet[1].trim())
      continue
    }
    flushList()
    para.push(line)
  }
  flushPara()
  flushList()
  return blocks
}
