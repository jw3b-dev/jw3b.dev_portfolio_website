/*
 * /notes — the published list (P5-04)  ·  frontend-engineer
 * Registered only when at least one note exists (see App.jsx), so this never renders an empty
 * "nothing here yet" shell.
 */
import { Link } from 'react-router-dom'
import Seo from '../../components/seo/Seo.jsx'
import { NOTES } from '../../lib/notesIndex.js'

export default function NoteIndex() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Seo title="Notes" description="Written pieces on smart-contract security, agent systems and delivery." />
      <h1 className="font-display text-2xl font-semibold text-content-primary">Notes</h1>
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
    </main>
  )
}
