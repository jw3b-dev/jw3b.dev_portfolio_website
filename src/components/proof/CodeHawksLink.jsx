/*
 * jw3b.dev v2 — the CodeHawks record (P1-14 · FR-044)  ·  frontend-engineer
 * The citable competitive-audit record. The figures (rank · valid submissions · EXP) render
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
import { Link } from 'react-router-dom'
import { CONTESTS, selectedByJohn } from '../../data/codehawks-contests.js'
import { ARTIFACTS } from '../../lib/findingArtifactsIndex.js'
import LiveRecordLine from './LiveRecordLine.jsx'

// Severity carries the reserved failure tone only where a real High was found.
const SEVERITY_TONE = {
  High: 'text-failed',
  Medium: 'text-caution',
  Low: 'text-content-muted',
}

export default function CodeHawksLink({ className = '' }) {
  const rank = getClaim('codehawks-rank')
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
        <Claim id="codehawks-rank" />
        <span className="text-content-muted">·</span>
        <Claim id="codehawks-valid-submissions" />
        <span className="text-content-muted">·</span>
        <Claim id="codehawks-exp" />
      </p>

      {/*
          The specific beats the aggregate. A rank is a number a reader has to trust; a NAMED
          finding in a NAMED public contest is something they can go and read. This was added when
          the public rank receipt broke — and it is the stronger evidence of the two.

          "Validated submission", never "wrote". Cyfrin credits every researcher who validly
          reported a finding, then publishes ONE of them as the "Selected submission" — and for all
          seven of these it was someone else. Claiming authorship here would be exactly the
          misattribution mas/facts/PORTFOLIO_REFERENCE.md §1b had to be corrected for.

          Rows come from src/data/codehawks-contests.js, parsed out of Cyfrin's own reports, so the
          list and the register's summary string cannot drift apart.
      */}
      <div className="mt-4 border-t border-hairline pt-3">
        <p className="text-sm text-content-secondary">
          <Claim id="codehawks-validated-findings" /> — validated submissions. CodeHawks credits
          every researcher who validly reports a finding; the published write-up for each of these
          is another researcher's.
        </p>

        {/*
            The strongest line on this surface, and it earns its own sentence. Validated =
            the finding was real. SELECTED = Cyfrin published John's write-up as the canonical
            version of it, over everyone else who reported the same bug. Merging the two would
            overstate ten findings to the level of one, so they stay separate claims.
        */}
        {selectedByJohn().map((f) => (
          <p key={`${f.flight}-${f.id}`} className="mt-3 rounded-md border border-cyan/30 bg-void p-3 text-sm text-content-secondary">
            <span className="font-mono text-[11px] uppercase tracking-label text-cyan">Selected submission · </span>
            On <span className="text-content-primary">First Flight #{f.flight} {f.contest}</span>, Cyfrin
            published <span className="text-content-primary">John&rsquo;s</span> write-up of {f.id} as the
            canonical version of the finding — chosen over every other researcher who reported it.
            <span className="ml-1 text-content-muted">{f.title}.</span>
            {/* Published on this site, in full, because it is his to publish. */}
            {ARTIFACTS.some((a) => a.slug === `${f.flight}-${f.id}`) && (
              <Link
                to={`/findings/${f.flight}-${f.id}`}
                className="mt-2 block font-mono text-[12px] uppercase tracking-label text-cyan underline"
              >
                Read the finding →
              </Link>
            )}
          </p>
        ))}

        <ul className="mt-3 space-y-2.5">
          {CONTESTS.map((c) => (
            <li key={c.flight}>
              <p className="font-mono text-[11px] uppercase tracking-label text-content-muted">
                First Flight #{c.flight} · {c.name} · {c.ended}
              </p>
              <ul className="mt-1 space-y-0.5">
                {c.findings.map((f) => (
                  <li key={f.id} className="flex items-baseline gap-2 text-[13px]">
                    <span className={`font-mono text-[11px] ${SEVERITY_TONE[f.severity]}`}>
                      {f.id} {f.severity}
                    </span>
                    <span className="text-content-secondary">
                      {f.title}
                      {f.selected === 'agilegypsy' && (
                        <span className="ml-1.5 font-mono text-[10px] uppercase tracking-label text-cyan">
                          selected
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>

      {/* The register is build-time; this says whether it is still current. Reads the number to
          compare against FROM the register, so the two can never be typed apart. */}
      <LiveRecordLine
        registerValidSubmissions={parseInt(getClaim('codehawks-valid-submissions').value, 10)}
      />

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
