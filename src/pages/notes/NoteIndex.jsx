/*
 * /notes — the published list (P5-04)  ·  frontend-engineer
 * Registered only when at least one note exists (see App.jsx), so this never renders an empty
 * "nothing here yet" shell.
 *
 * ✎ 2026-08-23 — was <main>, nested inside the layout's own <main>. Invalid HTML (one main per
 * document) and an ambiguous landmark for screen readers. Never observed because no note has been
 * published, so no test ever rendered it; found when a new page copied the pattern and the route
 * console-error budget caught the duplicate landmark. Matches Privacy.jsx, which had it right.
 */
import { Link } from 'react-router-dom'
import Seo from '../../components/seo/Seo.jsx'
import { NOTES } from '../../lib/notesIndex.js'

export default function NoteIndex() {
  return (
    <section aria-labelledby="notes-title" className="mx-auto max-w-3xl px-6 py-16">
      <Seo title="Notes" description="Written pieces on smart-contract security, agent systems and delivery." />
      <h1 id="notes-title" className="font-display text-2xl font-semibold text-content-primary">Notes</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {NOTES.map((n) => (
          <li key={n.slug} className="border-t border-hairline pt-3">
            <Link to={n.path} className="font-display text-base font-semibold text-content-primary hover:text-cyan">
              {n.title}
            </Link>
            {n.date && <p className="mt-0.5 font-mono text-[11px] uppercase tracking-label text-content-muted">{n.date}</p>}
            {n.description && <p className="mt-1 text-sm text-content-secondary">{n.description}</p>}
          </li>
        ))}
      </ul>
    </section>
  )
}
