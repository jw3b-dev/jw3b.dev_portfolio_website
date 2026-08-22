# Creative brief — the audit console (`/audit`, embedded on `/work`)

**art-director · 2026-08-21 · supersedes the ad-hoc layout shipped with ADR-P5-02**

## 0. Design system gate — decision: **SKIP (system frozen)**

A token system exists (`src/styles/tokens.js`, semantic Tailwind classes) and the approved visual
direction is locked: *flat cyan engineered panels, anti-spectacle, no 3D*. This redesign introduces
**zero new tokens and zero new colours**. It is an information-architecture and naming problem, not
a palette one — the console is confusing because of what it *says* and how it is *grouped*, not
because of how it looks. Recording the decision so nobody later reads this brief as licence to
restyle.

## 1. The diagnosis

The owner's words: *"the whole thing is very unclear and confusing."* Three specific causes.

**a. One word, two meanings, one screen.** The findings panel is headed `Heuristic pass · live`,
where "live" means *updates as you type*. Ten centimetres below, each analysis carries a badge
reading `live`, where it means *came from the live model rather than a bundled recording*. A
reader who learns either meaning is then misled by the other. This is the single worst thing on
the page and it is entirely self-inflicted.

**b. Two tiers, no hierarchy.** The console does two completely different things — a free,
instant, in-browser deterministic screen, and an on-demand model call metered at 10 per session —
and presents them as undifferentiated panels. Nothing on screen answers the first question a
careful visitor asks: *which of these costs me something?*

**c. Controls filed under the wrong owner.** The left column stacks six unrelated concerns: the
editor, the run button, the auto-run toggle, pause, the budget counter, the status line, and the
version chips. The paid tier's controls sit beneath the editor as though they govern typing, while
the version chips — which are *source* history — sit furthest from the source they belong to.

## 2. Naming table (binding — these collisions must not survive)

| Old | Why it fails | New |
|---|---|---|
| `Heuristic pass · live` | "live" collides with model provenance | **Instant screen** — *"Deterministic. Runs in your browser as you type — no network, no cost."* |
| `Findings` | doesn't say whose findings, or from which tier | folded into **Instant screen**; the list keeps the heading **Pattern findings** |
| `Run AI analysis` (button) vs `Analyses (2)` (history) | two names for one noun | button **Run AI analysis**; history **AI analyses (2)** — the same noun phrase, verbatim |
| run badge `live` / `recorded` | correct, but only once (a) is fixed | **live model** / **recorded fallback** — say the whole thing |
| `N of 10 analyses left` | which kind of analysis? | **N of 10 AI analyses left this session** |
| `Versions — click to restore` | orphaned from the editor it belongs to | **Your versions** — sits directly under the editor |

**Anti-pattern, permanently:** the word *live* may only ever describe model provenance on this
page. The free tier is **instant**, never live.

## 3. Section structure — a numbered workflow

The page already has a natural four-step flow; the layout hides it. Make it explicit. Every section
carries a numbered eyebrow, a title, and **a one-line statement of what it costs** — that last part
is what actually answers the confusion.

```
┌─ LEFT (the source) ──────────────┐  ┌─ RIGHT (what we can tell you) ────────┐
│ 1 · YOUR CONTRACT                │  │ 2 · INSTANT SCREEN                     │
│   editor                         │  │   "no network, no cost"                │
│   ── Your versions ──            │  │   pattern findings + Apply fix          │
│   Original · Edit 1 · Fix · …    │  │   re-screen verdict                     │
└──────────────────────────────────┘  ├────────────────────────────────────────┤
                                      │ 3 · AI ANALYSIS                        │
                                      │   "one model call per run · 10/session"│
                                      │   [Run AI analysis] ☐ re-run on edit    │
                                      │   budget · status line                 │
                                      ├────────────────────────────────────────┤
                                      │ 4 · AI ANALYSES (n)                    │
                                      │   run tabs, each: live model/recorded, │
                                      │   stale marker, restore, disclaimer    │
                                      └────────────────────────────────────────┘
```

**The structural fix:** the auto-run toggle, pause, budget and status move OUT of the editor column
and INTO section 3, where they belong — they govern the paid tier, not typing. The version chips
move INTO section 1, under the editor, because they are the history of the source.

Reading order for a first-time visitor: *this is my contract* → *here is what we can tell you for
free, instantly* → *here is what costs a model call, and how much you have* → *here is every
analysis you've run, each pinned to the version it read.*

## 4. Brief

**Mood:** Instrument panel, not dashboard. Legible under pressure. The confidence comes from
labelling everything honestly, including the limits.
**Palette accents:** `cyan` marks the *paid/on-demand* tier only (section 3's run button, section 4's
active tab) so the eye learns "cyan = this spends something". The free tier is `content-*` on
`panel`/`void` — deliberately quieter. `caution` for stale/degraded, `verified` for a cleared
re-screen. No new tokens.
**Animation strategy:** none beyond existing `motion-safe:transition-colors`. This is a tool; motion
here is noise.
**Spatial layout:** unchanged two-column at `lg`, single column below. Sections separated by a
hairline rule + numbered eyebrow, not by cards-within-cards — nesting panels is what made the
current version read as mush.
**3D / glass:** none. Direction is locked anti-spectacle.
**Typography:** section eyebrow = `font-mono text-[10px] uppercase tracking-label text-cyan` for the
number, `text-content-muted` for the label; section title = `text-sm font-semibold text-content-primary`;
cost line = `text-[11px] text-content-muted`.
**Key constraint:** every section states its cost in its own header. A section that doesn't say
what it costs does not ship.

## 5. Review criteria (what the QA pass will check)

1. The word "live" appears **only** as model provenance — nowhere describing the instant screen.
2. The run button and the history heading use the identical noun phrase.
3. All four sections are numbered, titled, and carry a cost line.
4. Auto-run controls sit in section 3; version chips sit in section 1.
5. Zero hardcoded colours; tokens only.
6. Keyboard: both tablists keep roving focus; every control has a visible focus ring.
7. Mobile (390px): sections stack in the numbered order and no control is clipped.

---

## Product owner

**The job the visitor finishes:** An auditor uses this as a working scratchpad — screen, fix, re-screen, compare — and leaves with a report, not a screenshot.

**Next needs:**

- **Keyboard-first operation.** This is a tool for people who live in an editor. Every control is mouse-first; run, re-run, next-finding and jump-to-line should all have keys.
- **Diff the re-screen.** Applying a fix re-screens and reports a verdict but does not show what changed between the two finding sets — the delta is the interesting part and it is computed and then discarded.
- ~~Surface the budget before it bites.~~ **✎ DONE 2026-08-22** — the header now reads from `meteringPolicy`, counts down while runs remain, and on exhaustion says what is still free rather than rendering a bare "0 of 10".
