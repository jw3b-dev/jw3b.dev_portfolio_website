# Brief 01 — Hero (Operable, Proof-First) ★ make-or-break

**Route:** `/` (marquee), above the fold · **Hats:** all four present; Engineer/Auditor lead ·
**Phase:** P1 (shell + prerender in P0)
Implements `design/design-story.md`. The single most-rejected surface on the old site — every line
here exists to be **decisively none of the six rejected heroes**.

**Mood:** live conviction. You didn't land on a résumé — you walked up to a console John left
running, and it's mid-thought. Calm, dark, engineered; then it *does the thing* in front of you.

**Composition & Hierarchy:** full-bleed dark command surface, **asymmetric, operable-first** —
NOT two columns of headshot+tagline. Three stacked zones by importance:
1. **One position line** (top, restrained): a single sentence-case statement of who + the one bet —
   e.g. *"Senior Agentic AI Developer. Multi-agent systems that survive production — verified in
   front of you."* (copywriter finalizes; the brief fixes the *shape*: one precise line, no "I build
   cool things," no hype adjectives). This is the **LCP element** — prerendered DOM/CSS text.
2. **The operable console** (dominant, center of gravity): a real input — the **`/audit` Solidity
   auditor** pre-loaded with a real contract that has a known finding (default per §10 open Q2). On
   the prerendered shell it shows the **last real run** as a truthful static readout (a streamed
   finding + severity + a `VERIFIED · reproduced` verdict) so first paint already shows real proof;
   on hydrate it becomes **operable** — the visitor edits and runs their own, findings stream live.
   A liveness tick sits on it. This is where the "wait, this is running" beat happens.
3. **The verdict rail** (beneath / beside): the headline claims as **verified assertions**, not a
   counter row — `CodeHawks #124 · 17 findings (8 High) · 1,430 EXP` (deep-links the public contest),
   `KTHULHU · live · paying users`, `Overmind · 13-phase pipeline`. Each is a `<Claim>` with the
   verified treatment and its receipt one tap away (see brief 02). NO odometer count-up.
A quiet **four-hat strip** (Engineer/Auditor/PM/Founder, accent-coded) sits low — establishing the
identity structure without a skills grid (brief 03 owns the full surface).

Eye path: position line → the console producing a real verified finding → verdict rail → hire spine.

**Key Moment:** a streamed audit finding **resolving to `VERIFIED / REPRODUCED`** in cyan — the
site proving one of its own claims, live, in the first screen. The "wow" is *"this is live and I can
use it,"* not an animation. On the static shell this same verdict is already shown (truthful last
run), so the moment survives even before hydration and on reduced-motion.

**Palette Accents:** graphite void; **cyan** carries the console's live edge-light, the VERIFIED
verdict, the liveness tick, and the hire CTA; amber only on the AI-disclosure + any recorded-run
label; the reserved failure color appears only if the visitor's own run legitimately finds a
high-severity issue (which is *good* proof — the tool works). Per-hat accents on the four-hat strip.

**Animation Strategy:** the verdict resolve (≤200ms, once, then still); real token streaming in the
console; liveness tick; one entrance rise on load (≤400ms, once). **No** decorative motion, **no**
3D idle, **no** count-up numbers, **no** background particle field.

**Spatial Layout:** 12-col; console occupies the dominant block (≈ 7–8 cols on desktop), position
line spans wide above it, verdict rail ≈ 4–5 cols beside/below; four-hat strip full-width low.
Mobile: position line → console (full fidelity, operable, or labelled recorded run) → verdict rail
→ hat strip, in that priority order.

**3D Elements:** none. (The distinctness from the studio is the *live console*, not a canvas —
anti-spectacle route, §1 of the story.)
**Glass Effects:** none — the console is a flat, hairline-bordered raised panel with a cyan
edge-light when live; no frosted glass.

**Typography:** position line in engineered grotesk, clamp ~40–64px, w650, tracking ≈ −0.01em,
sentence case; console I/O and all verdict-rail figures in **mono tabular**; verdict labels 11px
uppercase; no gradient text.

**References:** Maxime Heckel inline-demo hero (operable concept); Linear product-as-hero; a
Code4rena contest page for the verifiable-record instinct; Anthropic evidence-density for the rail.

**Key Constraint:** **LCP ≤ 2.5s on mid-tier mobile.** The LCP element (position line + console
frame + last-run readout) is **prerendered DOM/CSS/inline-SVG — never an image screenshot, never
JS-gated**; the live console, Web3, and any heavy chunk hydrate *after* first paint (ADR-07). The
audit heuristic-first pass returns real findings <300ms so "live" is fast and reliable even if
Anthropic is down (Tier-1/2 replay behind it).

**HARD survival constraints:**
1. **NOT** a two-column headshot+tagline hero (rejected #1). No headshot anywhere in the hero.
2. **NO** decorative 3D/WebGL/canvas, **no** rotating "instrument" polygon, **no** particle field
   (rejected #3, #4). The only motion is state.
3. **NOT** the 13-node pipeline diagram (rejected #5). The pipeline lives in brief 04 as a steppable
   object, never as this hero's visual.
4. The console must degrade to a **labelled recorded run**, never a broken/empty box (BR-03, R-01) —
   a hero whose live demo is down proves the opposite of the thesis.
5. Every verdict-rail number is a cleared `<Claim>` with a receipt; **zero** free-floating or
   zero-value counters (the old site's `0 TVL` sin); CodeHawks #124 deep-links out (FR-044).
6. The "wow" must survive reduced-motion and pre-hydration — the truthful static verdict carries it
   with zero animation.
