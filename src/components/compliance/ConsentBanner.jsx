/*
 * jw3b.dev v2 — ConsentBanner (P3-03 · FR-058)  ·  compliance-officer + frontend-engineer
 * Cookie/analytics consent banner, shipped as a READY CONTINGENCY behind the `consent` flag —
 * DEFAULT OFF, and rightly so: the research disposition (docs/COMPLIANCE_RESEARCH.md Q2) found
 * the site sets NO cookies and no tracking storage, so neither ePrivacy Art. 5(3) nor POPIA's
 * opt-in model requires a banner today. The rule this component protects: any future
 * non-essential analytics/marketing storage MUST flip `consent` ON and honor the choice below.
 * The stored choice itself is strictly-necessary storage (remembering consent) — exempt.
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'

const STORAGE_KEY = 'jw3b-consent' // 'granted' | 'denied'

function readChoice() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  } catch {
    return null // storage blocked → treat as unchosen; banner shows, choice just won't persist
  }
}

function writeChoice(value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, value)
  } catch {
    /* storage blocked — the in-session choice still applies */
  }
}

/** Read the current consent state ('granted' | 'denied' | null). For future analytics gating. */
export function consentChoice() {
  return readChoice()
}

export default function ConsentBanner() {
  const [choice, setChoice] = useState(readChoice)

  if (choice) return null

  const decide = (value) => {
    writeChoice(value)
    setChoice(value)
  }

  return (
    <aside
      role="region"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-toast border-t border-hairline bg-panel/95 px-5 py-4 backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-content-secondary">
          This site would like to use optional analytics. No optional cookies are set unless you
          agree. See the <Link to="/privacy" className="text-cyan underline">privacy notice</Link>.
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => decide('denied')}
            className="rounded-lg border border-hairline px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary motion-safe:transition-colors"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide('granted')}
            className="rounded-lg border border-cyan/40 bg-cyan/10 px-3 py-1.5 text-sm font-medium text-cyan motion-safe:transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </aside>
  )
}
