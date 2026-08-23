/*
 * "Is the number above still true?"  ·  app-ui-engineer
 *
 * The register is build-time, cleared and gated — which is what makes it trustworthy, and also
 * what let "#124" sit on this page for months after CodeHawks moved it. This line closes that gap
 * without routing around the gate: the <Claim> figures still render from the register, and this
 * says when they were last confirmed against the live source.
 *
 * When the live source DISAGREES it says so, out loud, on the page. That is deliberately the
 * least flattering option available — the alternative is a site that quietly shows a stale figure
 * while its own worker knows better, which is precisely the failure being corrected.
 *
 * Renders NOTHING when the record is unknown: our probe being down says nothing about the record,
 * and a permanent "unknown" is noise. No flash of a state that resolves a moment later.
 */
import { useEffect, useState } from 'react'
import { fetchCodehawksRecord, ageLabel, driftFrom, RECORD_STATE } from '../../lib/codehawksClient.js'
import { workerOriginAllowed } from '../../config/embeds.js'

export default function LiveRecordLine({ registerValidSubmissions, fetcher = fetchCodehawksRecord }) {
  const [live, setLive] = useState(null)

  useEffect(() => {
    // Only probe from the deployed origin: the Worker's CORS allowlist rejects localhost and
    // preview hosts, and the BROWSER logs that rejection before any catch can swallow it — which
    // put a console error on every local build the last time a card fetched on mount.
    if (!workerOriginAllowed()) return undefined
    let alive = true
    fetcher().then((r) => { if (alive) setLive(r) })
    return () => { alive = false }
  }, [fetcher])

  if (!live || live.state === RECORD_STATE.UNKNOWN || !live.record) return null

  const { record, state, ageSec } = live
  const when = ageLabel(ageSec)
  const drift = driftFrom(record, registerValidSubmissions)

  return (
    <p className="mt-3 font-mono text-[11px] text-content-muted">
      {drift && drift.drifted ? (
        <span className="text-caution">
          CodeHawks now reports {drift.live} valid submissions — the figures above are behind.
        </span>
      ) : (
        <span className="text-verified">Confirmed against CodeHawks{when ? ` ${when}` : ''}</span>
      )}
      <span className="ml-2">
        {record.validSubmissions} valid submissions · {record.xp} EXP
      </span>
      {state === RECORD_STATE.STALE && (
        <span className="ml-2 text-caution" title="CodeHawks was unreachable; this is the last known record">
          (cached — source unreachable)
        </span>
      )}
    </p>
  )
}
