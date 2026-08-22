/*
 * jw3b.dev v2 — CodeHawks #124 record (P1-14 · FR-044)  ·  frontend-engineer
 * The citable competitive-audit record. The figures (#124 · 17 findings · 1,430 EXP) render
 * through <Claim> (cleared-only); the deep-link is read from the register's evidence pointer —
 * never re-hardcoded — and the whole surface renders nothing if the record isn't cleared.
 *
 * ✎ 2026-08-23. The public Cyfrin profile stopped showing the record: logged-out it reads
 * "Ranking: Unranked · Total Findings High 0 Med 0 Low 0", so the deep-link was walking a
 * skeptical reader from a claim of 17 findings to a page showing none
 * (mas/audits/CLAIMS_SOURCE_SWEEP_2026-08-23.md). The pointer is now attested, and this
 * component was already built to handle that — `hasProfile` gates the link on a real URL, so it
 * degrades on its own. What did NOT degrade was the EYEBROW: it said "verified record" beside
 * figures that had become attested. That label is now derived from the evidence tier instead of
 * being written by hand, so the two cannot drift apart again. Restoring the URL in the register
 * restores both the link and the wording, with no code change.
 */
import Claim from '../Claim.jsx'
import { getClaim, isClaimCleared, evidenceKind } from '../../lib/claimsRegister.js'

export default function CodeHawksLink({ className = '' }) {
  const rank = getClaim('codehawks-124-rank')
  // Gate the surface on the record being cleared (BR-01). No cleared record → render nothing.
  if (!rank || !isClaimCleared(rank)) return null

  const profileUrl = rank.evidence_pointer
  const kind = evidenceKind(rank)
  const hasProfile = kind === 'verified'

  return (
    <section
      aria-labelledby="codehawks-title"
      className={`rounded-lg border border-hairline bg-panel px-5 py-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-hat-auditor" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          {/* Derived, never typed: "verified" is a claim about the evidence, and it must track
              the evidence. */}
          Auditor — {hasProfile ? 'verified record' : 'competitive-audit record'}
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

      {/* No public receipt: show WHERE the record is evidenced rather than leaving three bare
          numbers. An attested figure with its provenance stated beats one with nothing at all. */}
      {!hasProfile && profileUrl && (
        <p className="mt-4 text-[13px] text-content-muted">
          <span className="text-caution" title="attested, not independently checkable">&dagger;</span>{' '}
          {profileUrl}
        </p>
      )}

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
