/*
 * jw3b.dev v2 — line diff for the version strip (ADR-P5-02 follow-up)  ·  domain-engine
 *
 * PURE. Given two snapshots of a contract, say which lines were added, removed, or left alone —
 * so the console can SHOW what a version changed instead of asking someone to spot it.
 *
 * Why a separate view rather than colouring the editor: a `<textarea>` cannot style its own
 * contents. The alternatives are a transparent textarea over a highlighted mirror (fragile — you
 * inherit scroll-sync and wrapping bugs forever) or swapping in a full editor component (a heavy
 * dependency for one colour). A read-only diff panel beside the editor costs neither.
 *
 * Standard LCS, with one guard: the table is O(n×m), so a pathological paste is answered with a
 * summary instead of a diff. It runs when a VERSION changes, never per keystroke.
 */

/** Above this many lines on either side, report a summary rather than build the LCS table. */
export const DIFF_LINE_CAP = 2000

export const DIFF_TYPE = Object.freeze({ ADD: 'add', DEL: 'del', CTX: 'ctx' })

/** Longest-common-subsequence table over two line arrays. */
function lcsTable(a, b) {
  const table = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1))
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1])
    }
  }
  return table
}

/**
 * Diff two sources by line.
 * @returns {{ rows: Array<{type:string, text:string, before:number|null, after:number|null}>,
 *            added:number, removed:number, truncated:boolean }}
 */
export function diffLines(before, after) {
  const a = String(before ?? '').split('\n')
  const b = String(after ?? '').split('\n')

  if (a.length > DIFF_LINE_CAP || b.length > DIFF_LINE_CAP) {
    return { rows: [], added: 0, removed: 0, truncated: true }
  }

  const table = lcsTable(a, b)
  const rows = []
  let i = 0
  let j = 0
  let added = 0
  let removed = 0

  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      rows.push({ type: DIFF_TYPE.CTX, text: a[i], before: i + 1, after: j + 1 })
      i++
      j++
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      rows.push({ type: DIFF_TYPE.DEL, text: a[i], before: i + 1, after: null })
      removed++
      i++
    } else {
      rows.push({ type: DIFF_TYPE.ADD, text: b[j], before: null, after: j + 1 })
      added++
      j++
    }
  }
  while (i < a.length) {
    rows.push({ type: DIFF_TYPE.DEL, text: a[i], before: i + 1, after: null })
    removed++
    i++
  }
  while (j < b.length) {
    rows.push({ type: DIFF_TYPE.ADD, text: b[j], before: null, after: j + 1 })
    added++
    j++
  }

  return { rows, added, removed, truncated: false }
}

/**
 * Drop long runs of unchanged lines, keeping `context` of them either side of every change —
 * the point of the panel is the change, and 200 identical lines around it hide the thing you came
 * to look at. Elided runs become a single `{gap}` marker so nothing silently disappears.
 */
export function collapseUnchanged(rows, context = 2) {
  const keep = new Array(rows.length).fill(false)
  rows.forEach((r, i) => {
    if (r.type === DIFF_TYPE.CTX) return
    for (let k = Math.max(0, i - context); k <= Math.min(rows.length - 1, i + context); k++) keep[k] = true
  })

  const out = []
  let skipped = 0
  rows.forEach((r, i) => {
    if (keep[i]) {
      if (skipped) {
        out.push({ type: 'gap', gap: skipped })
        skipped = 0
      }
      out.push(r)
    } else {
      skipped++
    }
  })
  if (skipped) out.push({ type: 'gap', gap: skipped })
  return out
}
