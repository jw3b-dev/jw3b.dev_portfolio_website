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

/**
 * WHY the draft last changed. The policy cannot tell authorship from navigation by looking at the
 * text alone, and the difference decides whether an expensive call is warranted: typing is a
 * proposal to analyse, clicking back through your own history is reading.
 */
export const CHANGE_ORIGIN = Object.freeze({
  INIT: 'init', // first paint — nothing has been authored yet
  EDIT: 'edit', // the visitor typed
  FIX: 'fix', // a rule-derived fix rewrote the source
  RESTORE: 'restore', // an earlier version was put back — navigation
})

/** Origins that represent NEW code worth analysing. The others are looking, not writing. */
const AUTHORING = new Set([CHANGE_ORIGIN.EDIT, CHANGE_ORIGIN.FIX])

export const AUTO_RUN_REASON = Object.freeze({
  READY: 'ready',
  DISABLED: 'disabled',
  PAUSED: 'paused',
  RUNNING: 'running',
  INVALID: 'invalid',
  AWAITING_FIRST_RUN: 'awaiting-first-run',
  AWAITING_EDIT: 'awaiting-edit',
  RESTORED: 'restored',
  UNCHANGED: 'unchanged',
  ALREADY_ANALYSED: 'already-analysed',
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
  [AUTO_RUN_REASON.AWAITING_FIRST_RUN]:
    'Nothing to re-run yet — press Run AI analysis once, and edits after that will re-run it.',
  [AUTO_RUN_REASON.AWAITING_EDIT]: 'Armed — your next edit gets analysed once you stop typing.',
  [AUTO_RUN_REASON.RESTORED]:
    'Viewing an earlier version — looking back through your own history doesn’t spend an analysis. Press Run AI analysis for a fresh one.',
  [AUTO_RUN_REASON.UNCHANGED]: 'No edits since the last analysis.',
  [AUTO_RUN_REASON.ALREADY_ANALYSED]: 'This exact source already has an analysis — open its run tab rather than paying for it twice.',
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
  changeOrigin = CHANGE_ORIGIN.INIT,
  analysedSources = [],
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

  // ...and it is called "RE-run", which means there has to be something to re-run. The metered
  // tier never spends its FIRST call on its own: one deliberate press establishes the baseline,
  // and edits after that re-run against it.
  if (!analysedSources.length) return decide(AUTO_RUN_REASON.AWAITING_FIRST_RUN)

  // The control is called "re-run on EDIT", and it means it. Putting an earlier version back is
  // navigation — you are reading your own history, not proposing new code — and it moves the
  // draft exactly as typing does, so nothing downstream could tell the difference. Without this
  // gate, clicking through your own checkpoints to compare them silently spent the budget.
  if (!AUTHORING.has(changeOrigin)) {
    return decide(changeOrigin === CHANGE_ORIGIN.RESTORE ? AUTO_RUN_REASON.RESTORED : AUTO_RUN_REASON.AWAITING_EDIT)
  }

  if (lastAnalysedSource !== null && draft === lastAnalysedSource) return decide(AUTO_RUN_REASON.UNCHANGED)

  // Any source that has ALREADY been analysed is already on screen in its own run tab. Paying a
  // second time to be told the same thing is the clearest waste there is — and it happens easily,
  // by editing and then undoing back.
  if (analysedSources.includes(draft)) return decide(AUTO_RUN_REASON.ALREADY_ANALYSED)

  // The gate that makes this affordable: the free screen decides for the expensive one.
  if (lastFingerprint !== null && fingerprint === lastFingerprint) return decide(AUTO_RUN_REASON.NO_VISIBLE_CHANGE)

  if (runsUsed >= budget - reserve) return decide(AUTO_RUN_REASON.BUDGET)
  if (idleMs < idleThresholdMs) return decide(AUTO_RUN_REASON.IDLE_WAIT)

  return decide(AUTO_RUN_REASON.READY)
}
