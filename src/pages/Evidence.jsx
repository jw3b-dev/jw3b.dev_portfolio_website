/*
 * /evidence — the register, readable (FR-043 continuation)  ·  portfolio-evidence
 *
 * Every number this site shows already routes through <Claim> and a cleared register entry. Until
 * now the only way to inspect one was to find the number on whatever page happens to render it and
 * hover. Someone deciding whether to hire an auditor is exactly the person who wants to audit the
 * auditor's own claims — so this is the whole register in one place, with what backs each entry.
 *
 * The honest part is the SPLIT. Roughly half these figures are owner-attested rather than
 * independently checkable, and that ratio is stated at the top rather than left for a reader to
 * work out row by row. A page that listed 31 claims and implied they were all verifiable would be
 * a worse lie than not having the page.
 *
 * Reads entirely from the register — no figure is written into this component, so nothing here can
 * drift from the source or slip past the claims gate.
 */
import Seo from '../components/seo/Seo.jsx'
import Claim from '../components/Claim.jsx'
import { allClaims, isClaimCleared, evidenceKind } from '../lib/claimsRegister.js'
import { FORBIDDEN_RULES } from '../lib/claimsValidate.js'

const cleared = allClaims().filter(isClaimCleared)
const verifiedCount = cleared.filter((c) => evidenceKind(c) === 'verified').length
const attestedCount = cleared.length - verifiedCount

// Group by the system the figure comes from, so a reader can weigh a whole source at once.
const bySource = cleared.reduce((acc, c) => {
  const key = c.source_system || 'Other'
  ;(acc[key] = acc[key] || []).push(c)
  return acc
}, {})
const sources = Object.keys(bySource).sort((a, b) => bySource[b].length - bySource[a].length)

function Row({ claim }) {
  const kind = evidenceKind(claim)
  return (
    <li className="flex flex-col gap-1 border-t border-hairline py-2 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="min-w-[9rem] font-mono tabular-nums text-content-primary">
        <Claim id={claim.id} />
      </span>
      <span className="flex-1 text-sm text-content-secondary">{claim.label}</span>
      <span className="font-mono text-[11px] text-content-muted">
        {kind === 'verified' ? (
          <a
            href={claim.evidence_pointer}
            target="_blank"
            rel="noreferrer"
            className="text-verified no-underline hover:underline"
          >
            check it ↗
          </a>
        ) : (
          // Say what it is, in words, not a badge a reader has to decode.
          <span title={claim.evidence_pointer}>owner-attested</span>
        )}
      </span>
    </li>
  )
}

export default function Evidence() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Seo
        title="Evidence register"
        description="Every figure jw3b.dev renders, and what backs it — independently checkable or owner-attested, stated per claim."
      />

      <h1 className="font-display text-2xl font-semibold text-content-primary">Evidence register</h1>

      <p className="mt-3 text-sm leading-relaxed text-content-secondary">
        Every number on this site renders from this register or not at all — a build gate blocks any
        figure without a cleared entry. This is that register, so you can check the claims instead of
        taking them.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-content-secondary">
        Of <span className="font-mono text-content-primary">{cleared.length}</span> cleared claims,{' '}
        <span className="font-mono text-verified">{verifiedCount}</span> point at something you can
        open and verify yourself, and{' '}
        <span className="font-mono text-content-primary">{attestedCount}</span> are{' '}
        <span className="text-content-primary">owner-attested</span> — John&rsquo;s own figures from
        systems that are not public. Attested is not verified, and this page will not pretend
        otherwise.
      </p>

      {sources.map((source) => (
        <section key={source} className="mt-8" aria-labelledby={`src-${source.replace(/\W+/g, '-')}`}>
          <h2
            id={`src-${source.replace(/\W+/g, '-')}`}
            className="font-mono text-[11px] uppercase tracking-label text-cyan"
          >
            {source}
          </h2>
          <ul className="mt-2">
            {bySource[source].map((c) => (
              <Row key={c.id} claim={c} />
            ))}
          </ul>
        </section>
      ))}

      {/*
          Deliberately does NOT enumerate the blocklist. Writing those phrases here as examples is
          how this page first failed its own claims gate — the same mistake the gate caught once
          before, in a component that listed them as sample chips. The list lives in the register
          and the gate demo derives it at runtime, so a reader can see it without it ever being a
          literal in rendered source. The gate being unfoolable by its own author is the point.
      */}
      <p className="mt-10 border-t border-hairline pt-4 text-[12px] leading-relaxed text-content-muted">
        There is also a blocklist — claims this site refuses to make, whatever the temptation. It is
        enforced by the same build gate, and you can run any phrase against it yourself on the{' '}
        <a href="/thesis/zero-trust-validator" className="text-cyan underline">
          zero-trust validator
        </a>{' '}
        page.
      </p>

      {/*
          Brief 02, next-need 2: the list of claims this site REFUSES to make was never simply shown.
          The pattern is rendered from its source at runtime — never as a literal in this file —
          so the claims gate that scans src/ cannot be tripped by the page that explains it.
      */}
      <section id="refused-claims-section" aria-labelledby="refused-claims" className="mt-10 border-t border-hairline pt-6">
        <h2 id="refused-claims" className="font-display text-lg font-semibold text-content-primary">
          Claims this site refuses to make
        </h2>
        <p className="mt-2 text-sm text-content-secondary">
          Every page is scanned against these rules in CI. A match fails the build. They exist
          because each one has either appeared in a draft of this site or appears on most sites
          like it.
        </p>
        <ol className="mt-4 flex flex-col gap-3">
          {FORBIDDEN_RULES.map((r) => (
            <li key={r.pattern.source} className="border-l-2 border-failed/40 pl-3">
              <code className="font-mono text-[11px] text-failed">{r.pattern.source}</code>
              <p className="mt-1 text-sm text-content-secondary">{r.why}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}
