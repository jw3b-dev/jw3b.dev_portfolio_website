/*
 * jw3b.dev v2 — Mission Control configurator (P1-17 · FR-028)  ·  app-ui-engineer
 * The /hire-me engagement configurator: a four-step wizard — OBJECTIVE → ASSESSMENT →
 * ENGAGEMENT → LOADOUT — driven by a shared progress rail. Step 3 is "ENGAGEMENT" (project vs
 * retainer), never "PARAMETERS" (the label-drift this task exists to fix).
 *
 * Scope boundary: this file owns SCREEN + STATE only. The multi-step selections are client UI
 * state (a wizard), captured here. The assessment→recommendation MEANING and price provenance
 * are domain logic owned by P1-18 (`src/lib/loadout.js`, FR-029/FR-030): until it lands, the
 * loadout step resolves the tier by a plain (objective × engagement) lookup over retainer.json
 * — a lookup, not a calculation — and shows the assessment answers as captured context. Prices
 * are printed ONLY from retainer.json (never free-typed); unprovisioned tiers say so honestly.
 */
import { useState } from 'react'
import { resolveLoadout, recommendEngagement } from '../../lib/loadout.js'
import ProgressRail from './ProgressRail.jsx'
import BookACall from './BookACall.jsx'

const STEPS = [
  { key: 'objective', label: 'Objective' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'engagement', label: 'Engagement' }, // FR-028: this label is "ENGAGEMENT", not "PARAMETERS".
  { key: 'loadout', label: 'Loadout' },
]

// Objectives map onto retainer.json `objective` values and onto the four-hat accents (BR-07).
const OBJECTIVES = [
  {
    id: 'security',
    title: 'Secure what I’m building',
    desc: 'A smart-contract audit or an ongoing security review.',
    dot: 'bg-hat-auditor',
    text: 'text-hat-auditor',
    ring: 'hat-auditor',
  },
  {
    id: 'engineering',
    title: 'Build an agentic or on-chain system',
    desc: 'Design and ship an AI/agentic or on-chain system, security-first.',
    dot: 'bg-hat-engineer',
    text: 'text-hat-engineer',
    ring: 'hat-engineer',
  },
  {
    id: 'pm',
    title: 'Lead delivery of a defined scope',
    desc: 'AgilePM-led delivery, from charter to honest handover.',
    dot: 'bg-hat-pm',
    text: 'text-hat-pm',
    ring: 'hat-pm',
  },
]

// Step 2 questions. Captured now; P1-18 (FR-029) turns them into a scored recommendation.
const ASSESSMENT = [
  {
    id: 'stage',
    label: 'Where is the work today?',
    options: [
      { v: 'idea', l: 'Idea / spec' },
      { v: 'building', l: 'In progress' },
      { v: 'shipped', l: 'Live / shipped' },
    ],
  },
  {
    id: 'surface',
    label: 'What’s the surface?',
    options: [
      { v: 'contracts', l: 'Smart contracts' },
      { v: 'agentic', l: 'Agentic / AI system' },
      { v: 'both', l: 'Both' },
    ],
  },
  {
    id: 'urgency',
    label: 'What’s the timeline?',
    options: [
      { v: 'exploring', l: 'Exploring' },
      { v: 'weeks', l: 'Weeks' },
      { v: 'urgent', l: 'Urgent' },
    ],
  },
]

const ENGAGEMENTS = [
  { id: 'project', title: 'Project', desc: 'A defined scope with a start and an end.' },
  { id: 'retainer', title: 'Retainer', desc: 'Ongoing capacity, billed monthly.' },
]

function OptionCard({ selected, recommended, onClick, dot, text, title, desc }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={[
        'flex w-full flex-col gap-1.5 rounded-lg border bg-panel px-4 py-3 text-left motion-safe:transition-all',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan',
        selected ? 'border-cyan/50 shadow-edge-cyan' : 'border-hairline hover:border-content-muted',
      ].join(' ')}
    >
      {dot && (
        <span className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
          <span className={`font-mono text-[12px] font-semibold uppercase tracking-label ${text}`}>
            {title}
          </span>
        </span>
      )}
      {!dot && (
        <span className="flex items-center gap-2">
          <span className="font-display text-base font-semibold text-content-primary">{title}</span>
          {recommended && (
            <span className="rounded-sm border border-verified/40 bg-verified/5 px-1.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-label text-verified">
              Recommended
            </span>
          )}
        </span>
      )}
      <span className="text-sm leading-snug text-content-secondary">{desc}</span>
    </button>
  )
}

export default function MissionControl({ className = '', onBook = () => {} }) {
  const [step, setStep] = useState(0)
  const [maxReached, setMaxReached] = useState(0)
  const [objective, setObjective] = useState(null)
  const [assessment, setAssessment] = useState({}) // { stage, surface, urgency }
  const [engagement, setEngagement] = useState(null)
  const [booking, setBooking] = useState(false)

  const go = (i) => {
    setStep(i)
    setMaxReached((m) => Math.max(m, i))
    setBooking(false)
  }

  const canContinue =
    (step === 0 && objective) ||
    (step === 1 && ASSESSMENT.every((q) => assessment[q.id])) ||
    (step === 2 && engagement)

  // P1-18 engine owns the recommendation + price provenance. `recommended` (assessment-driven,
  // FR-029) flags the engagement Step 3; `loadout` composes the final Step 4.
  const recommended = objective ? recommendEngagement(assessment).recommended : null
  const loadout = objective && engagement ? resolveLoadout({ objective, engagement, assessment }) : null
  const tier = loadout?.tier ?? null

  return (
    <section aria-labelledby="mc-title" className={className}>
      <header>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan" aria-hidden="true" />
          <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
            Mission Control
          </span>
        </div>
        <h1 id="mc-title" className="mt-3 font-display text-2xl font-semibold text-content-primary">
          Configure an engagement
        </h1>
        <p className="mt-1 max-w-prose text-sm text-content-secondary">
          Four steps to an honest scope and an indicative price. No wallet required — booking a
          call is always the floor.
        </p>
      </header>

      <div className="mt-6">
        <ProgressRail steps={STEPS} current={step} maxReached={maxReached} onSelect={go} />
      </div>

      <div className="mt-6 rounded-xl border border-hairline bg-void/40 p-5 sm:p-6">
        {/* Step 1 — OBJECTIVE */}
        {step === 0 && (
          <fieldset>
            <legend className="font-display text-lg font-semibold text-content-primary">
              What do you need?
            </legend>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {OBJECTIVES.map((o) => (
                <OptionCard
                  key={o.id}
                  selected={objective === o.id}
                  onClick={() => setObjective(o.id)}
                  dot={o.dot}
                  text={o.text}
                  title={o.title}
                  desc={o.desc}
                />
              ))}
            </div>
          </fieldset>
        )}

        {/* Step 2 — ASSESSMENT */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <p className="max-w-prose text-sm text-content-secondary">
              A few honest questions so the recommendation fits the work, not a template.
            </p>
            {ASSESSMENT.map((q) => (
              <fieldset key={q.id}>
                <legend className="font-mono text-[11px] uppercase tracking-label text-content-muted">
                  {q.label}
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {q.options.map((opt) => {
                    const selected = assessment[q.id] === opt.v
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setAssessment((a) => ({ ...a, [q.id]: opt.v }))}
                        className={[
                          'rounded-md border px-3 py-1.5 text-sm motion-safe:transition-colors',
                          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan',
                          selected
                            ? 'border-cyan/50 bg-cyan/10 text-content-primary'
                            : 'border-hairline text-content-secondary hover:border-content-muted',
                        ].join(' ')}
                      >
                        {opt.l}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            ))}
          </div>
        )}

        {/* Step 3 — ENGAGEMENT (never "PARAMETERS") */}
        {step === 2 && (
          <fieldset>
            <legend className="font-display text-lg font-semibold text-content-primary">
              Engagement shape
            </legend>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ENGAGEMENTS.map((e) => (
                <OptionCard
                  key={e.id}
                  selected={engagement === e.id}
                  recommended={recommended === e.id}
                  onClick={() => setEngagement(e.id)}
                  title={e.title}
                  desc={e.desc}
                />
              ))}
            </div>
            <p className="mt-3 font-mono text-[11px] text-content-muted">
              The “Recommended” shape is derived from your assessment answers — change them and it
              moves. You choose.
            </p>
          </fieldset>
        )}

        {/* Step 4 — LOADOUT */}
        {step === 3 && (
          <div>
            <h2 className="font-display text-lg font-semibold text-content-primary">
              Recommended loadout
            </h2>
            {tier ? (
              <div className="mt-4 rounded-lg border border-cyan/30 bg-panel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-display text-base font-semibold text-content-primary">
                    {tier.name}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
                    {tier.engagement}
                  </span>
                </div>
                <p className="mt-2 text-sm text-content-secondary">{tier.summary}</p>

                {/* Indicative scope — derived from the assessment by the P1-18 engine (FR-029). */}
                {loadout.scope.length > 0 && (
                  <ul className="mt-4 flex flex-col gap-1 border-t border-hairline pt-3">
                    {loadout.scope.map((line) => (
                      <li key={line} className="flex items-start gap-2 text-sm text-content-secondary">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan" aria-hidden="true" />
                        {line}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-4 border-t border-hairline pt-3">
                  <span className="font-mono text-[11px] uppercase tracking-label text-content-muted">
                    Indicative price
                  </span>
                  {/* FR-030/BR-12: price comes only from the engine, which copies retainer.json. */}
                  <p className="mt-1 font-mono text-sm text-content-primary">{loadout.price.text}</p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm text-content-secondary">
                Pick an objective and an engagement shape to see the recommended loadout.
              </p>
            )}

            <div className="mt-5">
              {booking ? (
                <BookACall
                  selection={{ objective, engagement, assessment }}
                  loadout={loadout}
                  onBack={() => setBooking(false)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setBooking(true)
                    onBook({ objective, engagement, assessment, tierId: tier?.id ?? null })
                  }}
                  className="inline-flex items-center gap-2 rounded-md border border-cyan/50 bg-cyan/10 px-4 py-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan shadow-edge-cyan motion-safe:transition-colors hover:bg-cyan/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
                >
                  Book a call →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Wizard controls */}
      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(step - 1)}
          disabled={step === 0}
          className="rounded-md px-3 py-1.5 font-mono text-[12px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:text-content-primary disabled:cursor-default disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
        >
          ← Back
        </button>
        {step < STEPS.length - 1 && (
          <button
            type="button"
            onClick={() => go(step + 1)}
            disabled={!canContinue}
            className="rounded-md border border-cyan/50 px-4 py-1.5 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan motion-safe:transition-colors hover:bg-cyan/10 disabled:cursor-default disabled:border-hairline disabled:text-content-muted disabled:hover:bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
          >
            Continue →
          </button>
        )}
      </div>
    </section>
  )
}
