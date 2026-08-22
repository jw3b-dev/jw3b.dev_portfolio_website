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
  findVersion,
  setDraft as setDraftPure,
  applyFix as applyFixPure,
  restoreVersion as restorePure,
  startRun,
  updateRun,
  heuristicFingerprint,
  RUN_STATUS,
} from '../lib/auditWorkspace.js'
import { auditSolidity, SAMPLE_CONTRACT } from '../lib/auditHeuristics.js'
import { fixesFor, applyFixAndVerify, gateFixes } from '../lib/auditFixes.js'
import { validateAuditSource, SOURCE_CAP } from '../lib/auditClient.js'
import {
  evaluateAutoRun,
  explainAutoRun,
  AUTO_RUN_IDLE_MS,
  AUTO_RUN_REASON,
  AUDIT_BUDGET,
  CHANGE_ORIGIN,
} from '../lib/autoRunPolicy.js'
import { streamAuditNarrative } from '../lib/auditStream.js'

const idle = (reason) => ({ reason, explain: explainAutoRun(reason) })

/** One shared empty array, so "no findings" keeps a stable identity across renders. */
const EMPTY_FINDINGS = Object.freeze([])

export function useAuditWorkspace({ initialSource, idleMs = AUTO_RUN_IDLE_MS, fetchImpl } = {}) {
  // v1 is named for what it actually is: the visitor's own starting point, or our demo contract.
  const [ws, setWs] = useState(() =>
    createWorkspace(initialSource || SAMPLE_CONTRACT, { label: initialSource ? undefined : 'Sample' }),
  )
  const [autoRun, setAutoRun] = useState(false) // OFF by default — ADR-P5-02 §2
  const [paused, setPaused] = useState(false)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const [runsUsed, setRunsUsed] = useState(0)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const [autoStatus, setAutoStatus] = useState(() => idle(AUTO_RUN_REASON.DISABLED))
  const [lastFix, setLastFix] = useState(null) // { label, cleared, findingId, delta } — the re-screen result
  // WHY the draft last moved. The text alone can't distinguish someone typing from someone
  // clicking back through their own checkpoints, and only one of those is worth a model call.
  const [changeOrigin, setChangeOrigin] = useState(CHANGE_ORIGIN.INIT)

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
  const rawFixes = useMemo(() => (screen ? fixesFor(findings, ws.draft) : []), [screen, findings, ws.draft])

  const lastRun = ws.runs.length ? ws.runs[ws.runs.length - 1] : null
  const selectedRun = ws.runs.find((r) => r.id === selectedRunId) || lastRun || null
  const runsLeft = Math.max(0, AUDIT_BUDGET - runsUsed)

  // Kept as primitives so the idle effect below re-arms on a new ANALYSIS, not on every streamed
  // frame (each chunk replaces the run object, which would otherwise churn the timer).
  // Every source that already has a run — so an exact repeat is answered from its tab, never re-bought.
  const analysedSources = useMemo(() => ws.runs.map((r) => r.source), [ws.runs])
  // Optional/informational fixes unlock only once the serious findings are gone AND this exact
  // source has been analysed — the audit order, enforced rather than suggested.
  const fixes = useMemo(
    () => gateFixes(findings, rawFixes, { analysed: analysedSources.includes(ws.draft) }),
    [findings, rawFixes, analysedSources, ws.draft],
  )
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
    setChangeOrigin(CHANGE_ORIGIN.EDIT)
    setWs((prev) => setDraftPure(prev, text))
  }, [])

  /**
   * Apply a rule-derived fix, then RE-SCREEN and record whether the finding actually cleared.
   * The verification is the point: the console reports what the detector says about the result,
   * it never claims the fix worked (ADR-P5-02 §3).
   */
  const applyFix = useCallback((fix) => {
    const verdict = applyFixAndVerify(fix, wsRef.current.draft)
    setChangeOrigin(CHANGE_ORIGIN.FIX)
    setWs((prev) => applyFixPure(prev, fix))
    setLastFix({
      label: fix?.label || 'Fix',
      findingId: fix?.findingId,
      cleared: verdict.cleared,
      changed: verdict.changed,
      // The whole re-screen delta, not just the target finding. `introduced` is the one that
      // changes what the verdict is ALLOWED to say — see AuditConsole.
      delta: verdict.delta,
    })
  }, [])

  const restoreVersion = useCallback((versionId) => {
    setError(null)
    setLastFix(null)
    // Navigation, not authorship — this is what stops "compare my last three attempts" from
    // quietly costing three analyses.
    setChangeOrigin(CHANGE_ORIGIN.RESTORE)

    // Bring this version's OWN analysis forward if it has one. Without this, moving between
    // versions left the newest run on screen under every one of them — so the analysis of your
    // edited contract sat under "Original" as though it described it. Computed before the update
    // (never inside the updater, which must stay side-effect free).
    const target = findVersion(wsRef.current, versionId)
    const match = target && [...wsRef.current.runs].reverse().find((r) => r.source === target.source)
    if (match) setSelectedRunId(match.id)

    setWs((prev) => restorePure(prev, versionId))
  }, [])

  /**
   * Arming the toggle is not itself an edit. Without this reset, switching it on would immediately
   * analyse whatever you had already typed before deciding to arm it — a surprise call, and the
   * opposite of what a control named "re-run on edit" promises.
   */
  const enableAutoRun = useCallback((next) => {
    if (next) setChangeOrigin(CHANGE_ORIGIN.INIT)
    setAutoRun(next)
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
      changeOrigin,
      analysedSources,
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
  }, [autoRun, paused, running, ws.draft, changeOrigin, analysedSources, fingerprint, lastRunSource, lastRunFingerprint, runsUsed, idleMs, run])

  useEffect(() => () => clearTimeout(timer.current), [])

  return {
    // state
    draft: ws.draft,
    versions: ws.versions,
    currentVersionId: ws.currentVersionId,
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
    setAutoRun: enableAutoRun,
    setPaused,
  }
}
