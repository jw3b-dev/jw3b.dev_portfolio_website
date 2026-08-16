/*
 * jw3b.dev v2 — <Claim>: the verified-claim primitive (design-story §8, FR-043)  ·  P0-07
 * Renders a number/credential ONLY if it traces to a CLEARED evidence-register entry — else
 * renders `fallback` (nothing by default). Every figure the site shows goes through this.
 * Wears the mono/tabular verdict treatment; one tap to its receipt (evidence pointer).
 * Styling is token-class only (no raw hex).
 */
import { getClaim, isClaimCleared } from '../lib/claimsRegister.js'

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
  const hasLink = typeof receipt === 'string' && receipt.startsWith('http')

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
    </span>
  )
}
