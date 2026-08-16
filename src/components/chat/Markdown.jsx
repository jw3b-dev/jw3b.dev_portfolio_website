/*
 * jw3b.dev v2 — chat markdown renderer (concierge)  ·  full-stack-integrator
 * Renders the concierge's markdown to React ELEMENTS (never dangerouslySetInnerHTML → XSS-safe;
 * React escapes all text). Supports the subset the concierge emits + tables and fenced code:
 * headings, bold/italic, inline code, fenced code blocks, bullet/ordered lists, tables, links,
 * paragraphs, horizontal rules. Degrades gracefully on PARTIAL markdown mid-stream (an
 * unterminated **bold or ``` renders as plain text / an open code block, never throws). Styled
 * with semantic design tokens only.
 */

// Only allow safe link schemes — never javascript:/data: (XSS).
const SAFE_HREF = /^(https?:\/\/|mailto:)/i

// Inline tokens: **bold**, `code`, [text](url), *italic* / _italic_. Left-to-right, first match wins.
const INLINE = /(\*\*([^*]+?)\*\*)|(`([^`]+?)`)|(\[([^\]]+?)\]\(([^\s)]+?)\))|(\*([^*\s][^*]*?)\*)|(_([^_\s][^_]*?)_)/

/** Parse one line of inline markdown → an array of React nodes. Pure. */
export function renderInline(text, keyBase = 'i') {
  const out = []
  let rest = String(text ?? '')
  let k = 0
  while (rest) {
    const m = INLINE.exec(rest)
    if (!m) {
      out.push(rest)
      break
    }
    if (m.index > 0) out.push(rest.slice(0, m.index))
    const key = `${keyBase}${k++}`
    if (m[1]) out.push(<strong key={key} className="font-semibold text-content-primary">{m[2]}</strong>)
    else if (m[3]) out.push(<code key={key} className="rounded bg-void px-1 py-0.5 font-mono text-[0.85em] text-cyan">{m[4]}</code>)
    else if (m[5]) {
      const href = SAFE_HREF.test(m[7]) ? m[7] : null
      out.push(
        href ? (
          <a key={key} href={href} target="_blank" rel="noopener noreferrer" className="text-cyan underline">{m[6]}</a>
        ) : (
          m[6]
        ),
      )
    } else if (m[8]) out.push(<em key={key}>{m[9]}</em>)
    else if (m[10]) out.push(<em key={key}>{m[11]}</em>)
    rest = rest.slice(m.index + m[0].length)
  }
  return out
}

const isTableSep = (l) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(l) && l.includes('-')
const splitRow = (l) =>
  l
    .trim()
    .replace(/^\||\|$/g, '')
    .split('|')
    .map((c) => c.trim())

/** Parse markdown source into a flat list of block descriptors. Pure. */
export function parseBlocks(src) {
  const lines = String(src ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block ```lang … ``` (an unterminated fence mid-stream still renders).
    const fence = /^```(\w*)\s*$/.exec(line)
    if (fence) {
      const code = []
      i++
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++])
      if (i < lines.length) i++ // consume closing fence
      blocks.push({ type: 'code', lang: fence[1], text: code.join('\n') })
      continue
    }

    if (!line.trim()) {
      i++
      continue
    }

    // Table: a header row of `| … |` followed by a `|---|` separator.
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) rows.push(splitRow(lines[i++]))
      blocks.push({ type: 'table', header, rows })
      continue
    }

    // Heading
    const h = /^(#{1,6})\s+(.*)$/.exec(line)
    if (h) {
      blocks.push({ type: 'heading', level: Math.min(h[1].length, 4), text: h[2] })
      i++
      continue
    }

    // Horizontal rule
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) {
      blocks.push({ type: 'hr' })
      i++
      continue
    }

    // Lists (consecutive - / * / 1. lines)
    const listM = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line)
    if (listM) {
      const ordered = /\d+\./.test(listM[1])
      const items = []
      while (i < lines.length) {
        const im = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(lines[i])
        if (!im) break
        items.push(im[2])
        i++
      }
      blocks.push({ type: 'list', ordered, items })
      continue
    }

    // Paragraph: gather until a blank line or a block starter.
    const para = [line]
    i++
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*([-*]|\d+\.)\s|\s*([-*_])(\s*\3){2,}\s*$)/.test(lines[i]) && !(lines[i].includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1]))) {
      para.push(lines[i++])
    }
    blocks.push({ type: 'para', text: para.join(' ') })
  }
  return blocks
}

const H = { 1: 'text-base font-semibold', 2: 'text-sm font-semibold', 3: 'text-sm font-semibold', 4: 'text-xs font-semibold uppercase tracking-label' }

/** Render concierge markdown to safe React elements. */
export default function Markdown({ source }) {
  const blocks = parseBlocks(source)
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        if (b.type === 'heading') {
          const Tag = `h${b.level + 2 <= 6 ? b.level + 2 : 6}`
          return <Tag key={i} className={`text-content-primary ${H[b.level] || H[4]}`}>{renderInline(b.text, `h${i}`)}</Tag>
        }
        if (b.type === 'code') {
          return (
            <pre key={i} className="overflow-x-auto rounded-md border border-hairline bg-void p-2">
              <code className="font-mono text-[0.8em] text-content-secondary">{b.text}</code>
            </pre>
          )
        }
        if (b.type === 'table') {
          return (
            <div key={i} className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[0.85em]">
                <thead>
                  <tr>
                    {b.header.map((c, j) => (
                      <th key={j} className="border border-hairline px-2 py-1 font-semibold text-content-primary">{renderInline(c, `th${i}${j}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {b.rows.map((row, r) => (
                    <tr key={r}>
                      {row.map((c, j) => (
                        <td key={j} className="border border-hairline px-2 py-1">{renderInline(c, `td${i}${r}${j}`)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (b.type === 'list') {
          const Tag = b.ordered ? 'ol' : 'ul'
          return (
            <Tag key={i} className={`ml-4 space-y-1 ${b.ordered ? 'list-decimal' : 'list-disc'}`}>
              {b.items.map((it, j) => (
                <li key={j}>{renderInline(it, `li${i}${j}`)}</li>
              ))}
            </Tag>
          )
        }
        if (b.type === 'hr') return <hr key={i} className="border-hairline" />
        return <p key={i}>{renderInline(b.text, `p${i}`)}</p>
      })}
    </div>
  )
}
