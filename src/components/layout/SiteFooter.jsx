/*
 * jw3b.dev v2 — Global site footer (P1-GATE remediation · PRIVACY-01 · frontend-engineer)
 * The persistent bottom chrome, sibling to the hire spine: RootLayout mounts it below every
 * Outlet so it renders on EVERY route — the 404 and, critically, the three PII-collection
 * surfaces (book-a-call form, concierge chat, audit console). Its job is the privacy link:
 * GDPR Art.13 / POPIA §18 require the notice be reachable from every collection point, and the
 * compliance gate found it was previously unreachable (route existed, nothing linked it).
 * Semantic tokens only; the sole motion is a token-driven colour transition (NFR-05 safe).
 */
import { Link } from 'react-router-dom'

export default function SiteFooter() {
  return (
    <footer
      role="contentinfo"
      className="mt-24 border-t border-hairline bg-void/60"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 py-8 text-content-muted sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p className="font-mono text-[11px] uppercase tracking-label">
          JW<span className="text-cyan">3</span>B<span className="text-cyan">.</span>dev — John Wellard
        </p>
        <nav aria-label="Footer" className="flex items-center gap-5">
          <Link
            to="/privacy"
            className="font-mono text-[11px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Privacy
          </Link>
          <Link
            to="/hire-me"
            className="font-mono text-[11px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Hire John
          </Link>
        </nav>
      </div>
    </footer>
  )
}
