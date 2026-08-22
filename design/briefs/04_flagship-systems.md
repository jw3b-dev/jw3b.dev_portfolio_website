# Brief 04 — The Four Flagship Systems (consoles left running)

**Route:** `/` section + deep-links · **Hats:** Engineer/Auditor/AI/Founder · **Phase:** P1 (frames)
/ P2 (operable embeds + Overmind graph)
Implements `design/design-story.md §3` (*the console left running*). **Exactly four**, shown
**operably, not as screenshots** (FR-004, OD-01). Curated depth, never a 20-project wall.

**Mood:** a rack of live equipment. Each flagship is a powered-on surface with a real readout and a
way in — you can operate it or verify it externally, not just read about it.

**Composition & Hierarchy:** four **asymmetric** system panels (sized by weight, NOT a uniform grid),
each = name + one-line thesis + its verified proof (`<Claim>`s) + an **operable or verifiable entry**:
1. **KTHULHU** (Auditor+AI+Founder) — autonomous auditor; *"nothing reaches a report until an agent
   reproduces it as an executable exploit on an ephemeral fork."* Entry: **sandboxed iframe embed**
   of the live kthulhu.co surface (ADR-08, strict CSP) → degrades to a **labelled recorded run**.
   Proof: `112+ merged PRs`, `live · paying users`.
2. **The live on-site AI** (AI+Engineer) — the concierge + `/audit` console + on-chain CTF treated as
   **ONE self-demonstrating system** — *"you are operating it right now."* Entry: run `/audit`, ask
   the concierge, solve the CTF (deep-links to briefs 05/06 + the global concierge). This is the
   purest proof-as-interface panel: its "screenshot" is the visitor's own session.
3. **Overmind GenAI Engine** (Engineer+AI) — the platform beneath the products; *"systems are
   graphs, verification is a first-class step."* ✎ **Corrected 2026-08-22** — this line was right all
   along and the build drifted off it three times; the card had inverted it into *"KTHULHU's
   two-lane audit engine"*, which is a **different system that shares the word**. Overmind is an
   agent fleet governed by AgilePM/DSDM where the governance is **executable**. Entry: the
   **steppable lifecycle** (below). Proof: `6-phase lifecycle · 8-principle gate`,
   `192,000+ corpus`, `1,345 tests · 100% coverage` — CR-06's old `13-phase · 51 modules` was a
   mis-transcription of the engine's **13 products** and is reconciled in the register.
4. **Kointel** (Engineer+Auditor+Founder) — a shipped compliance-first product; *"a build-failing CI
   gate that bans tx-signing from Web3 modules; carries an EU AI Act dossier."* Entry: **external
   verifiable deep-link** to kointel.co.za + a readout of the gate concept.

**The Overmind steppable lifecycle (FR-006):** the visitor **steps** the six DSDM phases and each
exit gate **visibly runs its eight-principle predicate sweep** before the next lights. It is
**operable/steppable, never a static org-chart, and never the hero** (rejected #5). Under
degrade/reduced-motion it shows a truthful pre-stepped state with the same verdicts.
✎ **Amended 2026-08-22 — the gate must also be able to REFUSE.** Three of the eight principles are
EXCEPTION-severity and halt the transition; a visitor can break one and watch the lifecycle stop
with the engine's own reason printed. The original spec only ever let gates go green, which is a
diagram of governance rather than governance. The card carries an explicit honesty line: it is a
**transcription you can operate**, cited to `lifecycle.ts`/`principles.ts`, **not a live connection
to a running fleet**.
**KTHULHU's two-lane pipeline is still steppable — it moved onto the KTHULHU card**, where it was
always true. Two steppers now exist and they are different systems; that is the correction, not a
duplication.

**Key Moment:** stepping an Overmind gate and watching the edge resolve to `VERIFIED` — the "systems
are graphs, every step is checked" thesis made literally operable; and the KTHULHU embed actually
loading a live surface (or an honest recorded run).

**Palette Accents:** each flagship tinted by its lead hat accent (per brief 03's map); cyan for
live/verified states + the Overmind edges; amber for recorded-run/testnet labels; reserved failure
color only where a real failure is shown.

**Animation Strategy:** pipeline step = edge-resolve ≤200ms per gate on user action; embeds load
live; verified marks settle then still; one section entrance rise. No looping, no auto-advancing
pipeline (the visitor steps it, or reduced-motion shows it resolved).

**Spatial Layout:** asymmetric — the live on-site AI + Overmind panels are larger (they're operable);
KTHULHU embed and Kointel link are supporting. Mobile: priority stack (live AI → Overmind →
KTHULHU → Kointel), embeds keep full fidelity or show the recorded run.

**3D Elements:** none by default. (A 3D graph is permitted **only** if it demonstrably beats 2D/SVG
for comprehension of the Overmind graph, within NFR-03 budget + a non-3D fallback, never on the LCP
path — default is 2D/SVG per story §7.)
**Glass Effects:** none — flat hairline system panels + cyan edge-light on the operable ones.

**Typography:** system names in engineered grotesk ~22–28px; theses sentence case ~16px; all proof
figures + pipeline node labels in mono tabular; `RECORDED RUN`/`TESTNET` labels 11px uppercase mono.

**References:** Maxime Heckel steppable inline demos; Linear "real product UI" panels; a Code4rena
profile for the KTHULHU/CodeHawks verifiable instinct.

**Key Constraint:** each live embed/surface has all **3 replay tiers** — live → labelled recorded run
(Worker/KV) → client-bundled recorded run — so a flagship **degrades to verifiably-real, never
broken** (BR-03, NFR-02, R-01). Effective success ≥ 95%.

**HARD survival constraints:**
1. **Exactly four** flagships, shown **operably**, not screenshots (FR-004). DevGuild/EcoGraph/Art of
   Zeta are **not** flagships (they may appear as supporting case-mentions only).
2. The Overmind pipeline is **steppable/operable and never the hero** (rejected #5); it is the sole
   place a pipeline appears.
3. **Not** a uniform card grid, **not** a 20-project wall (avoid-list) — curated, asymmetric depth.
4. Every embed **sandboxed + strict CSP**, degrades to a labelled recorded run (ADR-08, BR-03).
5. Every flagship number is a cleared `<Claim>` with its receipt; studio-origin figures carry the
   `AgileGypsy Labs / EcoGraph` provenance chip; Kointel/KTHULHU/CodeHawks deep-link to live external
   proof (FR-044/056/061).
6. Kointel's EU AI Act / compliance framing must stay accurate to the register — no invented
   regulatory claim.

---

## Product owner

**The job the visitor finishes:** A visitor sees four real systems and can operate at least one of them without leaving this site.

**Next needs:**

- ~~Two of four are still frames.~~ **✎ RESOLVED 2026-08-22, after two corrections in one day.** It first said *two frames, blocked on read-only API access*; then *one frame*, when KTHULHU turned out to need no API (`KthulhuCorpus.jsx`, over endpoints deployed and uncalled since W4); then **none**, when Kointel was re-diagnosed instead of escalated and its differentiator turned out to be a pure rule (`KointelGate.jsx`). **All four flagships now operate on this site.** Kept in full because the sequence is the lesson: the second gap was invisible until the first was corrected, since it had inherited the first one's verdict rather than being examined.
- ~~Nothing re-checks an owner-gated verdict.~~ **✎ THE RE-CHECK WAS DONE 2026-08-22, and it found something every time.** Row 23: half closed, not closed — the Google tag is off, Cloudflare Web Analytics is a separate setting still injecting. Row 25: **over-stated** — verified on-chain that the CTF vault is drainable and exposes every selector the flow needs, so it is attemptable today; the real ask shrank from "redeploy" to "re-fund after a capture". The second failure artifact: I had called it owner-blocked on John's material when it needed a real detector blind spot, which the detector had. Row 26 (Unlock/escrow funding) survives the challenge — money is money.
  **Deliberately NOT solved with a gate.** Four gates were added this week for things that went unchecked, and a fifth cannot work here: an owner-gated row is a *judgement*, and no script can re-open a judgement. What it needs is the standing habit of re-diagnosing before re-asking — the rule now recorded above for Kointel, applied to every row. **Score so far: five escalations challenged, four were wrong.**
- ~~Resolve the four-flagship framing.~~ **✎ RESOLVED 2026-08-22 by the MAS, not by the owner — and the question turned out to be built on my own false premise.** It had been narrowed to a presentation call: *"two cards for one product, or one flagship with two faces?"* The owner answered it in five words — **"no overmind is the engine"** — and the MAS pass (`mas/audits/OVERMIND_ATTRIBUTION_2026-08-22.md`) found the premise itself was wrong. They are **not one product**: Overmind is a governed agent-orchestration engine, KTHULHU is a smart-contract auditor, and the only thing they share is a word — a Worker named `kthulhu-overmind` inside KTHULHU's infrastructure. **Two cards, contents returned to their real owners.** Merging would have permanently encoded the error.
  **The register, this brief and the site's own hero all said so the whole time.** `Hero.jsx:246` reads *"Overmind GenAI engine"*; §3 above reads *"the platform beneath the products"*; the evidence pointer reads *"Overmind GenAI engine"*. Three rebuilds discriminated on the **name** instead. **Standing rule now recorded in CLAUDE.md: attribute on the evidence pointer, never on the name.**
- **CR-06 was unsupported and shipped anyway — the register needs the same re-check habit as the escalations.** `business_analysis/03_requirements.md:170` marked it `[REQUIRES_RESOLUTION]` ("client-supplied, reconcile"); it reached the register `cleared` without reconciliation and rendered on the homepage for a month. A grep of the source system for `13[ -]phase` returns zero hits — it has 6 phases and **13 products**. Reconciled to the source-verified figure under "understate rather than overstate". **The open ask is the owner's:** if a 13-phase pipeline exists in a subsystem outside that tree, say so and it goes back with a pointer. **The other 30 cleared claims have never had this check run against their source systems** — that sweep is the obvious next need, and it is buildable.
- **Two steppers, one page — watch the load.** KTHULHU's card now carries the corpus search, the embed *and* the pipeline. That is the right home for each, but it is the heaviest card on `/work`; if it reads as crowded, the pipeline is the piece that should collapse behind a disclosure, not the corpus.
- ~~Per-flagship liveness.~~ **✎ DONE 2026-08-22.** `/liveness` probes a CLOSED allowlist of origins Worker-side — the flagship products send no CORS headers, and a browser `no-cors` probe returns an opaque response whose status cannot be read, which would let a card print "up" for a 500. The badge reports **reachability only** ("Responding", never "working"), and our own probe failing renders "unknown" rather than putting a false outage on someone else's product. It probes only from the deployed origin: the console-error budget caught a mount-time fetch logging CORS errors on every local build.
