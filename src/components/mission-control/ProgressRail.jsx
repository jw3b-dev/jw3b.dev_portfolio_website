/*
 * jw3b.dev v2 — Mission Control progress rail (P1-17 · FR-028)  ·  app-ui-engineer
 * The stepped wizard progress indicator for the hire-me configurator. It is shared UI state
 * (the wizard's position), not server or form state — it renders whatever step MissionControl
 * owns. Completed steps are navigable backwards (honest: you can revise an earlier answer);
 * the current step is marked aria-current; future steps are inert and dimmed. Labels come from
 * the parent so the "ENGAGEMENT" label (never "PARAMETERS") is defined in exactly one place.
 * Semantic tokens only; only colour/opacity move, and only under motion-safe (NFR-05).
 */
export default function ProgressRail({ steps, current, maxReached, onSelect }) {
  return (
    <nav aria-label="Configurator progress" className="w-full">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-3">
        {steps.map((s, i) => {
          const isCurrent = i === current
          const isDone = i < current
          const isReachable = i <= maxReached && i !== current
          return (
            <li key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                disabled={!isReachable}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => isReachable && onSelect(i)}
                className={[
                  'group flex items-center gap-2 rounded-md px-2 py-1 text-left motion-safe:transition-colors',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan',
                  isReachable ? 'cursor-pointer hover:bg-raised' : 'cursor-default',
                ].join(' ')}
              >
                <span
                  aria-hidden="true"
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold motion-safe:transition-colors',
                    isCurrent
                      ? 'border-cyan bg-cyan/10 text-cyan'
                      : isDone
                        ? 'border-verified bg-verified/10 text-verified'
                        : 'border-hairline text-content-muted',
                  ].join(' ')}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span
                  className={[
                    'font-mono text-[11px] uppercase tracking-label motion-safe:transition-colors',
                    isCurrent
                      ? 'text-content-primary'
                      : isReachable || isDone
                        ? 'text-content-secondary'
                        : 'text-content-muted',
                  ].join(' ')}
                >
                  {s.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <span aria-hidden="true" className="h-px w-4 bg-hairline sm:w-6" />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
