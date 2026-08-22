/*
 * /notes/:slug — one note (P5-04 · FR-055 continuation)  ·  frontend-engineer
 * Renders a markdown file from src/content/notes/ with SEO + JSON-LD derived from its
 * frontmatter. Adding a note is adding a file; this component is never edited to publish one.
 */
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import Seo from '../../components/seo/Seo.jsx'
import { parseMarkdown } from '../../lib/markdown.js'
import { NOTES } from '../../lib/notesIndex.js'
import { noteBySlug, noteJsonLd } from '../../lib/notes.js'

function Block({ block }) {
  switch (block.type) {
    case 'h1':
      return <h1 className="font-display text-2xl font-semibold text-content-primary">{block.text}</h1>
    case 'h2':
      return <h2 className="mt-6 font-display text-lg font-semibold text-content-primary">{block.text}</h2>
    case 'h3':
      return <h3 className="mt-4 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan">{block.text}</h3>
    case 'ul':
      return (
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm text-content-secondary">
          {block.items.map((item, i) => <li key={i}>{item}</li>)}
        </ul>
      )
    default:
      return <p className="text-sm leading-relaxed text-content-secondary">{block.text}</p>
  }
}

export default function Note() {
  const { slug } = useParams()
  const note = noteBySlug(NOTES, slug)

  // A bad slug is a real state, not a crash — and not a blank page either.
  if (!note) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Seo title="Note not found" description="That note does not exist." />
        <h1 className="font-display text-2xl font-semibold text-content-primary">Note not found</h1>
        <p className="mt-3 text-sm text-content-secondary">
          That note does not exist. <Link to="/notes" className="text-cyan underline">See what is published</Link>.
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Seo title={note.title} description={note.description || note.title} type="article" />
      {/* Seo does not take a jsonLd prop (verified against the component), so the structured
          data is emitted here the same way PersonJsonLd does it — a prop that is silently
          ignored is how a "fix" ships green and does nothing. */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(noteJsonLd(note))}</script>
      </Helmet>
      <p className="font-mono text-[11px] uppercase tracking-label text-content-muted">
        <Link to="/notes" className="hover:text-content-secondary">Notes</Link>
        {note.date && <span> · {note.date}</span>}
      </p>
      <div className="mt-4 flex flex-col gap-3">
        {parseMarkdown(note.body).map((block, i) => <Block key={i} block={block} />)}
      </div>
    </main>
  )
}
