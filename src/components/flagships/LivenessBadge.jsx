/*
 * "Is this flagship up right now?"  ·  app-ui-engineer  (brief 04, next-need 3)
 *
 * No card said. A flagship that is down and silent about it is worse than one that says so.
 *
 * The badge only ever reports REACHABILITY — "Responding", not "working". A 200 from a homepage
 * means the origin is serving; upgrading that into a claim about the product would be the same
 * class of overstatement this site spends its whole argument against.
 */
import { useEffect, useState } from 'react'
import { fetchLiveness, stateFor, livenessLabel, LIVENESS } from '../../lib/livenessClient.js'
import { workerOriginAllowed } from '../../config/embeds.js'

const TONE = { verified: 'text-verified', caution: 'text-caution', muted: 'text-content-muted' }

export default function LivenessBadge({ target, fetcher = fetchLiveness }) {
  const [liveness, setLiveness] = useState(null)

  useEffect(() => {
    // Only probe from the deployed origin. The Worker's CORS allowlist rejects localhost and
    // preview hosts, and the BROWSER logs that rejection before our catch can swallow it — so an
    // unconditional mount-time probe puts a console error on every local build. The console-error
    // budget caught exactly that. Elsewhere the badge renders nothing, which is honest: we have no
    // way to check, and a permanent "unknown" on every preview is noise rather than information.
    if (!workerOriginAllowed()) return undefined
    let alive = true
    fetcher().then((l) => { if (alive) setLiveness(l) })
    return () => { alive = false }
  }, [fetcher])

  // Before the first verdict lands, render nothing rather than a flash of "unknown" that
  // resolves a moment later — a status that changes under the reader teaches them to distrust it.
  if (!liveness) return null

  const state = stateFor(liveness, target)
  const { text, tone } = livenessLabel(state)

  return (
    <span
      title={
        state === LIVENESS.REACHABLE
          ? `The origin answered when we last checked${liveness.checkedAt ? ` (${liveness.checkedAt})` : ''}. Reachable is not the same as working.`
          : 'Checked from our Worker, not from your browser — the flagship origins send no CORS headers.'
      }
      className={`font-mono text-[10px] uppercase tracking-label ${TONE[tone]}`}
    >
      ● {text}
    </span>
  )
}
