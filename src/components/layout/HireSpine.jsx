/*
 * jw3b.dev v2 — Persistent hire spine (P1-10 · FR-002)  ·  frontend-engineer
 * The single always-present chrome: a fixed top banner carrying the wordmark (a route home
 * from anywhere → no terminal dead-ends, SC-1) and the one canonical hire CTA (→ /hire-me),
 * reachable in ≤ 1 click from every route because RootLayout mounts this above every Outlet
 * (the 404 route included). Route links give each surface a way OUT; the CTA is the spine.
 * Semantic tokens only; motion is limited to token-driven colour transitions (NFR-05 safe).
 */
import { NavLink, Link } from 'react-router-dom'

// The operable surfaces the spine exposes. Order = the intended journey; /hire-me is the CTA,
// not a nav link. Privacy lives in the page footer, not the spine.
const SURFACES = [
  { to: '/work', label: 'Work' },
  { to: '/audit', label: 'Audit' },
  { to: '/ctf', label: 'CTF' },
  { to: '/messages', label: 'Messages' },
]

const linkClass = ({ isActive }) =>
  [
    'font-mono text-[12px] uppercase tracking-label motion-safe:transition-colors',
    isActive ? 'text-cyan' : 'text-content-secondary hover:text-content-primary',
  ].join(' ')

function SurfaceLinks() {
  return (
    <>
      {SURFACES.map((s) => (
        <NavLink key={s.to} to={s.to} className={linkClass}>
          {s.label}
        </NavLink>
      ))}
    </>
  )
}

export default function HireSpine() {
  return (
    <header
      role="banner"
      className="fixed inset-x-0 top-0 z-nav border-b border-hairline bg-void/80 backdrop-blur-nav"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-5 sm:px-8">
        {/* wordmark — home from anywhere (no terminal dead-end) */}
        <Link
          to="/"
          className="font-display text-sm font-semibold tracking-tight text-content-primary motion-safe:transition-colors hover:text-cyan"
        >
          JW<span className="text-cyan">3</span>B<span className="text-cyan">.</span>
        </Link>

        {/* primary route nav (sm+) */}
        <nav aria-label="Primary" className="ml-4 hidden items-center gap-5 sm:flex">
          <SurfaceLinks />
        </nav>

        {/* the hire spine — the one canonical CTA, always visible */}
        <Link
          to="/hire-me"
          className="ml-auto rounded-sm border border-cyan/50 bg-cyan/5 px-3.5 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan motion-safe:transition-colors hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Hire John
        </Link>

        {/* mobile route disclosure (native <details> — keyboard + SR accessible, no JS) */}
        <details className="relative sm:hidden">
          <summary
            aria-label="Open navigation"
            className="flex h-8 w-8 cursor-pointer list-none items-center justify-center rounded-sm border border-hairline text-content-secondary marker:hidden [&::-webkit-details-marker]:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </summary>
          <nav
            aria-label="Primary (mobile)"
            className="absolute right-0 top-10 flex w-40 flex-col gap-3 rounded-md border border-hairline bg-panel p-4 shadow-edge-cyan"
          >
            <SurfaceLinks />
          </nav>
        </details>
      </div>
    </header>
  )
}
