# Brief 02 — The Verified Claim (the proof primitive / verification signature)

**Route:** cross-cutting component, used on every surface · **Hats:** all · **Phase:** P0 (engine)
/ P1 (visual)
Implements `design/design-story.md §8`. This is the **signature** — the one element that makes the
whole concept ("reproduce, don't assert") cohere. Every implementer building any surface consumes
it; brief it once, precisely, here.

**Mood:** a readout a check just returned — quiet, exact, receipted. Never a marketing stat.

**Composition & Hierarchy:** a `<Claim id="…">` renders a **mono tabular figure/label** plus a
**verdict affordance** and a **receipt tap-target**. Three visible parts:
1. the value (mono, tabular-nums, high-contrast),
2. a small **verdict mark** — the verification state,
3. an inline **receipt** — one tap reveals the source: an evidence-register pointer, the CodeHawks
   #124 **public deep-link** (FR-044), a repo/product URL, or an `AgileGypsy Labs / EcoGraph`
   **provenance chip** for studio-origin figures (FR-061).
It renders **only if `status==='cleared'`** in the sealed register (BR-01); uncleared/forbidden →
renders nothing (or a cleared alternative). Two scales: an inline claim (in prose) and a
**readout-block** claim (HUD corner-tick panel, mono figure + 11px uppercase label + receipt).

**Key Moment:** tapping a number and seeing its **receipt** — `#124` opens the live Cyfrin/CodeHawks
profile; `+18 pts` reveals the `AgileGypsy Labs / EcoGraph` provenance chip. The number was never
asking to be believed.

**Verdict state grammar (the reusable signature):**
- `verified` — cyan mark; cleared + receipt present. The dominant state.
- `live` — cyan + the liveness tick; a value a live surface just produced.
- `recorded` — amber `RECORDED RUN · <date>` label; a replayed value (BR-03).
- `failed` — reserved failure color; used **only** on the radical-honesty surface + genuine errors.
- (there is no "pending/loading" theater — a real stream shows real partial tokens; a static claim
  is simply present.)

**Palette Accents:** cyan = verified/live; amber = recorded/provenance/disclosure; reserved failure
color = failed only; value text high-contrast; label + receipt muted gray.

**Animation Strategy:** verdict resolve ≤200ms once then still; **NO count-up tweening ever** — a
static claim is simply present; a live claim updates only from a real stream/heartbeat.

**Spatial Layout:** inline variant flows in text; readout-block variant is a hairline panel with
HUD corner-ticks, ≥ 44px tap target on the receipt, aligns to the tabular grid with siblings.

**3D Elements:** none. **Glass Effects:** none (flat hairline panel).

**Typography:** value in **mono tabular** (this is what makes it "look instrumented"); label 11px
uppercase letter-spaced; receipt 11–12px mono, cyan when it links out.

**References:** Code4rena/CodeHawks profile rows (verifiable record); Stripe's inline data
receipts; Anthropic figure blocks (density + citation).

**Key Constraint:** **no number renders unless it traces to a cleared register entry** — the
build-time claims-gate fails CI on any uncleared/forbidden claim (ADR-09, BR-01/02). The visual and
the gate are the same contract: if you can see a number, it has a receipt.

**HARD survival constraints:**
1. **Forbidden claims cannot render** — aggregate TVL, $ secured, "protocols secured", "50+ audits",
   PMP, PRINCE2-Practitioner, Neo4j-Certified-until-artifact (BR-02, FR-046). Not styled away —
   *absent*, blocked at build.
2. **Studio-origin figures carry the provenance chip** — GraphRAG +18 pts, 9,828 entities, 77k
   chunks, memory-miss >2×, any EcoGraph number wear `AgileGypsy Labs / EcoGraph` (FR-061, OD-05).
3. **CodeHawks #124 deep-links to the public contest from ≥ 2 surfaces** — never a self-asserted
   badge (FR-044, OBJ-03).
4. **No zero-value counters, ever** (the old `0 lines · 0 findings · 0 TVL` sin).
5. `recorded`/`live` states are **honest** — a replayed value is never shown as live (BR-03).
6. Never a decorative stat with no receipt; if it has no receipt, it is not a claim and does not use
   this component.

---

## Product owner

**The job the visitor finishes:** A visitor who doubts a number can find out where it came from, without leaving the page or taking John's word for it.

**Next needs:**

- **The register has no history.** An entry can be edited or re-cleared with no record of what it said before, so "this figure changed" is invisible to a reader and to review. The claims gate checks the current state only.
- ~~Nothing renders the blocklist inline.~~ **✎ DONE 2026-08-22** — `/evidence` now lists every refused claim with the reason it is refused. The trap this created is closed by a test: a REASON that trips its own pattern would fail the claims gate the moment the page rendered, so each `why` is scanned by the real scanner, and `FORBIDDEN_PATTERNS` is proven to be derived from the rules rather than a second hand-maintained list.
- ~~Make the evidence pointer reachable · distinguish attested from verified · a register view.~~ **✎ ALL DONE 2026-08-22** — `evidenceKind()` splits the two, `<Claim>` marks and exposes attested provenance, and `/evidence` lists all 31 with the verified/attested split stated up front.
