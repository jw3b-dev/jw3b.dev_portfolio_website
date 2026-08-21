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
      /* mt-8, not more: page sections already carry their own bottom padding (pb-20 on the
         landing page), so a large margin here stacked into ~176px of dead space above the
         rule. The border + 32px reads as a deliberate break without the canyon. */
      className="mt-8 border-t border-hairline bg-void/60"
    >
      {/* pb-24 below xl reserves the bottom-right corner for the fixed concierge launcher
          (56px button + 20px offset). Without it the launcher sits on top of the last footer
          link — "Hire John" — at part-screen widths, which is exactly the link that must stay
          clickable. At xl+ the max-w-6xl container is centred far enough inboard that the
          launcher never reaches it, so the padding drops back to normal. */}
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-5 pb-24 pt-8 text-content-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 xl:pb-8">
        <p className="font-mono text-[11px] uppercase tracking-label">
          JW<span className="text-cyan">3</span>B<span className="text-cyan">.</span>dev — John Wellard
          {/* John's sign-off. Kept in the muted tone so it reads as a signature rather than a
              claim, and the emoji carries aria-hidden + a text label so a screen reader hears
              "Stay weird" instead of "alien monster". */}
          <span className="ml-2 normal-case tracking-normal text-content-secondary">
            Stay Weird{' '}
            <span role="img" aria-label="alien">
              👽
            </span>
          </span>
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <Link
            to="/thesis/systems-are-graphs"
            className="font-mono text-[11px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Systems as graphs
          </Link>
          <Link
            to="/thesis/zero-trust-validator"
            className="font-mono text-[11px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Zero-trust
          </Link>
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
