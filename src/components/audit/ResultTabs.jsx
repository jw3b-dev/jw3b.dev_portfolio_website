/*
 * jw3b.dev v2 — tabbed result panes (P5)  ·  frontend-engineer
 *
 * The model's analysis is a structured document, but it rendered as one preformatted block
 * streaming down the page — markdown showing raw, and anyone looking for "the fix" scrolling
 * past everything else. This splits it on its own headings and gives each part a tab.
 *
 * Streaming behaviour is the fiddly bit and is deliberate: while text is still arriving the
 * view FOLLOWS the newest section, so you watch it being written. The moment you click a tab
 * yourself, following stops — nothing is more annoying than a page that yanks you away from
 * what you're reading. Selecting the newest tab again resumes following.
 */
import { useEffect, useRef, useState } from 'react'
import Markdown from '../chat/Markdown.jsx'
import { splitSections } from '../../lib/markdownSections.js'

export default function ResultTabs({ source, streaming = false, label = 'Analysis sections', preambleTitle }) {
  const sections = splitSections(source, preambleTitle ? { preambleTitle } : undefined)
  const [selected, setSelected] = useState(null) // null = follow the stream
  const followingRef = useRef(true)

  const lastId = sections.length ? sections[sections.length - 1].id : null
  const activeId = selected && sections.some((s) => s.id === selected) ? selected : lastId

  // While streaming, keep the newest section in view unless the reader has taken over.
  useEffect(() => {
    if (streaming && followingRef.current) setSelected(null)
  }, [streaming, lastId])

  if (!sections.length) return null

  // One section is not a tab strip — render it plainly rather than showing a lone tab.
  if (sections.length === 1) {
    return (
      <div className="rounded-md border border-hairline bg-void p-3">
        <Markdown source={sections[0].body} />
      </div>
    )
  }

  const choose = (id) => {
    followingRef.current = id === lastId // re-selecting the newest resumes following
    setSelected(id)
  }

  const onKeyDown = (e) => {
    const i = sections.findIndex((s) => s.id === activeId)
    if (e.key === 'ArrowRight') choose(sections[(i + 1) % sections.length].id)
    if (e.key === 'ArrowLeft') choose(sections[(i - 1 + sections.length) % sections.length].id)
  }

  return (
    <div>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex flex-wrap gap-1.5">
        {sections.map((s) => {
          const isActive = s.id === activeId
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              id={`rt-tab-${s.id}`}
              aria-selected={isActive}
              aria-controls={`rt-panel-${s.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => choose(s.id)}
              title={s.title}
              className={
                'max-w-[16rem] truncate rounded-md border px-2.5 py-1 text-left font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ' +
                (isActive
                  ? 'border-cyan/50 bg-cyan/10 text-cyan'
                  : 'border-hairline text-content-muted hover:text-content-secondary')
              }
            >
              {s.title}
              {/* The section still being written gets a live marker, so a partial tab never
                  reads as a finished one. */}
              {streaming && s.id === lastId && <span aria-hidden="true"> ▍</span>}
            </button>
          )
        })}
      </div>

      {sections.map((s) => (
        <div
          key={s.id}
          role="tabpanel"
          id={`rt-panel-${s.id}`}
          aria-labelledby={`rt-tab-${s.id}`}
          hidden={s.id !== activeId}
          className="mt-3 max-h-[28rem] overflow-y-auto rounded-md border border-hairline bg-void p-3"
        >
          {s.id === activeId && <Markdown source={s.body} />}
        </div>
      ))}
    </div>
  )
}
