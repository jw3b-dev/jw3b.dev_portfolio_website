/*
 * jw3b.dev v2 — the audit console's vocabulary, in ONE place.
 *
 * WHY THIS FILE EXISTS. The console was redesigned to a numbered four-step workflow (design brief
 * `design/briefs/audit-console.md`), and the redesign task was scoped to the console's own two
 * components. Everything AROUND it kept the old vocabulary — so /audit introduced itself with
 * "The heuristics run instantly … even if the live model is offline" directly above a section
 * headed "Instant screen", and never described the numbered workflow at all. The owner's words:
 * "the old heading still talks about the heuristics but the section is now called instant screen
 * with nothing talking about it being the same section … the page was not updated along with the
 * updated auditor."
 *
 * Nothing structural tied the wrapper's copy to the console's copy, so nothing failed when they
 * diverged. Now the names live here, the console renders FROM here, and the page explains the
 * workflow FROM here — the three can no longer disagree, and a test asserts it.
 *
 * THE NAMING RULES (binding, from §2 of the brief):
 *   · "live" describes MODEL PROVENANCE only ("live model" vs "recorded fallback"). The free tier
 *     is INSTANT, never live — that collision is what made the page unreadable.
 *   · The run button and the history heading use the identical noun phrase: "AI analysis".
 *   · Every section states what it costs. A section that doesn't say what it costs does not ship.
 */

/**
 * The four steps, in the order a first-time visitor should read them.
 *
 * `cost` answers the first question a careful visitor asks — *which of these costs me something?*
 * `blurb` is the one-line "what happens here", used by the page's How-it-works strip; the console
 * itself shows richer inline guidance in place.
 */
export const CONSOLE_SECTIONS = Object.freeze([
  Object.freeze({
    n: '1',
    id: 'ac-src-title',
    title: 'Your contract',
    cost: 'Paste or edit Solidity. Nothing leaves your browser until you ask for an AI analysis.',
    blurb: 'Paste Solidity. Every edit is snapshotted, so you can compare versions or go back.',
  }),
  Object.freeze({
    n: '2',
    id: 'ac-screen-title',
    title: 'Instant screen',
    cost: 'Deterministic pattern matching, in your browser as you type — no network, no cost.',
    blurb:
      'Known-bad patterns, matched as you type. Free, offline, and it can apply its own fixes to your source.',
  }),
  Object.freeze({
    n: '3',
    id: 'ac-ai-title',
    title: 'AI analysis',
    cost: 'One model call per run, metered at 10 per session — so it runs when you ask, not as you type.',
    blurb: 'A model reads the whole contract and explains the risks. On demand, or automatically after an edit.',
  }),
  Object.freeze({
    n: '4',
    id: 'run-history-title',
    title: 'AI analyses',
    cost: 'Every analysis you’ve run, each pinned to the version it read. Opening one costs nothing.',
    blurb: 'One tab per run, each pinned to the exact source it read — so two runs never blur together.',
  }),
])

/** Look one up by number, so a component never re-states a name it should be importing. */
export function section(n) {
  return CONSOLE_SECTIONS.find((s) => s.n === String(n))
}

/**
 * The bridge sentence, said ONCE on the page that contains the console.
 *
 * A reader who knew the old heading ("Heuristic pass") must be able to learn that it is the same
 * thing as the new one, or the rename simply loses them. After this sentence the old term is
 * never used as a name again.
 */
export const INSTANT_SCREEN_BRIDGE =
  'The instant screen is the deterministic pattern (heuristic) pass — it runs in your browser as you type, free.'
