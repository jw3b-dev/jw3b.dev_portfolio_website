/*
 * jw3b.dev v2 — the audit workspace hook (ADR-P5-02 · W-4)  ·  full-stack-integrator
 *
 * The seam between the pure core (auditWorkspace / autoRunPolicy / auditFixes / auditHeuristics)
 * and the two things it can't be pure about: the clock and the Worker. Everything decidable is
 * decided in the pure modules; this hook only supplies time, the network, and React state.
 *
 * Three endings, per run, always:
 *   loading   the run tab exists the moment it starts and streams into itself
 *   success   narrative labelled `live`
 *   failure   narrative labelled `recorded`/degraded — the deterministic screen on the left is
 *             unaffected, because it never needed the network in the first place
 *
 * The one number worth watching: `runsUsed` mirrors the Worker's per-IP audit budget
 * (autoRunPolicy.AUDIT_BUDGET ↔ rateLimit.BUDGETS.audit, guarded by a parity test). The automatic
 * policy stops one short of it so a visitor who deliberately presses Run always has a run left.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createWorkspace,
  setDraft as setDraftPure,
  applyFix as applyFixPure,
  restoreVersion as restorePure,
  startRun,
  updateRun,
  heuristicFingerprint,
  RUN_STATUS,
} from '../lib/auditWorkspace.js'
import { auditSolidity, SAMPLE_CONTRACT } from '../lib/auditHeuristics.js'
import { fixesFor, applyFixAndVerify } from '../lib/auditFixes.js'
import { validateAuditSource, SOURCE_CAP } from '../lib/auditClient.js'
import {
  evaluateAutoRun,
  explainAutoRun,
  AUTO_RUN_IDLE_MS,
  AUTO_RUN_REASON,
  AUDIT_BUDGET,
} from '../lib/autoRunPolicy.js'
import { streamAuditNarrative } from '../lib/auditStream.js'

const idle = (reason) => ({ reason, explain: explainAutoRun(reason) })

/** One shared empty array, so "no findings" keeps a stable identity across renders. */
const EMPTY_FINDINGS = Object.freeze([])

export function useAuditWorkspace({ initialSource, idleMs = AUTO_RUN_IDLE_MS, fetchImpl } = {}) {
  const [ws, setWs] = useState(() => createWorkspace(initialSource || SAMPLE_CONTRACT))
  const [autoRun, setAutoRun] = useState(false) // OFF by default — ADR-P5-02 §2
  const [paused, setPaused] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [runsUsed, setRunsUsed] = useState(0)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [autoStatus, setAutoStatus] = useState(() => idle(AUTO_RUN_REASON.DISABLED))
  const [lastFix, setLastFix] = useState(null) // { label, cleared, findingId } — the re-screen result

  const timer = useRef(null)
  // The stream callbacks close over state that has moved on by the time a frame arrives, so the
  // few values the loop must read live are kept in refs.
  const runningRef = useRef(false)
  const wsRef = useRef(ws)
  wsRef.current = ws

  // ---- derived: never stored (the bug this console shipped with) -------------------------------
  const overCap = ws.draft.length > SOURCE_CAP
  const screen = useMemo(() => (overCap ? null : auditSolidity(ws.draft)), [ws.draft, overCap])
  // Memoised, not `screen?.findings ?? []`: the bare literal is a fresh array on every render,
  // which would silently defeat the two memos below and re-derive the fixes each pass.
  const findings = useMemo(() => screen?.findings ?? EMPTY_FINDINGS, [screen])
  const fingerprint = useMemo(() => heuristicFingerprint(findings), [findings])
  const fixes = useMemo(() => (screen ? fixesFor(findings, ws.draft) : []), [screen, findings, ws.draft])

  const lastRun = ws.runs.length ? ws.runs[ws.runs.length - 1] : null
  const selectedRun = ws.runs.find((r) => r.id === selectedRunId) || lastRun || null
  const runsLeft = Math.max(0, AUDIT_BUDGET - runsUsed)

  // Kept as primitives so the idle effect below re-arms on a new ANALYSIS, not on every streamed
  // frame (each chunk replaces the run object, which would otherwise churn the timer).
  const lastRunSource = lastRun ? lastRun.source : null
  const lastRunFingerprint = useMemo(
    () => (lastRunSource === null ? null : heuristicFingerprint(auditSolidity(lastRunSource).findings)),
    [lastRunSource],
  )

  // ---- the run ---------------------------------------------------------------------------------
  const run = useCallback(async () => {
    if (runningRef.current) return
    const v = validateAuditSource(wsRef.current.draft)
    if (!v.ok) {
      setError(v.error)
      return
    }
    setError(null)
    setLastFix(null)

    const [next, started] = startRun(wsRef.current)
    wsRef.current = next
    setWs(next)
    setSelectedRunId(started.id)
    setRunsUsed((n) => n + 1)
    runningRef.current = true
    setRunning(true)

    const { text, degraded } = await streamAuditNarrative(started.source, {
      fetchImpl,
      onChunk: (t) => setWs((prev) => updateRun(prev, started.id, { narrative: t })),
    })

    setWs((prev) => updateRun(prev, started.id, { narrative: text, degraded, status: RUN_STATUS.DONE }))
    runningRef.current = false
    setRunning(false)
  }, [fetchImpl])

  // ---- editing -------------------------------------------------------------------------------
  const setDraft = useCallback((text) => {
    setError(null)
    setLastFix(null)
    setWs((prev) => setDraftPure(prev, text))
  }, [])

  /**
   * Apply a rule-derived fix, then RE-SCREEN and record whether the finding actually cleared.
   * The verification is the point: the console reports what the detector says about the result,
   * it never claims the fix worked (ADR-P5-02 §3).
   */
  const applyFix = useCallback((fix) => {
    const verdict = applyFixAndVerify(fix, wsRef.current.draft)
    setWs((prev) => applyFixPure(prev, fix))
    setLastFix({ label: fix?.label || 'Fix', findingId: fix?.findingId, cleared: verdict.cleared, changed: verdict.changed })
  }, [])

  const restoreVersion = useCallback((versionId) => {
    setError(null)
    setLastFix(null)
    setWs((prev) => restorePure(prev, versionId))
  }, [])

  // ---- the idle timer: the only place a clock enters the loop ---------------------------------
  useEffect(() => {
    clearTimeout(timer.current)
    if (!autoRun) {
      setAutoStatus(idle(AUTO_RUN_REASON.DISABLED))
      return undefined
    }
    if (paused) {
      setAutoStatus(idle(AUTO_RUN_REASON.PAUSED))
      return undefined
    }

    // Ask the policy what it WOULD do once the editor is still. If it has already declined for a
    // reason the clock can't change (no edit, cosmetic edit, budget), say so now rather than
    // showing a countdown that was never going to fire.
    const settled = evaluateAutoRun({
      enabled: true,
      paused: false,
      running,
      valid: validateAuditSource(ws.draft).ok,
      draft: ws.draft,
      lastAnalysedSource: lastRunSource,
      fingerprint,
      lastFingerprint: lastRunFingerprint,
      idleMs: Infinity,
      runsUsed,
    })
    if (!settled.run) {
      setAutoStatus({ reason: settled.reason, explain: settled.explain })
      return undefined
    }

    setAutoStatus(idle(AUTO_RUN_REASON.IDLE_WAIT))
    timer.current = setTimeout(() => {
      setAutoStatus(idle(AUTO_RUN_REASON.READY))
      run()
    }, idleMs)
    return () => clearTimeout(timer.current)
    // `run` is stable per fetchImpl; the draft/fingerprint/run-count are what re-arm the timer.
  }, [autoRun, paused, running, ws.draft, fingerprint, lastRunSource, lastRunFingerprint, runsUsed, idleMs, run])

  useEffect(() => () => clearTimeout(timer.current), [])

  return {
    // state
    draft: ws.draft,
    versions: ws.versions,
    runs: ws.runs,
    selectedRun,
    selectedRunId: selectedRun?.id ?? null,
    screen,
    findings,
    fixes,
    overCap,
    running,
    error,
    lastFix,
    autoRun,
    paused,
    autoStatus,
    runsUsed,
    runsLeft,
    // actions
    setDraft,
    applyFix,
    restoreVersion,
    selectRun: setSelectedRunId,
    run,
    setAutoRun,
    setPaused,
  }
}
