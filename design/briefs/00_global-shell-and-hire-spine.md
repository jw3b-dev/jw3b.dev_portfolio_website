# Brief 00 — Global Shell, Nav, Hire Spine & Concierge

**Route:** persistent layout (all routes) · **Hats:** neutral frame (all four) · **Phase:** P0/P1
Implements `design/design-story.md`. Global to every brief: **3D — none; Glass — none** (low-blur
scrim only behind the nav bar and any overlay); liveness tick is the sole ambient motion;
`prefers-reduced-motion` honored.

**Mood:** a powered-on operating console you never leave — calm, dark, engineered, and always one
tap from "hire." The frame recedes; the live surfaces come forward.

**Composition & Hierarchy:** slim fixed top bar (~56–64px): left = `jw3b` / John Wellard wordmark
(engineered grotesk, sentence case — NOT a logo mark, NOT Orbitron) + a small **liveness status
readout**; center/left = minimal route links (`/audit` · `/ctf` · systems · `/hire-me`); right =
the **persistent hire CTA** (the spine — cyan, always visible, ≤1 click from every route, FR-002).
Bottom-docked **concierge launcher** (a labelled console tab, not a bouncing avatar bubble).
Footer = an **evidence/trust strip**: privacy notice, AI-disclosure line, testnet-honesty line,
`rel=me` cross-link to agilegypsy.com (studio↔person), real GitHub repos. Eye path on any route:
content → hire CTA (always in the corner of the eye) → concierge if they want to ask.

**Key Moment:** the **liveness tick** in the top bar — `systems live · checked 2s ago` in mono,
updating only on a real heartbeat. It silently proves the entire site is *operating*, not
published. On degrade it swaps to `recorded runs · <date>` (never faked). This is the shell's one
job beyond navigation: establish that this is a live thing.

**The concierge (global, AI-is-headline):** opens as an **inline docked panel** (right or bottom
sheet), not a floating bubble with a persona/avatar. SSE-streamed, tokens arrive live; shows the
**AI-disclosure indicator** (amber, FR-021); parses/strips the tag protocol
(`[AUDIO]`/`[TOOL_CALL]`/`[RENDER_CARD]`) before render; a `[TOOL_CALL]` can **route the visitor to
Mission Control** (FR-019). Grounded only in the cleared-claims KB — it cannot state an ungoverned
number. Down/timeout → a graceful canned reply **with a link** (never a blank error), and a
labelled recorded run if available (BR-03). Voice STT/TTS is a quiet optional control, not a
gimmick (FR-016, COULD).

**Palette Accents:** graphite void ground; cyan = the hire CTA, active route, focus ring, liveness
tick; amber = AI-disclosure + any "recorded run" label; reserved failure color appears **only** in a
genuine error state. Nav/footer text in the muted cool-gray ramp.

**Animation Strategy:** liveness tick (real events only). Route change = content swap ≤160ms fade,
no page-transition theatrics. Concierge panel opens with a ≤200ms slide, tokens stream as computed.
No looping, no bounce on the launcher.

**Spatial Layout:** max content width ~1200–1280px; the top bar spans full width with a hairline
bottom border. Concierge panel ≤ ~420px docked (full-width sheet on mobile). Footer full-width,
low-key.

**3D Elements:** none.
**Glass Effects:** a single low-blur translucent scrim behind the fixed top bar and behind any
modal/overlay only — never on content panels.

**Typography:** wordmark ~18–20px engineered grotesk w650 sentence case; route links 13px; hire CTA
label 13–14px; liveness tick + all status in **mono** (tabular). Footer 12–13px muted.

**References:** Linear top-bar restraint; Vercel/Geist docs shell; Rauno.me chrome minimalism.

**Key Constraint:** the hire CTA is reachable **≤ 1 click from 100% of routes** (FR-002, OBJ-01),
and the shell (top bar + wordmark) is part of the **prerendered LCP path** — it must paint without
JS. Concierge + Web3 hydrate after first paint (provider order Wagmi→Query→RainbowKit→Helmet→Router).

**HARD survival constraints:**
1. The concierge is **never** a floating avatar bubble with a sparkle/emoji AI persona (generic
   2026 default) — it is a labelled inline console with an honest AI-disclosure indicator.
2. The liveness tick **never fakes** liveness — it changes only on a real event; degrade shows an
   honest recorded/offline label (BR-03, radical-honesty pillar).
3. **Zero dead-ends and zero perpetually-disabled controls** in the shell; the hire spine always
   resolves to book-a-call at minimum (BR-11).
4. No stacked-card nav, no mega-menu clone of the studio, no octopus, no orange, no Orbitron (C7).
5. Every footer trust line (privacy, AI disclosure, testnet honesty) is present from day one — they
   are MUST compliance duties, not decoration (FR-021/024/057, BR-08/09/10).

---

## Product owner

**The job the visitor finishes:** From any page, a visitor who has decided to act finds the way to act — without hunting, and without losing the page they were reading.

**Next needs:**

- ~~`/messages` is an orphan.~~ ✎ Corrected 2026-08-22 (an earlier draft claimed it "remains in the footer"; `grep` found no link anywhere in `src/` — a registered route and a sitemap `<loc>` reachable by no visitor), then **RESOLVED the same day**: `SiteFooter.jsx` links it as "Messages (not live)". Of the two honest options — link it truthfully, or drop it from the sitemap — the first was taken, so the crawler and the visitor now see the same site.
- **Spine that knows its state.** A visitor who already submitted an engagement is still asked to submit one. The confirmation carries a real delivery state (FR-037), and nothing above the page reads it.
- **A defined stacking order at 390px.** `layout-and-assets.spec.js` asserts the hire spine and concierge launcher never cover a footer link — that is the floor, not the design. The intended z-order and offsets are still implicit.
