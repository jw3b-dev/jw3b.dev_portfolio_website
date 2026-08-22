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
   graphs, verification is a first-class step."* Entry: the **steppable pipeline** (below). Proof:
   `13-phase · 51 modules`, `192,000+ corpus`, `1,345 tests · 100% coverage`.
4. **Kointel** (Engineer+Auditor+Founder) — a shipped compliance-first product; *"a build-failing CI
   gate that bans tx-signing from Web3 modules; carries an EU AI Act dossier."* Entry: **external
   verifiable deep-link** to kointel.co.za + a readout of the gate concept.

**The Overmind steppable pipeline (FR-006) — the ONE place the pipeline appears:** a horizontal
sequence of nodes joined by **validated edges**; the visitor **steps** it and each gate **visibly
passes its zero-trust check** (edge resolves cyan `VERIFIED`) before the next lights. It is
**operable/steppable, never a static org-chart, and never the hero** (rejected #5). Under
degrade/reduced-motion it shows a truthful pre-stepped state with the same verdicts.

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
- **Nothing re-checks an owner-gated verdict.** Two rows sat in front of John for a month asking for access neither needed, and only a direct challenge from him surfaced it. Rows 23, 25 and 26 have never been re-diagnosed since the day they were filed — an owner-gated item is a conclusion, and conclusions pointed at the person who can unblock them are the least likely to be re-opened.
- **Resolve the four-flagship framing.** KTHULHU and Overmind are the same product — the live auditor and its engine. That may be the right presentation, but it is currently an accident rather than a decision, and it is the owner's to make.
- **Per-flagship liveness.** No card says whether its system is up right now. A flagship that is down and silent about it is worse than one that says so.
