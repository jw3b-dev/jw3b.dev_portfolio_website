/*
 * jw3b.dev v2 — the iterative audit workspace (ADR-P5-02 · W-1)  ·  domain-engine
 *
 * PURE. The state behind "edit → screen → fix → re-screen → run → compare → go back": a draft,
 * an append-only list of checkpoints, and an append-only list of runs. No DOM, no timers, no
 * network — so the entire loop is testable as a sequence of values.
 *
 * Three things the console used to conflate into one `source` string, separated here because
 * they have genuinely different lifetimes (ADR-P5-02 §4):
 *
 *   draft      the live editor text. Changes per keystroke, and is NEVER versioned per keystroke.
 *   versions[] checkpoints. v1 = "Original" and is permanent. Created ONLY when something
 *              meaningful happens: a fix is applied, a version is restored, or a run starts.
 *   runs[]     one per AI analysis, each pinning the exact source it analysed.
 *
 * Why keystrokes don't create versions: a thousand-entry list is not a history anyone can use.
 * A checkpoint marks a place a reader would actually want to return to.
 *
 * Why a run pins its SOURCE and not its findings: findings are a pure function of the source
 * (auditSolidity), so storing them would be storing derived state — the exact bug that made the
 * console ignore edits in the first place. A run tab re-derives its screen from `run.source` and
 * gets a deterministic, identical answer every time. That also keeps this module independent of
 * the detector.
 */

/** The permanent first checkpoint. Never superseded, never removed — "back to what I pasted". */
export const ORIGINAL_LABEL = 'Original'

export const RUN_STATUS = Object.freeze({
  STREAMING: 'streaming',
  DONE: 'done',
  ERROR: 'error',
})

/** Version origins, for labelling and for tests that assert *why* a checkpoint exists. */
export const VERSION_ORIGIN = Object.freeze({
  ORIGINAL: 'original',
  EDIT: 'edit',
  FIX: 'fix',
  RESTORE: 'restore',
})

const version = (id, label, source, origin, meta = {}) => ({ id, label, source, origin, ...meta })

/** A fresh workspace around the pasted source. */
export function createWorkspace(source = '') {
  const src = String(source || '')
  return {
    draft: src,
    versions: [version('v1', ORIGINAL_LABEL, src, VERSION_ORIGIN.ORIGINAL)],
    runs: [],
    nextVersion: 2,
    nextRun: 1,
  }
}

/** The most recent checkpoint (never undefined — v1 cannot be removed). */
export function currentVersion(ws) {
  return ws.versions[ws.versions.length - 1]
}

/** True when the draft has moved away from the newest checkpoint (there is something to pin). */
export function isDirty(ws) {
  return ws.draft !== currentVersion(ws).source
}

export function findVersion(ws, id) {
  return ws.versions.find((v) => v.id === id) || null
}

export function findRun(ws, id) {
  return ws.runs.find((r) => r.id === id) || null
}

/** Editing the draft. Deliberately does NOT checkpoint — see the file header. */
export function setDraft(ws, text) {
  return { ...ws, draft: String(text ?? '') }
}

/** Append a checkpoint carrying `source`, and move the draft onto it. */
function checkpoint(ws, label, source, origin, meta) {
  const id = `v${ws.nextVersion}`
  return {
    ...ws,
    draft: source,
    versions: [...ws.versions, version(id, label, source, origin, meta)],
    nextVersion: ws.nextVersion + 1,
  }
}

/**
 * Pin unsaved edits before anything moves the draft out from under them.
 *
 * THE RULE: any action that replaces the draft first records where it was. Without this, pasting
 * your own contract over the sample and then applying a fix loses the paste — the only checkpoint
 * would be the demo contract you never wanted back. Undo has to reach the thing you were working
 * on, not just the thing the page shipped with.
 */
function pinDraft(ws) {
  return isDirty(ws) ? checkpoint(ws, 'Edited', ws.draft, VERSION_ORIGIN.EDIT) : ws
}

/**
 * Apply a fix to the draft: pin the pre-fix text, then a new checkpoint carrying the result.
 * @param {{id:string, findingId:string, label:string, apply:(src:string)=>string}} fix
 * @returns the workspace unchanged if the fix is a no-op on this draft (nothing to record).
 */
export function applyFix(ws, fix) {
  if (!fix || typeof fix.apply !== 'function') return ws
  const next = fix.apply(ws.draft)
  // A fix that changes nothing must not create a checkpoint — an entry you can return to that is
  // identical to the one before it is noise in the history.
  if (typeof next !== 'string' || next === ws.draft) return ws
  const pinned = pinDraft(ws)
  return checkpoint(pinned, `Fix · ${fix.label}`, next, VERSION_ORIGIN.FIX, { fixId: fix.id, findingId: fix.findingId })
}

/**
 * Restore a previous version. ADDITIVE: it appends a new checkpoint carrying the old source
 * rather than truncating history, so going back is itself something you can go back from.
 */
export function restoreVersion(ws, versionId) {
  const target = findVersion(ws, versionId)
  if (!target) return ws
  if (ws.draft === target.source && !isDirty(ws)) return ws // already exactly there
  // Same rule as applyFix: unsaved edits are pinned before the draft is replaced, so "go back"
  // can never be the thing that loses your work.
  const pinned = pinDraft(ws)
  // If pinning already landed on the target's text, stop — two consecutive checkpoints holding
  // identical source is exactly the history noise this module exists to avoid.
  if (pinned.draft === target.source) return pinned
  return checkpoint(pinned, `Restored · ${target.label}`, target.source, VERSION_ORIGIN.RESTORE, { fromVersionId: target.id })
}

/**
 * Begin an AI run over the current draft.
 * Pins the draft first: if the draft has drifted from the newest checkpoint, that edit becomes a
 * checkpoint ("Edited") so the run has a named version to point at. If it hasn't drifted, the
 * existing checkpoint is reused rather than duplicated.
 * @returns {[workspace, run]}
 */
export function startRun(ws) {
  const pinned = pinDraft(ws)
  const v = currentVersion(pinned)
  const run = {
    id: `r${pinned.nextRun}`,
    seq: pinned.nextRun,
    versionId: v.id,
    versionLabel: v.label,
    source: v.source,
    narrative: '',
    degraded: false,
    status: RUN_STATUS.STREAMING,
  }
  return [{ ...pinned, runs: [...pinned.runs, run], nextRun: pinned.nextRun + 1 }, run]
}

/** Patch a run in place (narrative chunks, degraded flag, terminal status). */
export function updateRun(ws, runId, patch) {
  if (!findRun(ws, runId)) return ws
  return { ...ws, runs: ws.runs.map((r) => (r.id === runId ? { ...r, ...patch } : r)) }
}

/**
 * True when this run's source is no longer what's in the editor.
 *
 * The one definition of staleness (honesty rule §5.2). It takes the draft directly rather than a
 * whole workspace so the run-history component can call it too — it was reimplementing the
 * comparison inline, which is a rule living in two places and free to drift (audit A-1).
 */
export function runIsStale(run, draft) {
  return Boolean(run) && run.source !== draft
}

/**
 * A stable signature of a heuristic screen: what the free deterministic layer can SEE.
 * ADR-P5-02 §2 spends an expensive model call only when this changes, so renaming a variable
 * doesn't buy an Opus call but introducing a reentrancy does.
 *
 * Sorted, so a detector reordering its output can't fake a difference.
 */
export function heuristicFingerprint(findings) {
  if (!Array.isArray(findings)) return ''
  return findings
    .map((f) => `${f.id}:${f.line}:${f.severity}`)
    .sort()
    .join('|')
}
