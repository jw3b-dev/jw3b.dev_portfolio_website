/*
 * jw3b.dev v2 — auto-rerun policy (ADR-P5-02 · W-3)  ·  domain-engine
 *
 * PURE. Decides whether an AI audit should fire itself after an edit — and, when it shouldn't,
 * says WHY in words the UI can show. A control that silently declines to run reads as "the
 * analysis agrees with your edit", which is a lie by omission (ADR-P5-02 §5.6).
 *
 * Why this is a policy and not a debounce. The audit runs Opus (`AUDIT_MODEL`, max_tokens 1500)
 * behind a budget of 10 requests per IP per window. A plain "re-run 3s after they stop typing"
 * fires an expensive call every time a person pauses to think, so one minute of editing can
 * exhaust the whole budget and drop the rest of the visit onto the recorded fallback — the
 * feature would degrade the thing it was added to improve. So the FREE deterministic layer
 * decides when the EXPENSIVE one is worth spending: no visible change in the heuristic screen,
 * no call.
 */

/** How long the editor must be still before an automatic run is considered. */
export const AUTO_RUN_IDLE_MS = 4000

/**
 * Mirror of the Worker's `BUDGETS.audit` (workers/portfolio-agent/src/rateLimit.js). A parity
 * test fails CI if they drift — the client's honesty about "runs left" is only honest while this
 * matches the number the server actually enforces.
 */
export const AUDIT_BUDGET = 10

/**
 * Runs the automatic policy will never take. The manual button can spend them: a visitor who
 * deliberately presses "run" should not find the budget already burned by a timer.
 */
export const AUTO_RUN_RESERVE = 1

export const AUTO_RUN_REASON = Object.freeze({
  READY: 'ready',
  DISABLED: 'disabled',
  PAUSED: 'paused',
  RUNNING: 'running',
  INVALID: 'invalid',
  UNCHANGED: 'unchanged',
  NO_VISIBLE_CHANGE: 'no-visible-change',
  BUDGET: 'budget',
  IDLE_WAIT: 'idle-wait',
})

const EXPLAIN = {
  [AUTO_RUN_REASON.READY]: 'Re-running the analysis on your edit.',
  [AUTO_RUN_REASON.DISABLED]: 'Auto re-run is off — press Run AI analysis when you want one.',
  [AUTO_RUN_REASON.PAUSED]: 'Paused — nothing will run until you say so.',
  [AUTO_RUN_REASON.RUNNING]: 'An analysis is already streaming.',
  [AUTO_RUN_REASON.INVALID]: 'Nothing to analyse yet.',
  [AUTO_RUN_REASON.UNCHANGED]: 'No edits since the last analysis.',
  [AUTO_RUN_REASON.NO_VISIBLE_CHANGE]:
    'Edited, but the heuristic screen is unchanged — not spending a model call on it. Run it manually if you want one anyway.',
  [AUTO_RUN_REASON.BUDGET]: 'Auto re-run has used its share of this session — the manual button still works.',
  [AUTO_RUN_REASON.IDLE_WAIT]: 'Waiting for you to stop typing…',
}

/** The sentence the UI shows for a decision. Exported so the copy has one home. */
export function explainAutoRun(reason) {
  return EXPLAIN[reason] || EXPLAIN[AUTO_RUN_REASON.DISABLED]
}

/**
 * Should an automatic run fire right now?
 *
 * Gate order is deliberate — it is the order the reasons are worth telling someone. "Paused"
 * beats "no change", because when you have paused it deliberately you don't also need to be told
 * your edit was cosmetic.
 *
 * @returns {{run: boolean, reason: string, explain: string}}
 */
export function evaluateAutoRun({
  enabled = false,
  paused = false,
  running = false,
  valid = true,
  draft = '',
  lastAnalysedSource = null,
  fingerprint = '',
  lastFingerprint = null,
  idleMs = 0,
  idleThresholdMs = AUTO_RUN_IDLE_MS,
  runsUsed = 0,
  budget = AUDIT_BUDGET,
  reserve = AUTO_RUN_RESERVE,
} = {}) {
  const decide = (reason) => ({ run: reason === AUTO_RUN_REASON.READY, reason, explain: explainAutoRun(reason) })

  if (!enabled) return decide(AUTO_RUN_REASON.DISABLED)
  if (paused) return decide(AUTO_RUN_REASON.PAUSED)
  if (running) return decide(AUTO_RUN_REASON.RUNNING)
  if (!valid) return decide(AUTO_RUN_REASON.INVALID)

  // Never analysed yet? Then any valid draft is a change worth analysing.
  if (lastAnalysedSource !== null && draft === lastAnalysedSource) return decide(AUTO_RUN_REASON.UNCHANGED)

  // The gate that makes this affordable: the free screen decides for the expensive one.
  if (lastFingerprint !== null && fingerprint === lastFingerprint) return decide(AUTO_RUN_REASON.NO_VISIBLE_CHANGE)

  if (runsUsed >= budget - reserve) return decide(AUTO_RUN_REASON.BUDGET)
  if (idleMs < idleThresholdMs) return decide(AUTO_RUN_REASON.IDLE_WAIT)

  return decide(AUTO_RUN_REASON.READY)
}
