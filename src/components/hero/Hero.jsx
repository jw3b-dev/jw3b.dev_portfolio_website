import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, MotionConfig } from 'framer-motion'
import { duration, ease, prefersReducedMotion } from '../../styles/motion.js'
import Claim from '../Claim.jsx'
import { HATS } from '../../constants/index.js'
import { auditSolidity, SAMPLE_CONTRACT, SEVERITY_META } from '../../lib/auditHeuristics.js'
import { reportFunnel } from '../../lib/funnelBeacon.js'

/*
 * P1-09 — Operable, proof-first hero (brief 01, ★ make-or-break).
 * NOT a headshot+tagline hero. Three zones: one position line (the LCP text), a REAL
 * operable auditor console (edit the contract → findings re-run live, client-side, no
 * network), and a verdict rail of cleared <Claim>s. First paint shows a truthful recorded
 * run resolving to VERIFIED·REPRODUCED; editing switches it to a clearly-labelled live
 * heuristic pass. The only motion is state (verdict resolve + liveness tick). No 3D, no
 * particles, no count-up, no pipeline diagram.
 */

const RECORDED_DATE = '2026-08-16'

// HATS is the canonical four-hat identity (constants/index.js · FR-003). The hero strip
// shows the labels; the operable dim-filter surface is <FourHats /> (P1-11) on Home.

function LivenessTick({ live }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-cyan motion-safe:animate-pulse' : 'bg-content-muted'}`}
      />
      <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">
        {live ? 'live' : 'idle'}
      </span>
    </span>
  )
}

function SeverityRow({ f, expanded }) {
  const meta = SEVERITY_META[f.severity]
  return (
    <li className="border-t border-hairline py-2 first:border-t-0">
      <div className="flex items-baseline gap-2">
        <span className={`h-1.5 w-1.5 shrink-0 translate-y-1 rounded-full ${meta.dot}`} />
        <span className={`font-mono text-[10px] font-semibold uppercase tracking-label ${meta.tone}`}>
          {meta.label}
        </span>
        <span className="text-sm text-content-primary">{f.title}</span>
        <span className="ml-auto font-mono text-[11px] text-content-muted">L{f.line}</span>
      </div>
      {expanded && <p className="mt-1 pl-3.5 text-[13px] leading-snug text-content-secondary">{f.detail}</p>}
    </li>
  )
}

function VerdictChip({ reproduced }) {
  return (
    <motion.div
      key={reproduced ? 'reproduced' : 'heuristic'}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.verdict, ease: ease.standard }}
      className="inline-flex items-center gap-2 rounded-sm border border-cyan/50 bg-cyan/5 px-2.5 py-1"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden className="text-verified">
        <path d="M2.5 6.5l2.5 2.5 4.5-5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-mono text-[11px] font-semibold uppercase tracking-label text-verified">
        {reproduced ? 'Verified · Reproduced' : 'Instant screen'}
      </span>
    </motion.div>
  )
}

function Console() {
  const [source, setSource] = useState(SAMPLE_CONTRACT)
  const [phase, setPhase] = useState('settled') // 'checking' → 'settled'
  const result = useMemo(() => auditSolidity(source), [source])
  const edited = source !== SAMPLE_CONTRACT

  /*
   * Count the hero screen (brief 01, next-need 1). This surface's claim is "a visitor runs a real
   * screen in under ten seconds", and it was the one thing the funnel could not see — the screen
   * runs entirely client-side, so `tool_run` only ever counted /audit. The measurement gap sat
   * exactly on the claim.
   *
   * Reported when the visitor has EDITED the sample, not on mount: arriving at a page that
   * happens to render a pre-filled result is not "running a screen", and counting it would
   * inflate the very number this exists to make honest. Deduped in memory per page load, so a
   * keystroke-driven surface reports once. Fire-and-forget by construction.
   */
  useEffect(() => {
    if (edited) reportFunnel('home', 'tool_run')
  }, [edited])

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPhase('settled')
      return
    }
    setPhase('checking')
    const t = setTimeout(() => setPhase('settled'), 180)
    return () => clearTimeout(t)
  }, [source])

  // "live" is reserved for MODEL PROVENANCE on this site; the free tier is INSTANT (see
  // src/components/audit/consoleCopy.js). "Live heuristic" collided with the run badges'
  // "live model", teaching two meanings of one word on one screen.
  const runLabel = edited ? 'Instant screen · in your browser' : 'Recorded run · reproduced on an Anvil mainnet fork'

  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-panel shadow-edge-cyan">
      {/* console chrome */}
      <div className="flex items-center gap-3 border-b border-hairline bg-raised px-3 py-2">
        <span className="font-mono text-[12px] text-content-secondary">Vault.sol</span>
        <span className="font-mono text-[11px] text-content-muted">/audit · solidity auditor</span>
        <span className="ml-auto">
          <LivenessTick live={edited} />
        </span>
      </div>

      <div className="grid md:grid-cols-2">
        {/* editable source */}
        <div className="border-b border-hairline md:border-b-0 md:border-r">
          <label htmlFor="hero-audit-src" className="sr-only">
            Solidity source to audit
          </label>
          <textarea
            id="hero-audit-src"
            value={source}
            spellCheck={false}
            onChange={(e) => setSource(e.target.value)}
            className="h-64 w-full resize-none bg-void px-3 py-3 font-mono text-[12.5px] leading-relaxed text-content-secondary outline-none focus:text-content-primary"
            aria-label="Editable Solidity contract — edit to re-run the instant screen"
          />
        </div>

        {/* findings readout */}
        <div className="flex min-h-[16rem] flex-col px-3 py-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-label text-caution">{runLabel}</span>
            {!edited && (
              <span className="font-mono text-[10px] text-content-muted">· {RECORDED_DATE}</span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {phase === 'checking' ? (
              <motion.p
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: duration.instant }}
                className="font-mono text-[12px] text-content-muted"
              >
                running auditor…
              </motion.p>
            ) : (
              <motion.div
                key="settled"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: duration.verdict, ease: ease.standard }}
                className="flex flex-1 flex-col"
              >
                {result.empty ? (
                  <p className="font-mono text-[12px] text-content-muted">Paste a contract to audit.</p>
                ) : result.clean ? (
                  <p className="text-sm text-content-secondary">
                    No known patterns matched.{' '}
                    <span className="text-content-muted">Instant screen — not a full audit.</span>
                  </p>
                ) : (
                  <>
                    <ul className="mb-3">
                      {result.findings.map((f, i) => (
                        <SeverityRow key={f.id + f.line} f={f} expanded={i === 0} />
                      ))}
                    </ul>
                    <div className="mt-auto flex items-center gap-2">
                      <VerdictChip reproduced={!edited} />
                      <span className="font-mono text-[11px] text-content-muted">
                        {result.findings.length} finding{result.findings.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/*
          Disclosure + the handoff, on one line and OUTSIDE the findings conditional.
          It first sat inside the has-findings branch, where a clean contract produced no findings
          and therefore no way onward — the E2E caught that; the jsdom tests could not, because
          they seeded a contract that happens to trip a detector. A clean screen is still worth
          continuing in the full console.
          The source travels in router STATE, in memory rather than storage: this site's
          no-consent-banner position rests on setting no cookie and no tracking storage
          (ADR-P5-01), and a convenience handoff is not worth spending that on.
      */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline bg-raised px-3 py-1.5">
        <p className="font-mono text-[10px] text-caution/90">
          Deterministic pattern screen — a fast pre-screen, not a full audit or financial advice.
        </p>
        <Link
          to="/audit"
          state={{ source }}
          className="ml-auto font-mono text-[10px] uppercase tracking-label text-cyan no-underline hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          Open in the full console →
        </Link>
      </div>
    </div>
  )
}

function VerdictRail() {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">Verified record</p>

      <div className="rounded-md border border-hairline bg-panel px-3 py-2.5">
        <p className="mb-1 font-mono text-[11px] text-content-secondary">CodeHawks competitive audit</p>
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
          <Claim id="codehawks-rank" />
          <span className="text-content-muted">·</span>
          <Claim id="codehawks-valid-submissions" />
          <span className="text-content-muted">·</span>
          <Claim id="codehawks-exp" />
        </p>
      </div>

      <div className="rounded-md border border-hairline bg-panel px-3 py-2.5">
        <p className="mb-1 font-mono text-[11px] text-content-secondary">KTHULHU — autonomous auditor</p>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
          <span className="font-mono text-verified">live</span>
          <span className="text-content-muted">·</span>
          <Claim id="kthulhu-paying-users" />
        </p>
      </div>

      <div className="rounded-md border border-hairline bg-panel px-3 py-2.5">
        <p className="mb-1 font-mono text-[11px] text-content-secondary">Overmind GenAI engine</p>
        <p className="text-sm">
          <Claim id="overmind-pipeline" />
        </p>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <MotionConfig reducedMotion="user">
      <section aria-labelledby="hero-title" className="relative min-h-[100svh] bg-void px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: duration.entrance, ease: ease.outExpo }}
          className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-8 pt-[12vh] lg:grid-cols-12"
        >
          {/* zone 1 — position line (LCP) */}
          <div className="lg:col-span-12">
            <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Senior Agentic AI Developer</p>
            <h1
              id="hero-title"
              className="mt-4 max-w-[20ch] text-balance font-display text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.03] tracking-tight text-content-primary"
            >
              Multi-agent systems that survive production — verified in front of you.
            </h1>
            <p className="mt-4 max-w-[52ch] text-[clamp(1rem,2vw,1.15rem)] leading-relaxed text-content-secondary">
              Not a résumé. A console John left running. Edit the contract below and the auditor
              re-runs — the same discipline behind KTHULHU: reproduce the finding, don’t assert it.
            </p>
          </div>

          {/* zone 2 — operable console (dominant) */}
          <div className="lg:col-span-7">
            <Console />
          </div>

          {/* zone 3 — verdict rail */}
          <div className="lg:col-span-5">
            <VerdictRail />
          </div>

          {/* four-hat strip (low, identity structure without a skills grid) */}
          <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-hairline pt-4 lg:col-span-12">
            <span className="font-mono text-[10px] uppercase tracking-label text-content-muted">One operator, four hats</span>
            {/* Brief 01, next-need 2: these were display-only. A visitor learned the vocabulary
                here and discovered it was actionable four folds down. Each chip now jumps to the
                identity section with THAT hat preselected — router state carries the choice, so
                nothing is stored and the URL stays clean. */}
            {HATS.map((h) => (
              <Link
                key={h.key}
                to="/#fourhats-title"
                state={{ hat: h.key }}
                className="inline-flex items-center gap-2 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                title={`See the ${h.label} hat's work`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${h.dot}`} />
                <span className={`text-[13px] ${h.text} underline-offset-4 hover:underline`}>{h.label}</span>
              </Link>
            ))}
          </div>
        </motion.div>
      </section>
    </MotionConfig>
  )
}
