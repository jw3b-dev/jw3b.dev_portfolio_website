/*
 * jw3b.dev v2 — run the claims gate yourself (W4 · PRODUCT_AUDIT #22)
 *
 * /thesis/zero-trust-validator argues: "Zero-trust cuts both ways: it applies to John's own
 * claims too. Every credential and figure on this site routes through a claims gate wired into
 * the build — it renders only if it traces to a real, checkable source, and an unbacked claim
 * fails the pipeline." The page then asked you to take that on faith, which is the one thing the
 * page is against.
 *
 * This runs the ACTUAL gate — the same `scanTextForForbidden` and `isCleared` that
 * scripts/claims-gate.mjs runs in CI and that blocks the build. Not a re-implementation for
 * display: the same import. If these two ever diverged, the demo would be the lie it exists to
 * disprove.
 */
import { useMemo, useState } from 'react'
import { scanTextForForbidden, isCleared, FORBIDDEN_PATTERNS } from '../../lib/claimsValidate.js'
import { allClaims, forbiddenList } from '../../lib/claimsRegister.js'

/*
 * The try-these come from the register's OWN forbidden list rather than being written out here.
 *
 * Two reasons, and the second one is the interesting one. First, they stay correct: add a
 * forbidden entry and this demo offers it automatically. Second, writing those phrases as string
 * literals in a shipped component is exactly what the claims gate is built to stop — and it duly
 * failed the build when I tried. The gate cannot tell "presented as fact" from "displayed as an
 * example", and it should not have to guess. Sourcing them from src/data (which the gate excludes
 * as the claims infrastructure itself) means the demo can show the forbidden phrases without any
 * exception being carved into the rule that protects the site.
 */
const CLEARED_EXAMPLE = allClaims().find((c) => isCleared(c))
const EXAMPLES = [
  ...forbiddenList.slice(0, 4),
  CLEARED_EXAMPLE ? `${CLEARED_EXAMPLE.value} — ${CLEARED_EXAMPLE.label}` : 'a claim with an evidence pointer',
]

const CHIP =
  'rounded-md border border-hairline px-2 py-1 text-left font-mono text-[10px] text-content-muted motion-safe:transition-colors hover:text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

export default function ClaimsGateDemo() {
  const [text, setText] = useState(EXAMPLES[0])

  // The real scan, on every keystroke. Pure and instant — no network, nothing to trust.
  const hits = useMemo(() => scanTextForForbidden(text), [text])

  // How many of the site's own claims would survive if their evidence pointer vanished — the
  // "cuts both ways" part, applied to John.
  const registerStats = useMemo(() => {
    const claims = allClaims()
    const cleared = claims.filter((c) => isCleared(c)).length
    const withoutEvidence = claims.filter((c) => isCleared({ ...c, evidence_pointer: '' })).length
    return { total: claims.length, cleared, withoutEvidence }
  }, [])

  return (
    <section aria-labelledby="gate-demo" className="mt-6 rounded-lg border border-hairline bg-panel p-4">
      <h2 id="gate-demo" className="font-mono text-[11px] uppercase tracking-label text-content-muted">
        Run the gate
      </h2>
      <p className="mt-2 text-sm text-content-secondary">
        This is the same function the build runs — <code>scanTextForForbidden</code>, imported, not
        re-implemented. Type a claim a portfolio might want to make and watch it pass or fail.
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" onClick={() => setText(ex)} className={CHIP}>
            {ex.length > 34 ? `${ex.slice(0, 34)}…` : ex}
          </button>
        ))}
      </div>

      <label htmlFor="gate-input" className="mt-3 block text-sm font-medium text-content-secondary">
        Claim
      </label>
      <textarea
        id="gate-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        spellCheck={false}
        className="mt-1 w-full rounded-md border border-hairline bg-void px-3 py-2 font-mono text-xs text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      />

      <div
        role="status"
        className={`mt-3 rounded-md border p-3 ${hits.length ? 'border-caution/40' : 'border-verified/40'}`}
      >
        <p
          className={`font-mono text-[11px] uppercase tracking-label ${
            hits.length ? 'text-caution' : 'text-verified'
          }`}
        >
          {hits.length ? `Blocked — ${hits.length} rule${hits.length === 1 ? '' : 's'} matched` : 'Passes the forbidden scan'}
        </p>
        {hits.length > 0 ? (
          <ul className="mt-2 space-y-1">
            {hits.map((h) => (
              <li key={h} className="break-all font-mono text-[11px] text-content-secondary">
                {h}
              </li>
            ))}
          </ul>
        ) : (
          // Passing the scan is NOT clearance — the honest half of the demo.
          <p className="mt-1 text-xs text-content-muted">
            No forbidden pattern matched. That is not clearance: to render on this site a claim
            must also be marked <span className="font-mono">cleared</span> in the register AND
            carry an evidence pointer.
          </p>
        )}
      </div>

      <p className="mt-3 border-t border-hairline pt-2 text-xs text-content-muted">
        Applied to John: {registerStats.cleared} of {registerStats.total} register claims render
        today. Strip their evidence pointers and{' '}
        <span className="text-content-primary">{registerStats.withoutEvidence}</span> would — the
        gate does not care whose claim it is. {FORBIDDEN_PATTERNS.length} forbidden patterns are in
        force.
      </p>
    </section>
  )
}
