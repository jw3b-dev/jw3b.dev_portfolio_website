/*
 * jw3b.dev v2 — CheckoutTerms gate (P3-04 · FR-059)  ·  compliance-officer + app-ui-engineer
 * STRUCTURAL terms acknowledgment for PAID checkouts: CheckoutStateMachine wraps the escrow and
 * Unlock rails in this gate, so no paid action can render before the visitor accepts the
 * engagement terms — the requirement is enforced by composition, not by a flag someone can
 * forget. The free book-a-call floor is deliberately NOT gated (no purchase, no terms friction).
 * Content comes from the single canonical source src/content/terms.md (same pattern as
 * /privacy — a legal surface must show its true text). Research basis: docs/COMPLIANCE_RESEARCH.md Q4/Q6.
 */
import { useState } from 'react'
import termsMd from '../../content/terms.md?raw'
import { parseMarkdown } from '../../lib/markdown.js'

const BLOCKS = parseMarkdown(termsMd)

export default function CheckoutTerms({ children, onBack = () => {} }) {
  const [accepted, setAccepted] = useState(false)
  const [checked, setChecked] = useState(false)

  if (accepted) return children

  return (
    <section aria-labelledby="checkout-terms-title" className="rounded-lg border border-hairline bg-panel p-5">
      <p className="font-mono text-[11px] uppercase tracking-label text-cyan">Before checkout</p>
      <h2 id="checkout-terms-title" className="mt-1 font-display text-lg font-semibold text-content-primary">
        Engagement terms
      </h2>

      <div className="mt-4 flex max-h-72 flex-col gap-2 overflow-y-auto rounded-md border border-hairline bg-void p-4">
        {BLOCKS.map((block, i) =>
          block.type === 'h1' ? null : block.type === 'h2' ? (
            <h3 key={i} className="mt-2 font-mono text-[12px] font-semibold uppercase tracking-label text-cyan">
              {block.text}
            </h3>
          ) : block.type === 'ul' ? (
            <ul key={i} className="flex list-disc flex-col gap-1 pl-5 text-sm text-content-secondary">
              {block.items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          ) : (
            <p key={i} className="text-sm leading-relaxed text-content-secondary">
              {block.text}
            </p>
          ),
        )}
      </div>

      <label className="mt-4 flex cursor-pointer items-start gap-2 text-sm text-content-secondary">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[color:var(--color-cyan,#22d3ee)]"
        />
        <span>I have read and accept the engagement terms.</span>
      </label>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          disabled={!checked}
          onClick={() => setAccepted(true)}
          className="rounded-lg border border-cyan/40 bg-cyan/10 px-4 py-2 text-sm font-medium text-cyan disabled:opacity-40 motion-safe:transition-colors"
        >
          Accept and continue
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-content-muted underline hover:text-content-secondary"
        >
          Back
        </button>
      </div>
    </section>
  )
}
