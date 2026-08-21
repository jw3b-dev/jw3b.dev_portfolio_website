/*
 * jw3b.dev v2 — route error boundary (P5 audit fix · SC-1/SC-2)  ·  frontend-engineer
 *
 * Without an `errorElement` React Router renders its OWN developer screen — literally
 * "💿 Hey developer 👋 ... provide your own ErrorBoundary" — to real visitors. That shipped on
 * a site whose stated property is that every surface degrades honestly with zero dead ends,
 * and it was owner-reported on /work, /audit and /messages.
 *
 * The common cause is benign and self-healing: a tab opened BEFORE a deploy lazy-loads a
 * content-hashed chunk that no longer exists. That is not a broken site, it is a stale tab —
 * so it gets its own message and a reload, not a scary error. Anything else falls back to an
 * honest error with the guaranteed routes still one click away.
 */
import { useRouteError, Link } from 'react-router-dom'

/** A failed dynamic import — i.e. this tab predates the current deploy. */
export function isStaleChunkError(error) {
  const msg = String(error?.message || error || '')
  return (
    /dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) || // Safari
    /error loading dynamically imported module/i.test(msg)
  )
}

export default function RouteError() {
  const error = useRouteError()
  const stale = isStaleChunkError(error)

  return (
    <section
      aria-labelledby="route-error-title"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8"
      role="alert"
    >
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">
        {stale ? 'New version available' : 'Something broke'}
      </p>
      <h1 id="route-error-title" className="mt-3 font-display text-3xl font-semibold text-content-primary">
        {stale ? 'This page was updated while you had it open.' : 'That surface failed to load.'}
      </h1>
      <p className="mt-3 max-w-prose text-content-secondary">
        {stale
          ? 'Nothing is wrong with your session — the site shipped a new build, so this tab is asking for a file that has been replaced. Reloading picks up the current version.'
          : 'The rest of the site is still running. Reload to try again, or head to one of the consoles below.'}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-md border border-cyan/50 bg-cyan/5 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Reload the page
        </button>
        <Link to="/" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          ← Back to the console
        </Link>
        {/* The floor stays reachable from every failure state (SC-1). */}
        <Link to="/hire-me" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          Hire John →
        </Link>
      </div>
    </section>
  )
}
