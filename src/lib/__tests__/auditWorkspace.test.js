import { describe, it, expect } from 'vitest'
import {
  createWorkspace,
  setDraft,
  applyFix,
  restoreVersion,
  startRun,
  updateRun,
  currentVersion,
  findVersion,
  findRun,
  isDirty,
  runIsStale,
  heuristicFingerprint,
  ORIGINAL_LABEL,
  RUN_STATUS,
  VERSION_ORIGIN,
} from '../auditWorkspace.js'

const upper = { id: 'f-upper', findingId: 'rule-a', label: 'Upper', apply: (s) => s.toUpperCase() }
const noop = { id: 'f-noop', findingId: 'rule-b', label: 'Noop', apply: (s) => s }

describe('auditWorkspace — checkpoints', () => {
  it('starts with a permanent Original and nothing else', () => {
    const ws = createWorkspace('contract A {}')
    expect(ws.versions).toHaveLength(1)
    expect(ws.versions[0]).toMatchObject({ id: 'v1', label: ORIGINAL_LABEL, origin: VERSION_ORIGIN.ORIGINAL })
    expect(ws.draft).toBe('contract A {}')
    expect(ws.runs).toEqual([])
    expect(isDirty(ws)).toBe(false)
  })

  it('coerces a missing source rather than carrying undefined into the editor', () => {
    expect(createWorkspace().draft).toBe('')
    expect(createWorkspace(null).versions[0].source).toBe('')
    expect(setDraft(createWorkspace('a'), undefined).draft).toBe('')
  })

  it('does NOT checkpoint on every keystroke — typing only moves the draft', () => {
    let ws = createWorkspace('a')
    ws = setDraft(ws, 'ab')
    ws = setDraft(ws, 'abc')
    expect(ws.versions).toHaveLength(1) // a thousand-entry history is not a history
    expect(ws.draft).toBe('abc')
    expect(isDirty(ws)).toBe(true)
  })

  it('checkpoints when a fix is applied, and moves the draft onto it', () => {
    const ws = applyFix(createWorkspace('abc'), upper)
    expect(ws.draft).toBe('ABC')
    expect(ws.versions).toHaveLength(2)
    expect(currentVersion(ws)).toMatchObject({
      id: 'v2',
      label: 'Fix · Upper',
      origin: VERSION_ORIGIN.FIX,
      fixId: 'f-upper',
      findingId: 'rule-a',
    })
    expect(isDirty(ws)).toBe(false)
  })

  it('pins unsaved edits BEFORE the fix, so undo reaches your code and not the page default', () => {
    // The regression an E2E caught: paste over the sample, apply a fix, and "Original" was the
    // demo contract — the pasted work had no checkpoint at all.
    let ws = createWorkspace('the page default')
    ws = setDraft(ws, 'my pasted contract')
    ws = applyFix(ws, upper)

    expect(ws.versions.map((v) => v.source)).toEqual(['the page default', 'my pasted contract', 'MY PASTED CONTRACT'])
    expect(ws.versions[1]).toMatchObject({ label: 'Edited', origin: VERSION_ORIGIN.EDIT })
    expect(restoreVersion(ws, 'v2').draft).toBe('my pasted contract')
  })

  it('pins unsaved edits before a restore, so going back cannot lose them', () => {
    let ws = createWorkspace('start')
    ws = setDraft(ws, 'unsaved work')
    ws = restoreVersion(ws, 'v1')

    expect(ws.draft).toBe('start')
    expect(findVersion(ws, 'v2')).toMatchObject({ source: 'unsaved work', origin: VERSION_ORIGIN.EDIT })
  })

  it('does not checkpoint a fix that changes nothing', () => {
    const ws = applyFix(createWorkspace('abc'), noop)
    expect(ws.versions).toHaveLength(1)
  })

  it('ignores a malformed fix', () => {
    const ws = createWorkspace('abc')
    expect(applyFix(ws, null)).toBe(ws)
    expect(applyFix(ws, { apply: 'not a function' })).toBe(ws)
    expect(applyFix(ws, { label: 'x', apply: () => 42 })).toBe(ws) // non-string result
  })
})

describe('auditWorkspace — restore', () => {
  it('is additive: going back is itself something you can go back from', () => {
    let ws = createWorkspace('original')
    ws = applyFix(ws, upper)
    ws = restoreVersion(ws, 'v1')

    expect(ws.draft).toBe('original')
    expect(ws.versions).toHaveLength(3) // v1 original, v2 fix, v3 restore — nothing truncated
    expect(currentVersion(ws)).toMatchObject({ origin: VERSION_ORIGIN.RESTORE, fromVersionId: 'v1', label: `Restored · ${ORIGINAL_LABEL}` })
    expect(findVersion(ws, 'v2').source).toBe('ORIGINAL') // the fix is still reachable
  })

  it('restores an edited draft back to Original — the owner-requested undo', () => {
    let ws = createWorkspace('paste')
    ws = setDraft(ws, 'paste + my edits')
    ws = restoreVersion(ws, 'v1')
    expect(ws.draft).toBe('paste')
  })

  it('is a no-op for an unknown version, or when already exactly there', () => {
    const ws = createWorkspace('x')
    expect(restoreVersion(ws, 'nope')).toBe(ws)
    expect(restoreVersion(ws, 'v1')).toBe(ws)
  })

  it('records exactly ONE checkpoint when the pin already lands on the restore target', () => {
    let ws = createWorkspace('x')
    ws = applyFix(ws, upper) // v2 = 'X'
    ws = setDraft(ws, 'x') // hand-typed back to v1's text, but the newest version is still 'X'
    ws = restoreVersion(ws, 'v1')

    // The pin captured 'x'; adding a "Restored" entry holding the same text would be noise.
    expect(ws.versions).toHaveLength(3)
    expect(currentVersion(ws)).toMatchObject({ source: 'x', origin: VERSION_ORIGIN.EDIT })
  })
})

describe('auditWorkspace — runs', () => {
  it('pins the exact source a run analysed, checkpointing the edit first', () => {
    let ws = createWorkspace('v1 source')
    ws = setDraft(ws, 'edited source')
    const [next, run] = startRun(ws)

    expect(next.versions).toHaveLength(2)
    expect(currentVersion(next)).toMatchObject({ label: 'Edited', origin: VERSION_ORIGIN.EDIT })
    expect(run).toMatchObject({ id: 'r1', seq: 1, versionId: 'v2', source: 'edited source', status: RUN_STATUS.STREAMING, degraded: false })
    expect(next.runs).toHaveLength(1)
  })

  it('reuses the existing checkpoint when the draft has not drifted', () => {
    const [ws, run] = startRun(createWorkspace('unchanged'))
    expect(ws.versions).toHaveLength(1)
    expect(run.versionId).toBe('v1')
    expect(run.versionLabel).toBe(ORIGINAL_LABEL)
  })

  it('accumulates runs — each is its own tab with its own source', () => {
    let ws = createWorkspace('one')
    ;[ws] = startRun(ws)
    ws = setDraft(ws, 'two')
    ;[ws] = startRun(ws)

    expect(ws.runs.map((r) => r.source)).toEqual(['one', 'two'])
    expect(ws.runs.map((r) => r.id)).toEqual(['r1', 'r2'])
    expect(findRun(ws, 'r2').seq).toBe(2)
    expect(findRun(ws, 'nope')).toBeNull()
  })

  it('patches a run without touching its siblings', () => {
    let ws = createWorkspace('a')
    ;[ws] = startRun(ws)
    ws = setDraft(ws, 'b')
    ;[ws] = startRun(ws)

    ws = updateRun(ws, 'r1', { narrative: 'first', status: RUN_STATUS.DONE, degraded: true })
    expect(findRun(ws, 'r1')).toMatchObject({ narrative: 'first', status: RUN_STATUS.DONE, degraded: true })
    expect(findRun(ws, 'r2')).toMatchObject({ narrative: '', status: RUN_STATUS.STREAMING })
    // A run's pinned source is never rewritten by a patch.
    expect(findRun(ws, 'r1').source).toBe('a')
  })

  it('ignores a patch for an unknown run', () => {
    const ws = createWorkspace('a')
    expect(updateRun(ws, 'r99', { narrative: 'x' })).toBe(ws)
  })

  it('knows when a run no longer describes what is in the editor', () => {
    let ws = createWorkspace('a')
    let run
    ;[ws, run] = startRun(ws)
    expect(runIsStale(run, ws.draft)).toBe(false)
    ws = setDraft(ws, 'a changed')
    expect(runIsStale(run, ws.draft)).toBe(true)
    expect(runIsStale(null, ws.draft)).toBe(false)
  })
})

describe('heuristicFingerprint', () => {
  const f = (id, line, severity) => ({ id, line, severity })

  it('is stable across detector output order', () => {
    const a = heuristicFingerprint([f('reentrancy', 12, 'high'), f('tx-origin', 3, 'medium')])
    const b = heuristicFingerprint([f('tx-origin', 3, 'medium'), f('reentrancy', 12, 'high')])
    expect(a).toBe(b)
  })

  it('changes when a finding appears, moves line, or changes severity', () => {
    const base = heuristicFingerprint([f('reentrancy', 12, 'high')])
    expect(heuristicFingerprint([f('reentrancy', 13, 'high')])).not.toBe(base)
    expect(heuristicFingerprint([f('reentrancy', 12, 'medium')])).not.toBe(base)
    expect(heuristicFingerprint([f('reentrancy', 12, 'high'), f('tx-origin', 1, 'medium')])).not.toBe(base)
  })

  it('is empty for an empty or invalid screen', () => {
    expect(heuristicFingerprint([])).toBe('')
    expect(heuristicFingerprint(null)).toBe('')
    expect(heuristicFingerprint(undefined)).toBe('')
  })
})
