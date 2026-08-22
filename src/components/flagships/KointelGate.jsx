/*
 * Kointel — run the compliance gate  ·  app-ui-engineer
 *
 * The card claimed "a compliance gate in CI, so the governance is engineered in, not bolted on"
 * and then offered a link to a product that refuses framing (`X-Frame-Options: DENY` on the
 * Kointel origin, so the card never even reached the iframe — it degraded to a description and a
 * link). The visitor's only option was to believe the sentence. This is the sentence, executable.
 *
 * THE HONESTY LINE, which is the whole design of this panel. This is NOT Kointel's source code and
 * must never read as though it were. It is an independent implementation of the RULE Kointel
 * enforces — written here so the claim can be checked instead of trusted. The panel says so above
 * the fold, before any code is on screen, for the same reason the corpus panel names its sources:
 * the surface arguing that claims should be verifiable cannot itself ask for faith.
 *
 * It also states its own blind spot. The gate is textual pattern matching, not dataflow analysis;
 * a call assembled at runtime passes. Saying so costs nothing and is the difference between a
 * demonstration and a sales pitch.
 */
import { useMemo, useState } from 'react'
import { runKointelGate, GATE_RULES, GATE_EXAMPLES } from '../../lib/kointelGate.js'

const chip =
  'rounded-md border px-2 py-1 font-mono text-[10px] uppercase tracking-label motion-safe:transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan'

const COMPLIANT = GATE_EXAMPLES.find((e) => e.id === 'compliant')

export default function KointelGate() {
  const [source, setSource] = useState(COMPLIANT.source)
  const [showRules, setShowRules] = useState(false)

  // Deterministic and cheap, so it runs as you type — the same posture as the instant screen on
  // /audit. A gate you have to ask for is a gate you forget to ask for.
  const result = useMemo(() => runKointelGate(source), [source])

  return (
    <section aria-labelledby="kointel-gate" className="mt-5 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h4 id="kointel-gate" className="font-mono text-[11px] uppercase tracking-label text-cyan">
          On-site · run the compliance gate
        </h4>
        <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          the rule, not the product
        </span>
      </div>

      <p className="mt-2 text-sm text-content-secondary">
        Kointel fails its build if a Web3 module can sign or send. A crypto-tax product reads
        wallets, and reading needs no key — so the ability to move funds is removed by CI rather
        than forbidden by policy. Edit the module below and watch the verdict change.
      </p>

      <p className="mt-2 text-sm text-caution">
        This is an independent implementation of that rule, running in your browser — not Kointel&rsquo;s
        source code. It matches patterns in text; it does not trace dataflow, so a call assembled at
        runtime would pass it. A real gate is paired with review for exactly that reason.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">Load:</span>
        {GATE_EXAMPLES.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => setSource(ex.source)}
            title={ex.blurb}
            className={`${chip} border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan`}
          >
            {ex.title}
          </button>
        ))}
      </div>

      <label htmlFor="kointel-src" className="sr-only">
        A Web3 module to check against the compliance gate
      </label>
      <textarea
        id="kointel-src"
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        rows={10}
        className="mt-2 w-full rounded-md border border-hairline bg-void p-3 font-mono text-xs leading-relaxed text-content-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      />

      {/* The verdict reads as CI would report it: a build result, not a score. */}
      <div
        role="status"
        aria-live="polite"
        className={`mt-3 rounded-md border p-3 ${
          result.empty
            ? 'border-hairline text-content-muted'
            : result.passed
              ? 'border-verified/40 bg-verified/5 text-verified'
              : 'border-failed/40 bg-failed/5 text-failed'
        }`}
      >
        <p className="font-mono text-[11px] uppercase tracking-label">
          {result.empty
            ? 'Nothing to check'
            : result.passed
              ? '✓ Build passes — no signing capability in this module'
              : `✗ Build fails — ${result.violations.length} banned ${result.violations.length === 1 ? 'capability' : 'capabilities'}`}
        </p>
        {result.empty && (
          // An empty module is not a pass. Saying "compliant" over no input is the exact species
          // of false green this whole site argues against.
          <p className="mt-1 text-sm text-content-secondary">
            An empty module has not been proven compliant — it has just not been checked.
          </p>
        )}
      </div>

      {result.violations.length > 0 && (
        <ol className="mt-3 flex flex-col gap-3">
          {result.violations.map((v, i) => (
            <li key={`${v.id}-${v.line}-${i}`} className="border-l-2 border-failed/40 pl-3">
              <p className="font-mono text-[10px] uppercase tracking-label text-failed">
                line {v.line} · {v.rule}
              </p>
              <pre className="mt-1 overflow-x-auto font-mono text-xs text-content-primary">{v.snippet}</pre>
              <p className="mt-1 text-sm leading-relaxed text-content-secondary">{v.why}</p>
            </li>
          ))}
        </ol>
      )}

      <button
        type="button"
        onClick={() => setShowRules((v) => !v)}
        aria-expanded={showRules}
        aria-controls="kointel-rules"
        className={`mt-3 ${chip} border-hairline text-content-secondary hover:border-cyan/50 hover:text-cyan`}
      >
        {showRules ? 'Hide the rules' : `Show all ${GATE_RULES.length} rules`}
      </button>

      {showRules && (
        <ul id="kointel-rules" className="mt-2 flex flex-col gap-2">
          {GATE_RULES.map((r) => (
            <li key={r.id} className="border-l border-hairline pl-3">
              <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">{r.rule}</p>
              <p className="text-sm text-content-secondary">{r.why}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
