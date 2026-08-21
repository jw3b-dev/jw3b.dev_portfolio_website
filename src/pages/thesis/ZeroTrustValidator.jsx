import { Link } from 'react-router-dom'
import ClaimsGateDemo from '../../components/thesis/ClaimsGateDemo.jsx'
import Seo from '../../components/seo/Seo.jsx'

/*
 * /thesis/zero-trust-validator (P3-06 · FR-055)  ·  frontend-engineer
 * A content-gap explainer: "reproduce, don't assert" as John's security thesis. Targets branded +
 * content-gap search ("zero-trust validation", "reproduce don't assert", "proof not promises") via
 * article SEO, and links into the audit console so it's never an orphan. Tokens only; no numeric claims.
 */
export default function ZeroTrustValidator() {
  return (
    <article className="mx-auto max-w-3xl px-5 py-24 sm:px-8">
      <Seo
        title="Zero-trust: reproduce, don’t assert"
        description="A claim you can't reproduce is a rumor. The discipline behind John Wellard's (JW3B / AgileGypsy) security work is zero-trust in the literal sense — a finding is real only when it re-runs in front of you, and every figure is gated to its evidence."
        type="article"
      />
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Thesis</p>
      <h1 className="mt-3 font-display text-4xl font-semibold leading-tight text-content-primary">
        Reproduce the finding. Don’t assert it.
      </h1>
      <p className="mt-5 text-lg text-content-secondary">
        A claim you cannot reproduce is a rumor with good production values. The discipline behind this
        work is zero-trust in the literal sense: nothing is believed because it is stated. A finding is
        real only when it re-runs — in front of you, on demand — and every figure the site presents is
        tied to the evidence that backs it, or it does not appear.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold text-content-primary">Assert vs. reproduce</h2>
        <p className="mt-3 text-content-secondary">
          “There is a reentrancy bug” is an assertion. An attacker contract that drains the vault on a
          public Base Sepolia testnet — one you can run and watch — is proof. The gap between those two
          is the entire job. The audit console here does the second kind: paste a contract, watch the
          deterministic screen run, and where it matters, see the exploit reproduced, not described.
        </p>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-content-primary">Proof, not promises — enforced</h2>
        <p className="mt-3 text-content-secondary">
          Zero-trust cuts both ways: it applies to John’s own claims too. Every credential and figure on
          this site routes through a claims gate wired into the build — it renders only if it traces to a
          real, checkable source, and an unbacked claim fails the pipeline. The portfolio holds itself to
          the standard it sells.
        </p>
        {/* The proof sits INSIDE the claim's own section. A page that asserts enforcement and
            then makes you scroll to find the evidence is still asking for trust. */}
        <ClaimsGateDemo />
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-content-primary">What zero-trust buys you</h2>
        <p className="mt-3 text-content-secondary">
          An auditor whose output you can check instead of take on faith — the difference between a
          report you file and a control you rely on.
        </p>
      </section>

      <nav aria-label="Continue" className="mt-12 flex flex-wrap gap-5 border-t border-hairline pt-6">
        <Link to="/audit" className="font-mono text-[12px] uppercase tracking-label text-cyan hover:text-content-primary">
          Run the console → /audit
        </Link>
        <Link to="/thesis/systems-are-graphs" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          ← Systems are graphs
        </Link>
        <Link to="/" className="font-mono text-[12px] uppercase tracking-label text-content-secondary hover:text-content-primary">
          Back to the console
        </Link>
      </nav>
    </article>
  )
}
