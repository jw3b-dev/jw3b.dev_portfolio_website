/*
 * jw3b.dev v2 — Four-hat identity surface (P1-11 · FR-003 / BR-07)  ·  frontend-engineer
 * One operator, four hats, shown TOGETHER on one surface. The filter is the whole point:
 * selecting a hat DIMS the other three (opacity + muted text) — it never hides them, because
 * the thesis is that the four are one person, not four options (BR-07). Selecting the active
 * hat again clears the filter. Buttons carry aria-pressed; only colour/opacity move, and only
 * under motion-safe (NFR-05). Semantic tokens only — hat accents from HATS (constants/index).
 */
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { HATS } from '../../constants/index.js'

export default function FourHats({ className = '' }) {
  // A hero chip arrives here with the hat it named in router state; honour it as the initial
  // filter, then behave exactly as before. Anything that is not one of the four keys is ignored.
  const location = useLocation()
  const fromHero = HATS.some((h) => h.key === location.state?.hat) ? location.state.hat : null
  const [active, setActive] = useState(fromHero) // null = no filter, all at full weight

  /*
   * The hero chips link to this same route, so React Router does NOT remount this component —
   * `useState(fromHero)` runs once, on first mount, and a later chip click would change the URL
   * state while leaving the filter untouched. Syncing on the state key fixes that. `location.key`
   * (not the hat) is the dependency: clicking the SAME hat twice should re-apply it, and keying on
   * the value would swallow the second click.
   */
  useEffect(() => {
    if (fromHero) setActive(fromHero)
  }, [location.key, fromHero])

  return (
    <section aria-labelledby="fourhats-title" className={className}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="fourhats-title" className="font-display text-lg font-semibold text-content-primary">
          One operator, four hats
        </h2>
        {active && (
          <button
            type="button"
            onClick={() => setActive(null)}
            className="font-mono text-[11px] uppercase tracking-label text-content-muted hover:text-content-secondary motion-safe:transition-colors"
          >
            Show all
          </button>
        )}
      </div>
      <p className="mt-1 max-w-prose text-sm text-content-secondary">
        Filter to focus a hat — the others dim, never disappear. It’s one person wearing all four.
      </p>

      <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {HATS.map((h) => {
          const isActive = active === h.key
          const dimmed = active !== null && !isActive
          return (
            <li key={h.key}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => setActive(isActive ? null : h.key)}
                className={[
                  'w-full rounded-lg border bg-panel px-4 py-3 text-left motion-safe:transition-all',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan',
                  isActive ? 'border-cyan/50 shadow-edge-cyan' : 'border-hairline',
                  // DIM, never hide (BR-07): reduced opacity + still in the DOM/flow.
                  dimmed ? 'opacity-40 hover:opacity-70' : 'opacity-100',
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${h.dot}`} aria-hidden="true" />
                  <span className={`font-mono text-[12px] font-semibold uppercase tracking-label ${h.text}`}>
                    {h.label}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-snug text-content-secondary">{h.blurb}</p>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
