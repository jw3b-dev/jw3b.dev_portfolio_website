import { Link } from 'react-router-dom'
import Seo from '../seo/Seo.jsx'

/*
 * RouteGate — the honest state a route wears while its feature flag is OFF (P1-21 ·
 * lead-architect). A surface that isn't provisioned yet must read as a deliberate
 * "coming — book a call instead", never a bare unfinished placeholder (SC-2: 0
 * hard-broken states) and never a dead-end (SC-1: the guaranteed floor is always one
 * click away). This is a scaffold state, sibling to the 404 in App.jsx — not the
 * feature itself, which lands when its flag flips on.
 */
export default function RouteGate({ title, kicker, reason, seoTitle, seoDescription }) {
  return (
    <section
      aria-labelledby="gate-title"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8"
    >
      <Seo title={seoTitle ?? title} description={seoDescription ?? reason} />
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">
        {kicker ?? 'Not live yet'}
      </p>
      <h1
        id="gate-title"
        className="mt-3 font-display text-3xl font-semibold text-content-primary"
      >
        {title}
      </h1>
      <p className="mt-3 max-w-prose text-content-secondary">{reason}</p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Link
          to="/hire-me"
          className="font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary"
        >
          Book a call →
        </Link>
        <Link
          to="/"
          className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary"
        >
          ← Back to jw3b.dev
        </Link>
      </div>
    </section>
  )
}
