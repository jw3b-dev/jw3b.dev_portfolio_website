/*
 * jw3b.dev v2 — CodeHawks #124 deep-link (P1-14 · FR-044)  ·  frontend-engineer
 * The citable competitive-audit record, deep-linked to the PUBLIC profile. The figures
 * (#124 · 17 findings · 1,430 EXP) render through <Claim> (cleared-only, each carrying its
 * own ↗ receipt); this component adds the prominent public-record deep-link and the Auditor
 * framing. The profile URL is read from the register's evidence pointer — never re-hardcoded
 * — and the whole surface renders nothing if the record isn't cleared.
 */
import Claim from '../Claim.jsx'
import { getClaim, isClaimCleared } from '../../lib/claimsRegister.js'

export default function CodeHawksLink({ className = '' }) {
  const rank = getClaim('codehawks-124-rank')
  // Gate the surface on the record being cleared (BR-01). No cleared record → render nothing.
  if (!rank || !isClaimCleared(rank)) return null

  const profileUrl = rank.evidence_pointer
  const hasProfile = typeof profileUrl === 'string' && profileUrl.startsWith('http')

  return (
    <section
      aria-labelledby="codehawks-title"
      className={`rounded-lg border border-hairline bg-panel px-5 py-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-hat-auditor" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          Auditor — verified record
        </span>
      </div>

      <h2 id="codehawks-title" className="mt-3 font-display text-lg font-semibold text-content-primary">
        CodeHawks competitive audit
      </h2>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
        <Claim id="codehawks-124-rank" />
        <span className="text-content-muted">·</span>
        <Claim id="codehawks-124-findings" />
        <span className="text-content-muted">·</span>
        <Claim id="codehawks-124-exp" />
      </p>

      {hasProfile && (
        <a
          href={profileUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-cyan/50 bg-cyan/5 px-3 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan motion-safe:transition-colors hover:bg-cyan/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          View the public record on Cyfrin
          <span aria-hidden="true">↗</span>
        </a>
      )}
    </section>
  )
}
