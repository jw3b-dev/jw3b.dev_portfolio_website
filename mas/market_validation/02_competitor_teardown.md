# 02 — Competitor & Reference Teardown  ★ KEY DELIVERABLE

**Question this answers:** what does the design phase copy the *rigor* of, what does it
refuse to become, and *why*. The prior jw3b.dev was rejected as "the same scrap" (generic
two-column hero + stacked cards). This doc catalogs (a) the generic baseline to escape,
(b) the distinctive moves that actually work for a systems/AI engineer, and (c) 9 concrete
reference sites torn down.

**Verification key:**
`[GROUNDED]` = confirmed via search/fetch this session · `[KNOWN]` = well-established
reference from training knowledge, live current-state NOT re-verified this session (sites
change — flag for manual spot-check before the design phase locks a reference).

---

## The single most important finding

> **"Motion and 3D have become baseline expectations rather than differentiators in 2026's
> design landscape."** — Muzli Top-100 2026 `[GROUNDED]`

WebGL/Three.js/3D heroes are now **table stakes at the award tier**, not a differentiator.
Every studio on the Muzli/AWWWARDS lists does 3D. So a "wow 3D hero" would make jw3b.dev
*look* current but land John in the **same undifferentiated bucket** as 500 creative-dev
portfolios — a more expensive version of "the same scrap." **John's differentiator is not
his rendering; it is his content: live systems, verifiable record, the graph thesis.** The
winning move is *proof-as-interface* — make the interaction BE the product, not decorate it.

---

## Tier A — Award-caliber references (the interaction/craft bar)

### 1. Bruno Simon — bruno-simon.com  `[GROUNDED]`
- **Layout/interaction:** the entire portfolio is a drivable 3D physics game; you steer a car
  to "project" markers. No hero, no cards. AWWWARDS Site of the Month + FWA + CSSDA Site of
  the Year.
- **Distinctive? YES — the canonical example.** **Why it works:** *one signature interaction
  that IS the person's skill.* He's a creative-WebGL dev, so the site is a WebGL toy — the
  medium proves the message. **Lesson for John (adapt, don't copy):** the site's central
  interaction should BE a working instance of what John sells (an agent, an audit run, a
  graph) — not a car. Copying the car would be cargo-culting the *form* while missing the
  *principle*.

### 2. Obys Agency / Phantom.Land / Immersive Garden  `[GROUNDED via Muzli]`
- **Layout/interaction:** experimental motion, kinetic grids, editorial typography, scroll
  theatrics, "art-installation" feel.
- **Distinctive? YES, but generically-distinctive.** **Why to note it:** this is the AWWWARDS
  house style — gorgeous, and now *expected*. **Lesson:** borrow their **typographic
  confidence and spatial boldness**, but their content is *brand vibes*; John's content is
  *evidence*. If jw3b.dev adopts their look without their justification it becomes decoration.

### 3. Rauno Freiberg — rauno.me  `[KNOWN]`
- **Layout/interaction:** austere, near-monochrome, but every UI element is a hand-built,
  physics-tuned micro-interaction; an "interface craft" lab. Minimal chrome, maximal detail.
- **Distinctive? YES — the anti-3D route.** **Why it works:** signals mastery through
  *restraint and precision*, not spectacle. **Lesson for John:** proves you can be
  award-distinctive with **zero 3D** — density + craft + honesty. This is the closest
  aesthetic register to a "serious systems engineer who is also tasteful."

---

## Tier B — Premium-technical / AI references (the *content* register John should own)

### 4. Linear — linear.app  `[KNOWN]`
- **Layout/interaction:** the benchmark "serious software" aesthetic — dark, high-contrast,
  precise grid, restrained purposeful motion, real product UI as the hero visual.
- **Distinctive? YES, by *credibility* not spectacle.** **Why it works:** it looks like it
  was built by the kind of engineer you'd want to hire. **Lesson:** this is the *tone* target
  for a senior engineer — premium ≠ flashy; premium = precise, dense, confident, fast.

### 5. Maxime Heckel — blog.maximeheckel.com  `[KNOWN]`
- **Layout/interaction:** technical essays with **live, embedded interactive demos** (shader
  playgrounds, tunable visualizations) inline in the prose. You *manipulate the concept*.
- **Distinctive? YES — the gold standard for "prove it inline."** **Why it works:** every
  claim is immediately playable; reading becomes doing. **Lesson for John (high-value):** his
  "systems are graphs" thesis and agent pipelines should be **live manipulable objects**, not
  diagrams — the reader should *run* the pipeline / *explore* the graph on the page.

### 6. Anthropic / OpenAI research-index pages  `[KNOWN]`
- **Layout/interaction:** dense, evidence-forward, near-brutalist restraint; content is
  papers/results, design gets out of the way; typography + whitespace do the work.
- **Distinctive? YES, by *authority*.** **Why it works:** the density and citation signal "we
  have so much real substance we don't need to decorate." **Lesson:** matches John's "proof,
  not promises" voice exactly — let the *evidence volume* be the aesthetic.

---

## Tier C — Web3 / auditor proof surfaces (verifiable-reputation register)

### 7. Code4rena / CodeHawks / Sherlock researcher profiles + leaderboards  `[GROUNDED]`
- **Layout/interaction:** public leaderboard rows, per-contest findings, EXP/rank, all
  externally verifiable and linkable.
- **Distinctive? Functionally, YES — this is the *trust primitive* of Web3 hiring.** **Why it
  matters:** buyers are explicitly taught to evaluate on exactly these public records
  ("competitive leaderboard performance… is the best externally verifiable proxy for
  individual skill"). **Lesson for John:** don't *describe* CodeHawks #124 — **embed the
  verifiable artifact** and deep-link to the public contest. The proof surface IS the design.

### 8. Boutique auditor sites (Spearbit/Cantina, Trust Security tier)  `[KNOWN]`
- **Layout/interaction:** typically a logo wall of past clients + a PDF report list. Clean but
  **conventional and homogenous** — most read the same.
- **Distinctive? NO — this is the auditor version of "the same scrap."** **Why it fails:**
  logo walls are asserted trust; the market is moving to *verifiable* trust (Tier C.7).
  **Lesson:** John's edge over these is a **running tool (KTHULHU) + a public record** — beat
  the logo wall by being demonstrably live.

---

## Tier D — THE GENERIC BASELINE (what "the same scrap" literally is)

### 9. Templated dev portfolios — terminal-CLI templates + glassmorphism templates  `[GROUNDED]`
- **Layout/interaction:** two dominant template families in 2026:
  - **Glassmorphism dev portfolios** — frosted cards, blur, neon accents, dark bg. Praised as
    "technical enough… polished enough" — *i.e., the default.* **← This is exactly the current
    jw3b.dev cyber/neon glass aesthetic that was rejected.**
  - **Terminal/CLI portfolios** — fake shell, `ls`/`cd`/`cat` commands. Whole GitHub topics
    of copy-paste templates (`terminal-portfolio`, CLIfolio Framer template, etc.).
- **Distinctive? NO — both are template genres.** **Why they fail *for John specifically*:**
  they are downloadable in one click, so they signal "I used a template," the opposite of a
  senior systems builder. **Disconfirming nuance (honest):** sources do NOT call these
  "overdone" — they're *sustained, popular* choices. They are fine for a junior. They are
  *disqualifying for a distinctive senior rebuild*, because ubiquity = generic **here**, even
  if the sources like them. The terminal aesthetic can still be *referenced* (see Distinctive
  Moves) — but as a real, functional console tied to a real tool, never as template chrome.

---

## ⛔ Generic-portfolio clichés to AVOID (the "same scrap" catalogue)

Ranked by how badly each undercuts a *senior systems/AI* positioning:

1. **Two-column hero + headshot + tagline** (the exact rejected layout). "Don't make your
   headshot the hero — your projects matter more." `[GROUNDED: Ramotion]`
2. **Skills grid / tech-icon cloud as a top section.** "Leading with skills lists and burying
   the actual projects" is the #1 mistake. Senior signal = *systems*, not a logo of every
   tool. `[GROUNDED: Fonzi]`
3. **Stacked identical feature/project cards** in a uniform grid. "A boring grid-based gallery
   alone doesn't stand out." `[GROUNDED]`
4. **Glassmorphism/neon as the whole identity.** "Looks sophisticated when used sparingly and
   cheap when overused." It's now the *default* dev-portfolio skin. `[GROUNDED]`
5. **Decorative 3D/WebGL hero with no purpose** — now baseline, not distinctive; lands John in
   the creative-dev bucket, not the systems-engineer bucket. `[GROUNDED: Muzli]`
6. **Chronological résumé timeline** as a primary section — reads as CV, not proof.
7. **"Twenty projects" wall.** Winners "show exactly three polished, domain-focused projects,
   not 20 scattered experiments." `[GROUNDED: Fonzi]`
8. **Templated terminal portfolio** used as decoration (not a real tool). `[GROUNDED]`
9. **Animation for animation's sake.** "Every animation should be purposeful." `[GROUNDED]`

## ✅ Distinctive moves that WORK for a systems/AI engineer

1. **One signature interaction that IS the product.** (Bruno Simon principle.) For John: the
   hero should let you *run an agent / trigger an audit / explore the graph* — the medium is
   the proof.
2. **Proof-as-interface / live over screenshot.** Embed the actually-running systems (AI
   security console, concierge, on-chain flow). "Live demo before the first scroll" beats any
   headline. `[GROUNDED: Fonzi]`
3. **Manipulable concepts inline** (Maxime Heckel principle). The "systems are graphs" thesis
   as an explorable graph; the 13-phase Overmind engine as a steppable pipeline — not diagrams.
4. **Verifiable-record embeds** (Code4rena principle). Deep-link CodeHawks #124 + live tool
   output; show the *artifact*, not a badge. `[GROUNDED]`
5. **Radical honesty as a design element.** Publish unedited runs *including failures*; a
   "what failed and why" surface — the exact trait hiring managers screen for. `[GROUNDED]`
6. **Information density done with craft** (Rauno / Anthropic principle). Dense real data +
   restraint reads as senior; sparse + decorated reads as junior.
7. **Real terminal/console — earned, not themed.** A working console attached to a real tool
   (KTHULHU) is distinctive; a fake `ls` gimmick is a template. Use the aesthetic only where
   it's *functional*.
8. **Premium-technical tone** (Linear principle): dark, precise, fast, confident motion — the
   site should feel *engineered*, because that's what's being sold.

## Red-team (teardown phase)

- **Recency/vendor bias:** Muzli/AWWWARDS are design-media, incentivized to hype novelty and
  3D. **Counter:** their *own* copy admits 3D is now baseline — the disconfirming quote
  strengthens, not weakens, the anti-3D thesis. `[GROUNDED]`
- **Survivorship:** award galleries show only winners; thousands of similar 3D sites that
  *didn't* win are invisible — reinforces "3D ≠ differentiation." Counted.
- **Live-state risk:** Tier B references (rauno.me, Linear, Heckel, Anthropic) are `[KNOWN]`
  and were not re-fetched this session; **manual spot-check before locking any as a design
  reference** — treat as directional, not pixel-current.
- **Confidence: HIGH** on the clichés-to-avoid and distinctive-moves catalogues (multiple
  independent grounded sources + the rejection brief itself). MEDIUM on the exact current
  state of individual `[KNOWN]` reference sites.

## Sources
- https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/
- https://www.awwwards.com/websites/interactive-portfolio-examples/
- https://www.awwwards.com/websites/winner_category_portfolio/
- https://bruno-simon.com/ · https://www.awwwards.com/sites/bruno-simon-portfolio · https://thefwa.com/cases/bruno-simon-portfolio
- https://www.ramotion.com/blog/web-developer-portfolios/
- https://fonzi.ai/blog/ai-engineer-portfolio
- https://www.dataexpert.io/blog/ultimate-guide-ai-engineering-portfolios
- https://myseera.com/blog/best-developer-portfolio-templates-2026 · https://createtoday.io/examples?category=web-developer-portfolio
- https://github.com/topics/terminal-portfolio · https://clifolio.framer.website/ · https://dev.to/sathishk-dev/i-built-a-terminal-style-portfolio-that-feels-like-a-real-cli-ed
- https://blockonomi.com/best-smart-contract-auditors-and-web3-security-companies-2026-ranked-by-verifiable-public-evidence · https://talentlevelup.com/hire-smart-contract-auditor/
