/*
 * /ctf — what a solve actually looks like (brief 06, next-need 1)  ·  app-ui-engineer
 *
 * The leaderboard is honestly empty and says which KIND of empty it is, which was the fix for
 * finding 19. What it still did not do is show a visitor what success looks like, so an empty
 * board reads as discouragement — "nobody has done this" — rather than as an invitation.
 *
 * The artifact to fix that already shipped in the bundle and was read by nobody:
 * `src/data/recorded-runs/ctf/vault-drain.json` carries a three-frame walkthrough of the drain.
 * `ctfFlow.recordedSolve()` returned only a label and a note, discarding the frames.
 *
 * HONESTY (BR-03/BR-09, and the reason this component is careful rather than clever): this is a
 * previously-captured testnet run. It is labelled as recorded on the surface, dated from the
 * artifact, and never framed as the visitor's own solve. A walkthrough that could be mistaken for
 * a live result would be worse than the empty board it replaces.
 */
import { useState } from 'react'
import artifact from '../../data/recorded-runs/ctf/vault-drain.json'

/*
 * Frame 0 is the artifact's FALLBACK preamble — "live on-chain verification is unavailable, so
 * this replays…". That is true when the artifact is serving as the degraded path, and false here:
 * on the brief we show it deliberately, to a visitor who has not attempted anything. Rendering it
 * would state a reason that does not apply, so the preamble is dropped and this component says
 * why it is showing a recording in its own words. The STEPS still come untouched from the file.
 */
const FRAMES = (artifact.frames || [])
  .slice(1)
  .map((f) => String(f.response || '').trim())
  .filter(Boolean)

export default function RecordedSolve() {
  const [open, setOpen] = useState(false)

  // No artifact, no section — never an empty shell claiming a walkthrough exists.
  if (FRAMES.length === 0) return null

  return (
    <section aria-labelledby="ctf-recorded" className="mt-5 border-t border-hairline pt-4">
      <div className="flex flex-wrap items-baseline gap-x-2">
        <h3 id="ctf-recorded" className="font-mono text-[10px] uppercase tracking-label text-content-muted">
          What a solve looks like
        </h3>
        {/* The label rides ON the heading line, not in a tooltip — it is the first thing read. */}
        <span className="font-mono text-[10px] uppercase tracking-label text-caution">
          Recorded · {artifact.capturedAt}
        </span>
      </div>

      <p className="mt-1 text-sm text-content-secondary">
        A previously-captured drain of this vault on Base Sepolia — a testnet demonstration, not a
        live result and not your solve.
      </p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="ctf-recorded-steps"
        className="mt-2 rounded-sm border border-hairline px-2 py-1 font-mono text-[10px] uppercase tracking-label text-content-secondary motion-safe:transition-colors hover:border-cyan/50 hover:text-cyan focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan"
      >
        {open ? 'Hide the walkthrough' : 'Show the walkthrough'}
      </button>

      {open && (
        <ol id="ctf-recorded-steps" className="mt-3 flex flex-col gap-2">
          {FRAMES.map((frame, i) => (
            <li key={i} className="flex gap-2 border-l border-hairline pl-3">
              <span className="font-mono text-[10px] text-cyan">{i + 1}</span>
              <span className="text-sm leading-relaxed text-content-secondary">{frame}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
