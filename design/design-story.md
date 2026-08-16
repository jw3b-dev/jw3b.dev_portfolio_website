# jw3b.dev v2 — Design Story

**Art Director direction, v1 (MAS Phase 5, P0-02).** Everything downstream — brand-architect
tokens (P0-03), per-surface briefs (`design/briefs/*`), the built surfaces, and the visual QA
that gates them — implements THIS document. Where a brief conflicts with this story, the story
wins; where either conflicts with the **HARD survival constraints** (§9) or the architecture's
buildability limits (LCP ≤ 2.5s, 3-tier replay, prerendered shell), those win.

**Design-system gate decision: FULL REDESIGN.** The prior jw3b.dev (two-column headshot hero,
stacked-section cards, four-column pattern, glassmorphism-neon, the "ORCHESTRATION" pipeline
diagram) is SCRAPPED per `mas/facts/00_FACTS_BRIEF.md §6`. No token, class, or component survives
as identity. Only *facts* (the evidence register, the four flagships, the four hats) carry forward.

---

## 0. The one-line concept

> ## PROOF STATE
> **A portfolio you operate, not one you read — every claim is a live assertion you can run,
> verified in front of you, with the failures on the same wall.**

**The design law (borrowed from John's own KTHULHU): *reproduce, don't assert.*** KTHULHU refuses
to put a finding in a report until an agent has reproduced it as an executable exploit on an
ephemeral fork. This site adopts that discipline as its visual-editorial law: **nothing is
presented as true until it reproduces in front of the visitor.** Numbers are not typography — they
are readouts a check just returned. The four systems are not screenshots — they are consoles left
running. The audit record is not a badge — it is a link to the public contest. This is the *only*
concept on the table that a bootcamp grad with a Framer template **structurally cannot copy**,
because it is downstream of real production systems, a real public record, and the nerve to show
real failures.

This is decisively **none of the six rejected directions** (§9.A): there is no headshot hero, no
skills grid, no decorative 3D, no rotating "instrument" polygon, no 13-node pipeline diagram as
the hero, no re-skinned stacked cards. The "wow" is *"wait — this is actually running, and I'm
allowed to touch it,"* not a fancy effect.

---

## 1. Research — reference decision record

This is the decision, not a survey (full teardown: `mas/market_validation/02`). The single most
important finding governs everything: **"Motion and 3D are baseline expectations, not
differentiators, in 2026."** A wow-3D hero would make jw3b *look current* and land John in the
same undifferentiated bucket as 500 creative-dev portfolios. So we take the **anti-spectacle
route** and compete on content — live systems, a verifiable record, the graph thesis — not on
rendering.

| Reference | What we steal | What we refuse |
|---|---|---|
| **Rauno Freiberg (rauno.me)** — the anti-3D route | interface craft, density with restraint, every element hand-tuned; award-distinctive with **zero 3D** | its near-monochrome coolness has no *live* payload — we add the running systems |
| **Linear (linear.app)** — engineered credibility | dark, precise grid, restrained purposeful motion, real product UI *as* the hero; "built by the engineer you'd want to hire" | it sells a *company*; we sell a *person operating systems* — more operable, less marketing |
| **Maxime Heckel (blog.maximeheckel.com)** — prove it inline | manipulable concepts embedded in the page; reading becomes *doing* | his are teaching toys; ours are **John's own production systems**, verifiable |
| **Anthropic / research-index pages** — evidence-forward density | let the *volume of real evidence* be the aesthetic; typography + whitespace do the work | its stillness — we need the one live, moving proof of liveness |
| **Code4rena / CodeHawks profiles** — the trust primitive | embed the *verifiable artifact* + deep-link the public contest; the proof surface **is** the design | the logo-wall auditor sites — asserted trust, not verifiable |

**Chosen register:** premium-technical — **Linear-precise · Rauno-dense · Anthropic-evidence-
forward · Heckel-operable**, with the Code4rena verifiable-record instinct as the claims layer.
Dark, fast, dense, restrained, cyan-led, one unmistakable hire path.

---

## 2. Visual philosophy

**The site should feel like walking up to a rack of professional equipment that is *currently
powered on and doing real work* — in a calm, dark, engineered room — and realizing the readouts
are live and you're allowed to touch them.** Not a showroom; an operating console someone trusts
you enough to hand over.

The emotional target is **relief and recognition** for the Primary persona (the building
founder/CTO whose scar is *"works in demos, fails in production"*): *"This person actually runs
production systems, and he isn't asking me to believe him — he handed me the controls, and I can
see the ones that broke."* The reward the design offers is not delight-at-an-effect; it is the
quiet confidence of watching a claim get checked and pass — and of seeing a failure shown on
purpose.

Emotional register per surface:
- **Hero & operable surfaces = live conviction.** Calm until you touch them; then they *do the
  thing*, streaming a real result. Confidence expressed as "run it yourself," not adjectives.
- **Evidence & identity surfaces = engineered authority.** Dense, quiet, instrumented. Every
  number is a readout with its source one tap away. The density *is* the seniority signal.
- **The failures surface = disarming honesty.** A failed verdict presented with the same rigor as
  a passing one — steady, unhidden, expandable to the real log and the fix. Not an apology; a flex.
- **Mission Control = decisive, frictionless.** The one place the whole site is pointing; every
  path converges on a confirmed hire, none dead-ends.

---

## 3. Design metaphors

The metaphors are not decoration — each maps a *real product mechanic* to a visual consequence, so
the aesthetic and the sales argument are the **same object**.

| Product / brand mechanic | Metaphor | Visual consequence |
|---|---|---|
| KTHULHU's "reproduce before you report"; the zero-trust validator between every step | **The verdict** | Every claim carries a state: `asserted → checking → VERIFIED` (cyan) or `FAILED` (reserved honest color). Resolves via a real check, then holds still. The signature gesture of the whole site. |
| "Systems are graphs" (John's thesis) — the connective spine across all four pillars | **Node + validated edge** | The recurring structural motif: nodes joined by edges that *carry a verdict*. Used at many scales (a pipeline step, a claim→evidence link, an attack path) — **never** as a static hero org-chart. |
| Live systems (concierge, `/audit`, CTF, KTHULHU) that take real input | **The console left running** | Operable surfaces render as powered-on terminals with a real pre-loaded run, a liveness tick, and an editable input. Depth/edge-light says "this one is live." |
| The evidence register + CodeHawks public record | **The receipt** | Numbers are readouts, not headlines; each is one tap from its source (register pointer / public-contest deep-link / provenance chip). No number floats free of its receipt. |
| The 3-tier replay fallback (live → recorded run → offline) | **The honest label** | When live degrades, the surface swaps its liveness tick for a `RECORDED RUN · captured <date>` label. Verifiably-real, never faked-live, never broken. |
| The four hats (Engineer/Auditor/PM/Founder) held by one person | **One operator, four stations** | The four hats are shown together as a single instrument with four accent-coded readouts; a filter *dims* the other three, never hides them. |

---

## 4. Color strategy (token NEEDS — brand-architect resolves hex in P0-03)

**Color-world: cool engineered graphite void, one live cyan signal, a reserved verdict grammar,
and four accent-coded hats.** No violet-tinted glass casino, no orange-led studio warmth, no neon
soup.

- **Ground — the void.** A cool, near-black **graphite** ramp (blue-black, *neutral*, engineered —
  NOT the studio's bluer oceanic `#02060d`, NOT violet). At least three elevation steps: `void`
  (page) → `panel` (evidence surface) → `raised` (live console / resolved overlay). Elevation is
  drawn with **1px hairline borders + a small surface-step + a faint cyan edge-light on live
  elements** — *not* heavy blur or big shadows (see §7, distinctness from the studio's glass).
- **Lead accent — CYAN = live & verified.** One signature accent carries the whole identity: the
  passed verdict, the liveness tick, active/focus states, the primary interactive affordance, the
  edge-light on a running surface. Its job is *"this is powered on and it checks out,"* never "this
  is exciting." Needs a precise, spectral, engineered cyan — deliberately tuned **distinct from the
  studio's HUD cyan `#00E5FF`** so the person-brand never reads as the studio.
- **Verdict grammar — reserved signal colors, never decorative:**
  - **Cyan / verified-green** — passed, live, reproduced, settled fact. The dominant signal.
  - **Honest-failure (reserved) — a distinct amber→red** owned *exclusively* by the radical-
    honesty surface and genuine error/blocked states. When a visitor sees it, something actually
    failed. It appears **nowhere decorative** — this is what makes the failures surface land.
  - **Amber/caution** — testnet labels, "recorded run" / degraded-to-replay state, AI-disclosure,
    audit disclaimer. Steady, never pulsing.
- **Per-hat accents — one accent per pillar (data-driven, the mechanism carried from the studio's
  `--card-accent` system, jw3b's own hues):** **Engineer = cyan** (also the global lead) ·
  **Auditor = violet** · **PM = green** · **Founder = warm gold/amber.** Used to color-code nodes,
  edges, and which hat a flagship belongs to. ⚠️ The Founder warm accent must be tuned to a
  distinct gold/amber that does **not** reproduce the studio's signature identity-orange
  (`#FF8C00`) as a lead — it appears only inside Founder-hat contexts, never as a site-wide accent
  (constraint C7; see §10 open question).
- **Text ramp** — high-contrast near-white for figures/headings; a cool muted gray as the
  workhorse body/label color; a dimmer gray for de-emphasis. **AA everywhere** (4.5:1 body, 3:1
  large/graphical) — brand-architect validates.
- **No identity gradient.** The studio spends its one bold move on a cyan→magenta→orange gradient
  phrase per hero. jw3b **must not** copy that. jw3b spends its boldness on **liveness** — the one
  cyan element on screen that is *actually moving because it is real*. If any gradient appears at
  all, it is a restrained cyan→violet "verification" wash used structurally (e.g. an edge), never
  as clipped headline text.

---

## 5. Typography direction (type NEEDS — brand-architect picks faces in P0-03)

**Two voices: an engineered display grotesk and a load-bearing mono. Explicitly NOT Orbitron.**

- **Display / headings — a precise engineered grotesk, sentence case.** The studio owns Orbitron
  (uppercase, wide-tracked, cyber-institutional) as its wordmark voice; jw3b must **not** use
  Orbitron or any "cyber" display face. Need: a technical neo-grotesque with a high-contrast heavy
  weight and *tight* tracking, set **sentence case** (Linear/Anthropic register — confident, never
  shouting). Family direction: Inter Display / Geist / Söhne / a comparable precise grotesk. No
  uppercase headlines; uppercase is reserved for micro-labels and placards.
- **Mono — HALF THE IDENTITY, load-bearing.** This is a verification site: a strong, characterful
  monospace carries *all* instrument numerals, verdicts, claim values, streamed audit/agent output,
  code, tx hashes, timestamps, EXP/findings counts, and register pointers. **`font-variant-numeric:
  tabular-nums` on every number the site shows** — money and metrics always align. Family
  direction: Berkeley Mono / Commit Mono / JetBrains Mono / IBM Plex Mono; **prefer one visibly
  distinct from the studio's JetBrains Mono** if licensing allows. The mono is what makes numbers
  "look instrumented."
- **Eyebrows / labels** — small uppercase, letter-spaced (~0.2em), cool-gray or cyan micro-labels
  (HUD label grammar — shared DNA, fine to carry).
- **Hierarchy** — few sizes, strong weight contrast. Marquee display large and tight (clamp
  ~40–72px, weight 600–700, tracking ≈ −0.01em, sentence case); section titles ≤ ~28px; dense
  readout figures in mono; labels 11–12px uppercase. **No gradient text anywhere.**

---

## 6. Motion philosophy — signal, not decoration

**Motion communicates state: a check running, a verdict resolving, an alarm arming, a stream
arriving, a heartbeat proving liveness. If a motion doesn't carry information, it doesn't ship.**

- **The verdict resolve** — the signature motion. `asserted → checking` (a brief, honest working
  state) `→ VERIFIED`/`FAILED` in a single ≤200ms transition, then **perfectly still**. A settled
  verdict never shimmers, breathes, or pulses. A still cyan "VERIFIED" is more serious than an
  animated one.
- **The liveness tick — the one sanctioned ambient motion, and it is load-bearing.** A small mono
  readout / dot near each live surface that changes **only on a real successful heartbeat/poll**
  (e.g. `live · checked 2s ago`). It is the difference between "live" and "screenshot." When the
  surface degrades to a recorded run, the tick is **replaced** by the honest `RECORDED RUN` label —
  never faked. Nothing else loops.
- **Real streaming is real proof.** Audit findings and concierge tokens arrive as they compute —
  the latency *is* the evidence it's thinking. Never fake a progress bar; never tween a fake
  "typing" shimmer over a canned response.
- **Entrances** — one restrained rise/fade per section on scroll-into-view (Framer Motion,
  out-expo family, ≤ ~400ms, **once**, small translate). Staggered children ≤ ~80ms apart.
- **`prefers-reduced-motion` collapses everything to instant state changes — always, 100% of
  animated surfaces** (NFR-05, FR-007).

---

## 7. Spatial strategy — depth = liveness, density with craft

- **Depth encodes liveness and evidence, not decoration.** Max three surface levels: `void` →
  `panel` (evidence) → `raised` (the live/operable console or a resolved verdict/overlay). **The
  thing that is actually running is the thing that comes forward** — a live surface sits raised,
  faintly cyan-edge-lit; static evidence sits mid; the void recedes. No floating 3D, no parallax
  layering.
- **Glass is demoted from identity to a rare accent.** This is the sharpest distinctness move from
  the studio (constraint C7). The studio's identity *is* premium glassmorphism (heavy `blur`,
  translucent cards). jw3b shares the deep-space + HUD *lineage* but differs on **dimensionality**:
  **flat engineered panels with hairline borders, HUD corner-ticks, and cyan edge-light** — not
  frosted glass. `backdrop-filter` is permitted **only** as a low-blur scrim behind an overlay/modal
  or the sticky nav, never as a surface identity. No neon glows.
- **Density done with craft (Rauno / Anthropic).** Dense real data, hairline dividers, corner-tick
  readouts, mono numerals — but with generous vertical rhythm *between* sections so the whole reads
  senior and restrained, not cramped or neon-loud. Spend the density inside the instrument panels;
  keep air around them.
- **Layout is asymmetric and operable-first.** A command surface takes the dominant position;
  evidence rails and verdict ledgers flank or stack beneath it. **Never** a uniform grid of
  identical cards, **never** the old four-column pattern (§9.A.6). Bento-style asymmetry is earned
  by content hierarchy (the live console is biggest), not applied as a template.
- **Mobile preserves impact, not just stacking.** Consoles stay operable at full fidelity (or show
  the labelled recorded run); readouts collapse to compact single-line instruments; nothing
  load-bearing is hidden. LCP element (hero position line + shell) is prerendered DOM/CSS.

---

## 8. The verification signature (the reusable proof primitive)

The single element that makes the concept cohere, used on every surface — briefed in full in
`briefs/02_verified-claim-primitive.md`. In short: **every number, credential, and capability on
the site is a `<Claim>` that (a) renders only if `status==='cleared'` in the evidence register
(BR-01), (b) wears the verdict treatment (mono figure + verified state), and (c) is one tap from
its receipt** — the register pointer, the CodeHawks #124 public deep-link (from ≥2 surfaces,
FR-044), or an `AgileGypsy Labs / EcoGraph` provenance chip on studio-origin figures (FR-061).
Forbidden claims (aggregate TVL, $ secured, "protocols secured", "50+ audits", PMP,
PRINCE2-Practitioner) **cannot render** — the gate fails CI before they reach a surface.

---

## 9. Anti-patterns — the edges (survive any future art direction)

### A. The six explicitly REJECTED directions — do NOT regenerate any of these
1. **No two-column headshot + tagline hero.** The hero is an operable console + verdict rail.
2. **No skills / tech-icon grid or proficiency bars** as a section. Proficiency is shown as
   shipped, running systems and a verifiable record — never as bars or a logo cloud.
3. **No glassmorphism-neon identity and no decorative 3D/WebGL hero.** Glass is a rare overlay
   scrim only; the hero is DOM/console, not a canvas.
4. **No abstract rotating 3D polygon labelled "instrument."** Meaningless motion is banned; every
   moving thing carries state.
5. **No 13-node pipeline DIAGRAM as the hero visual.** The Overmind pipeline exists as ONE flagship,
   rendered as a **steppable/operable** object (you step it, gates verify in front of you), never as
   a static hero org-chart.
6. **No re-skinned old components, no stacked-section-cards layout, no four-column pattern.** Full
   redesign; asymmetric, operable-first composition.

### B. Derived anti-patterns
7. **No count-up number tweening.** Numbers are real readouts, not slot machines; a number arriving
   from a *real* stream is fine, a fake odometer is not.
8. **No looping ambient motion** (glow-breathing, neon pulse, shimmer, parallax, scroll-jacking).
   The liveness tick is the sole ambient motion, and it ticks only on real events.
9. **No faked liveness.** A recorded run is always labelled; a surface the app can't read shows an
   honest empty/label, never invented values. No zero-value counters (the old site's `0 TVL` sin).
10. **No orange-led palette, no oceanic/organic motifs, no octopus, no Orbitron, no
    cyan→magenta→orange gradient phrase** — all are the studio's identity (C7).
11. **No dark patterns at the hire flow** — no fake scarcity, no perpetually-disabled buttons; a
    rail that isn't provisioned degrades to book-a-call instead of showing a dead control.
12. **No claim without a receipt.** If a number can't trace to a cleared register entry, it does not
    appear — no exceptions, enforced by the gate.

---

## 10. Distinctness from the studio (C7) & open questions

**Shared with agilegypsy.com (the DNA):** deep-space dark ground, HUD-instrument treatment for
proof (corner-ticks, mono readouts, accent-coded numbers), the one-accent-per-pillar *mechanism*,
"proof, not promises" evidence-first voice, out-expo staggered entrances.

**Deliberately DISTINCT (so the person never blurs into the studio):**
| Axis | Studio (agilegypsy.com) | jw3b.dev |
|---|---|---|
| Lead accent | **orange** `#FF8C00` | **cyan** (spectral, tuned ≠ `#00E5FF`) |
| Dimensionality | premium **glassmorphism** (heavy blur) | **flat engineered panels** + edge-light; glass only as overlay scrim |
| Central figure | the **octopus** mascot, oceanic/organic | **no mascot** — the live console *is* the figure |
| Boldness spent on | a static cyan→magenta→orange **gradient phrase** | a single **live, moving verification** (boldness = liveness) |
| Display face | **Orbitron** (uppercase cyber) | **engineered grotesk, sentence case** |
| 3D | none (Canvas-2D) | **none as identity** (anti-spectacle; 3D only if a surface proves it needs it for comprehension, never decorative/hero) |

**Open questions — RESOLVED by John (2026-08-16, at design approval):**
1. **Founder-hat accent → WARM GOLD, Founder-only.** A distinct gold/amber used *only* inside
   Founder-hat contexts, tuned away from the studio's identity-orange (`#FF8C00`); **never a
   site-wide accent.** The site stays cyan-led; the warm appears solely in Founder readouts/nodes.
2. **Hero's default operable action → the `/audit` Solidity auditor.** The hero foregrounds the live
   auditor streaming a real **VERIFIED** finding in the first screen; the concierge remains the
   global assistant (not the hero lead).
3. **Mono face → IBM Plex Mono (free & distinct).** Chosen for zero license cost + visible
   distinctness from the studio's JetBrains Mono. (Berkeley/Commit Mono not licensed.)

**✅ Design direction APPROVED — PROOF STATE is locked.** brand-architect resolves the token layer
(P0-03) implementing this story + these three rulings; then the hero is built and shown to John in
the browser for the visual verdict before the build proceeds.

---

*End Design Story v1. Downstream order: brand-architect resolves tokens (P0-03) → per-surface
briefs in `design/briefs/` are implemented to brief → art-director visual-QA against the briefs'
HARD survival constraints. The soul is not an effect; it is that the proof is real, operable, and
verified in the first screen — presented with restraint.*
