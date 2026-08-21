/*
 * jw3b.dev v2 — what a version changed  ·  frontend-engineer
 *
 * Owner asked for the edits to be shown in a different colour so they're easier to see. The editor
 * is a `<textarea>` and cannot colour its own contents, so the diff gets its own read-only panel
 * rather than a fragile highlight overlay behind the editing surface.
 *
 * Compared against the version BEFORE this one in the list — "what did this version change?" —
 * which is the question someone clicking through their history is actually asking. Semantic tokens
 * only: `verified` for added, `failed` for removed, muted for context.
 */
import { useMemo } from 'react'
import { diffLines, collapseUnchanged, DIFF_TYPE } from '../../lib/lineDiff.js'

export default function VersionDiff({ versions, currentVersionId }) {
  const index = versions.findIndex((v) => v.id === currentVersionId)
  const current = index >= 0 ? versions[index] : null
  const previous = index > 0 ? versions[index - 1] : null

  const diff = useMemo(
    () => (previous && current ? diffLines(previous.source, current.source) : null),
    [previous, current],
  )
  const rows = useMemo(() => (diff && !diff.truncated ? collapseUnchanged(diff.rows) : []), [diff])

  if (!current) return null
  if (!previous) {
    return (
      <p className="mt-3 text-[11px] text-content-muted">
        <span className="text-content-secondary">{current.label}</span> is where this started — nothing to
        compare it against yet.
      </p>
    )
  }

  return (
    <div className="mt-3">
      <p className="font-mono text-[10px] uppercase tracking-label text-content-muted">
        What changed · {previous.label} → {current.label}
      </p>
      {diff.truncated ? (
        <p className="mt-1 text-[11px] text-content-muted">Too large to diff here — the versions are still exact snapshots.</p>
      ) : (
        <>
          <p className="mt-0.5 text-[11px] text-content-muted">
            <span className="text-verified">+{diff.added}</span> <span className="text-failed">−{diff.removed}</span>{' '}
            lines
          </p>
          <div className="mt-1.5 max-h-56 overflow-auto rounded-md border border-hairline bg-void p-2">
            {rows.length === 0 ? (
              <p className="font-mono text-[11px] text-content-muted">No line changes.</p>
            ) : (
              <ol className="font-mono text-[11px] leading-relaxed">
                {rows.map((r, i) =>
                  r.type === 'gap' ? (
                    <li key={`g${i}`} className="select-none py-0.5 text-content-muted">
                      ⋯ {r.gap} unchanged {r.gap === 1 ? 'line' : 'lines'}
                    </li>
                  ) : (
                    <li
                      key={`${r.type}-${i}`}
                      className={
                        'whitespace-pre-wrap ' +
                        (r.type === DIFF_TYPE.ADD
                          ? 'bg-verified/10 text-verified'
                          : r.type === DIFF_TYPE.DEL
                            ? 'bg-failed/10 text-failed'
                            : 'text-content-muted')
                      }
                    >
                      <span aria-hidden="true" className="select-none opacity-60">
                        {r.type === DIFF_TYPE.ADD ? '+ ' : r.type === DIFF_TYPE.DEL ? '− ' : '  '}
                      </span>
                      {/* Screen readers get the word, not just a glyph. */}
                      {r.type !== DIFF_TYPE.CTX && (
                        <span className="sr-only">{r.type === DIFF_TYPE.ADD ? 'added: ' : 'removed: '}</span>
                      )}
                      {r.text || ' '}
                    </li>
                  ),
                )}
              </ol>
            )}
          </div>
        </>
      )}
    </div>
  )
}
