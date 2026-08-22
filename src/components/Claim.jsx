/*
 * jw3b.dev v2 — <Claim>: the verified-claim primitive (design-story §8, FR-043)  ·  P0-07
 * Renders a number/credential ONLY if it traces to a CLEARED evidence-register entry — else
 * renders `fallback` (nothing by default). Every figure the site shows goes through this.
 * Wears the mono/tabular verdict treatment; one tap to its receipt (evidence pointer).
 * Styling is token-class only (no raw hex).
 */
import { getClaim, isClaimCleared, evidenceKind } from '../lib/claimsRegister.js'

export default function Claim({
  id,
  value,
  label,
  evidence,
  provenance,
  fallback = null,
  className = '',
}) {
  // id → register lookup (the normal path); or an inline claim (still gated by isClaimCleared).
  const record = id
    ? getClaim(id)
    : { value, label, status: 'cleared', evidence_pointer: evidence, provenance_note: provenance }

  if (!record || !isClaimCleared(record)) return fallback

  const receipt = record.evidence_pointer
  const kind = evidenceKind(record)
  const hasLink = kind === 'verified'

  return (
    <span
      className={`font-mono tabular-nums text-content-primary ${className}`}
      data-claim={id || undefined}
    >
      {record.value}
      {record.provenance_note && (
        <sup
          className="ml-0.5 text-[0.6em] uppercase tracking-label text-content-muted"
          title={record.provenance_note}
        >
          †
        </sup>
      )}
      {hasLink && (
        <a
          href={receipt}
          target="_blank"
          rel="noreferrer"
          className="ml-1 text-verified no-underline hover:underline"
          aria-label={`Evidence for ${record.label || record.value}`}
          title="View the receipt"
        >
          ↗
        </a>
      )}
      {/*
          An ATTESTED figure must not look like a verified one. 17 of the 31 cleared claims have a
          prose pointer rather than a URL, and until now every one rendered identically to a rank
          a reader could click through and check — which is precisely the "dressed up as
          independently verified" failure the evidence register exists to prevent.

          Deliberately muted, not alarming: attested is allowed. It is simply a different kind of
          evidence, and the reader is entitled to know which one they are looking at. The pointer
          text itself is exposed (title + screen-reader text) so the claim is INSPECTABLE rather
          than merely labelled.
      */}
      {kind === 'attested' && (
        <span
          className="ml-1 align-super text-[0.6em] uppercase tracking-label text-content-muted"
          title={receipt}
        >
          <span aria-hidden="true">attested</span>
          <span className="sr-only">{` — owner-attested, not independently verified. Source: ${receipt}`}</span>
        </span>
      )}
    </span>
  )
}
