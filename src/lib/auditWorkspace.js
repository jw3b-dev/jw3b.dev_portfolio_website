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
 *   versions[] checkpoints. v1 = "Original" and is permanent. Created ONLY when the source is
 *              AUTHORED into a new state: a fix is applied, or unsaved edits are pinned by a run
 *              or by navigating away. Moving BETWEEN existing checkpoints creates nothing —
 *              browsing your history must not rewrite it.
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
})

const version = (id, label, source, origin, meta = {}) => ({ id, label, source, origin, ...meta })

/** A fresh workspace around the pasted source. */
export function createWorkspace(source = '') {
  const src = String(source || '')
  return {
    draft: src,
    versions: [version('v1', ORIGINAL_LABEL, src, VERSION_ORIGIN.ORIGINAL)],
    runs: [],
    // Which checkpoint the editor is sitting on. Distinct from "the newest one", because you can
    // be looking at an older version without that being a new event in the history.
    currentVersionId: 'v1',
    nextVersion: 2,
    nextRun: 1,
  }
}

/** The checkpoint the editor is currently on (never undefined — v1 cannot be removed). */
export function currentVersion(ws) {
  return findVersion(ws, ws.currentVersionId) || ws.versions[0]
}

/** True when the draft has unsaved edits relative to the checkpoint it sits on. */
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

/** Append a checkpoint carrying `source`, move the draft onto it, and make it the current one. */
function checkpoint(ws, label, source, origin, meta) {
  const id = `v${ws.nextVersion}`
  return {
    ...ws,
    draft: source,
    versions: [...ws.versions, version(id, label, source, origin, meta)],
    currentVersionId: id,
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
  if (!isDirty(ws)) return ws
  // Number them. Two chips both reading "Edited" are two chips you cannot choose between.
  const n = ws.versions.filter((v) => v.origin === VERSION_ORIGIN.EDIT).length + 1
  return checkpoint(ws, `Edit ${n}`, ws.draft, VERSION_ORIGIN.EDIT)
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
  return checkpoint(pinned, `Fix · ${fix.findingId || fix.label}`, next, VERSION_ORIGIN.FIX, { fixId: fix.id, findingId: fix.findingId })
}

/**
 * Move the editor onto an existing checkpoint. This is NAVIGATION, and it deliberately creates
 * NOTHING.
 *
 * It used to append a `Restored · <label>` checkpoint every time, on the theory that going back
 * should itself be undoable. In use that was wrong in three ways at once, all reported together:
 * the list grew every time you merely LOOKED at something, the labels nested into
 * `Restored · Fix · …` and truncated to visually identical chips, and the entry that highlighted
 * afterwards was the new one rather than the one you clicked — so the buttons appeared to shuffle
 * and the version you wanted got lost among copies of itself. Browsing your history must not
 * rewrite it.
 *
 * The one thing it does create is a pin for UNSAVED edits, because navigating away from work you
 * have not checkpointed is the only way this could lose something.
 */
export function restoreVersion(ws, versionId) {
  const target = findVersion(ws, versionId)
  if (!target) return ws
  if (!isDirty(ws) && ws.currentVersionId === target.id) return ws // already exactly there
  const pinned = pinDraft(ws)
  return { ...pinned, draft: target.source, currentVersionId: target.id }
}

/**
 * Begin an AI run over the current draft.
 * Pins the draft first: unsaved edits become a numbered "Edit n" checkpoint so the run has a
 * named version to point at. An unchanged draft reuses its current checkpoint rather than
 * duplicating it.
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
