/*
 * jw3b.dev v2 — Delivery-credibility anchor (P1-14 · FR-060)  ·  frontend-engineer
 * The PM/Founder seniority anchor: two decades of industrial delivery across borders +
 * the AgilePM® Practitioner cert. This is a SEPARATE seniority marker, NOT one of the four
 * flagship system slots (FR-060) — it grounds the operator substrate that makes the AI
 * credible ("scope it, size it honestly, name the risks"). Every number renders through
 * <Claim> (cleared-only); nothing here is free-typed. Carries the pm/founder hat accents.
 */
import Claim from '../Claim.jsx'

export default function DeliveryAnchor({ className = '' }) {
  return (
    <section
      aria-labelledby="delivery-anchor-title"
      className={`rounded-lg border border-hairline bg-panel px-5 py-5 ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-hat-pm" aria-hidden="true" />
        <span className="h-2 w-2 rounded-full bg-hat-founder" aria-hidden="true" />
        <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
          PM · Founder — seniority anchor
        </span>
      </div>

      <h2 id="delivery-anchor-title" className="mt-3 font-display text-lg font-semibold text-content-primary">
        The delivery substrate behind the AI
      </h2>
      <p className="mt-1 max-w-prose text-sm text-content-secondary">
        The agentic systems are the headline; long-horizon delivery is why they ship on time and
        survive contact with production. Scope it, size it honestly, name the risks, document it.
      </p>

      <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-md border border-hairline bg-raised px-4 py-3">
          <dt className="font-mono text-[11px] uppercase tracking-label text-content-muted">
            Industrial delivery record
          </dt>
          <dd className="mt-1.5 text-base">
            <Claim id="delivery-plants-countries" />
          </dd>
        </div>
        <div className="rounded-md border border-hairline bg-raised px-4 py-3">
          <dt className="font-mono text-[11px] uppercase tracking-label text-content-muted">
            Project-management credential
          </dt>
          <dd className="mt-1.5 text-base">
            <Claim id="agilepm-practitioner" />
          </dd>
        </div>
      </dl>
    </section>
  )
}
