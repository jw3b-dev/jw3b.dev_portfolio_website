# Overmind attribution — the MAS pass on the four-flagship framing

**Asked of the MAS, not the owner.** The open item read: *"whether two cards for one product is the
right count, or whether they should merge into one flagship with two faces."* The MAS answer is that
**the question was built on a false premise I introduced**, and once the premise is removed the
framing decision is no longer a judgement call.

Owner's one-line correction, 2026-08-22: **"no overmind is the engine."** The register, the brief and
the site's own hero already agreed with him. Only the card disagreed.

---

## 1. codebase-auditor — the delta (objective, cited)

| # | Finding | Sev | Evidence |
|---|---|---|---|
| A1 | **The homepage contradicts itself on the same word.** `Hero.jsx:246` labels the system *"Overmind GenAI engine"* and renders CR-06. Three sections down `OvermindGraph.jsx:54` labels the same name *"Flagship · KTHULHU's two-lane audit engine"* and renders a four-phase **audit** pipeline. A visitor reading both is told two different things about one word. | **P1** | `src/components/hero/Hero.jsx:246-248` vs `src/components/flagships/OvermindGraph.jsx:54` |
| A2 | **The flagship carries none of its own evidence.** Brief 04 §3 names Overmind's proof as `13-phase · 51 modules`, `192,000+ corpus`, `1,345 tests · 100% coverage`. The card renders **zero** `<Claim>`s — breaching brief 04 HARD constraint 5 ("every flagship number is a cleared `<Claim>` with its receipt"). | **P1** | `OvermindGraph.jsx` (no `<Claim>` import); `design/briefs/04_flagship-systems.md:21-23,73` |
| A3 | **CR-06 is unsupported by its own source system.** The register clears *"13-phase pipeline"* against *"owner-attested — Overmind GenAI engine"*. A full grep of that engine for `13[ -]phase` returns **zero hits**. The engine has **6** lifecycle phases (`lifecycle.ts:20`, asserted verbatim by its own test), **13 products**, and **13 DSDM roles**. "13-phase" is a transcription of **13 products**. | **P0** | `src/data/evidence-register.json:80-85`; MB-agentic `lifecycle.ts:20`, `tests-workers/lifecycle.test.ts:12`, `.agents/knowledge/agilepm/PRODUCTS.md:7` |
| A4 | **The MAS flagged A3 and then cleared it anyway.** `business_analysis/03_requirements.md:170` marks CR-06 `[REQUIRES_RESOLUTION]` — *"Master report Risk 2 lists 'Overmind 13-phase' as client-supplied, reconcile"*. It reached the register as `"status": "cleared"` with no reconciliation, and renders on the live homepage. | **P0** | `mas/business_analysis/03_requirements.md:170`; `mas/REQUIREMENTS.md:270` |
| A5 | **The naming trap is in the filenames.** KTHULHU's audit pipeline lives in `src/lib/overmindPipeline.js`. Anyone opening that file to "check what Overmind does" reads KTHULHU's pipeline and is confirmed in the error. | **P2** | `src/lib/overmindPipeline.js` |

### Why this was missed three times

"Overmind" names **three** things, and every rebuild discriminated on the **name** instead of on the
**evidence pointer**:

1. **Overmind** — MB-agentic's governed agent-orchestration engine. *This is the one the site's
   claims are attested against* (`evidence_pointer: "owner-attested — Overmind GenAI engine"`).
2. **`kthulhu-overmind`** — a Cloudflare Worker inside KTHULHU's infrastructure, its cron
   orchestrator (`mas/audits/KTHULHU_INFRA_AUDIT.md:44`). A *namesake*, not the same system.
3. **`overmind.ts`** — the FSM signal-router module *within* (1).

Build v1 invented thirteen stage names — wrong names, and the number came from A3's bad claim.
Build v2 used MB-agentic's DSDM lifecycle and I **rejected it as "real phases, wrong system."**
That rejection was the actual error: v2 had the right system. Build v3 then "corrected" onto
`kthulhu-overmind` — namesake #2 — and shipped.

The decisive tiebreaker was in this repo the whole time and was never consulted: the evidence
register says *GenAI engine*, and CR-05's `1,345 tests` resolves exactly to MB-agentic's
`273 (npm test) + 1,072 (npm run test:do)`. One arithmetic check would have ended it at v1.

---

## 2. solutions-architect — the IA decision

**The premise fails.** "One product with two faces" assumed KTHULHU and Overmind are the same
product. They are not: Overmind is an agent-orchestration engine governed by AgilePM/DSDM; KTHULHU
is a smart-contract auditing product. They share a word inside KTHULHU's infra, nothing more.

| | Option A — merge to one flagship | Option B — two cards, contents returned to their owners |
|---|---|---|
| Truthfulness | Asserts a product relationship that does not exist | States what each system is |
| Brief 04 §3 | Violates it (§3 = "the platform beneath the products") | Satisfies it as written |
| Flagship count (FR-004) | Drops to three — needs a fourth | Stays exactly four |
| Recurrence risk | **Encodes the error that caused three rebuilds** | Removes it, incl. the filenames |
| Cost | Rewrite two cards + find a fourth flagship | Rewrite one card, move one component |

**Decision: Option B.** Justification is FR-004 (exactly four operable flagships) plus the brief's
own §3 — no NFR is stressed either way, so correctness decides it. **The relationship inverts**:
Overmind is not KTHULHU's engine; it is the engine, and KTHULHU is a separate product.

**Not claimed:** that KTHULHU *runs on* Overmind. `STATE-OF-BUILD.md §0` records KTHULHU's
orchestrator copy as a frozen pre-governance snapshot. Asserting that link would be a new invented
claim — exactly the failure being corrected.

**KTHULHU's two-lane pipeline is not deleted — it goes home.** Cloudflare orchestration + containerised
Foundry/Halmos/Medusa on self-hosted hardware is the strongest material on the page. It moves onto
the KTHULHU card, which is where it was always true.

---

## 3. art-director — what the Overmind card becomes

The brief already specifies it: *"the steppable pipeline … each gate visibly passes its zero-trust
check before the next lights."* The real engine supplies that literally, and better than the
invention did:

- **6 lifecycle phases**, each with an exit gate — `PRE_PROJECT → FEASIBILITY → FOUNDATIONS →
  EVOLUTIONARY → DEPLOYMENT → POST_PROJECT` (`lifecycle.ts:20`).
- **8 principle predicates** consulted by that gate — *"not advisory slogans here: each is a
  predicate over Overmind state"* (`principles.ts:5`).
- **3 of the 8 are EXCEPTION severity and HALT the gate**; 5 are COACHING and let it proceed
  (`gateAllowed = exceptions.length === 0`).

**The key moment changes, and improves.** The old card's gates could only pass. This one can be made
to **refuse** — a visitor steps into FOUNDATIONS with quality unmet and watches the gate stop. A
governance engine that only ever says yes is a diagram; one that halts is the claim.

**Honesty line, on the card:** the stepper runs the engine's real rule set, transcribed with
citations — it is not a live connection to a running fleet.

---

## 4. compliance-officer — claims disposition

- **CR-05** (`1,345 tests · 100% coverage`) — **holds exactly.** 273 + 1,072, terminal-verified by
  the owner (`STATE-OF-BUILD.md`). No change.
- **CR-04** (`192,000+ corpus`) — owner-attested, unaffected by this finding. No change.
- **CR-06** (`13-phase pipeline`) — **unsupported; must not render as stated.** Per the project's
  standing rule (*"when in doubt, understate rather than overstate"*) it is replaced with the
  source-verified figure and its citation, and downgraded from owner-attested to source-verified.
  The `51 non-test modules` half is a plausible dated count (60 today) and is dropped rather than
  re-asserted at a number the owner never gave.
  **Owner override available** — if a 13-phase pipeline exists in a subsystem not in this tree, say
  so and it goes back with a pointer.

---

## 5. The standing rule this produces

> **Attribute on the evidence pointer, never on the name.** Where two systems share a word, the
> register's `evidence_pointer` and `source_system` decide which one a surface is about — before any
> code is read. Where a number can be resolved by arithmetic against the source system, resolve it.

Enforced by `scripts/claims-lock.js` for value drift; the attribution half is a review habit, not a
script — a gate cannot tell which of two same-named systems a paragraph is about.

**Score: six escalations challenged, five were wrong.**
