# Brief 08 — Mission Control (the operable hire flow) `/hire-me` ★ centerpiece

**Route:** `/hire-me` (+ the terminus of the hire spine and concierge tool-call) · **Hats:** all,
Founder/PM lead · **Phase:** P1 (configurator + book-a-call floor) / P2 (escrow + Unlock rails)
Implements `design/design-story.md`. The old one dead-ended; this one **converts**. It is an operable
**product surface**, not a marketing section — the one place the whole site points.

**Mood:** decisive, frictionless, confident. A mission-configuration console: set your objective,
answer a short assessment, and the loadout is recommended and priced — then a guaranteed way to
launch. Calm and fast; the density of the rest of the site relaxes into a clear forward path.

**Composition & Hierarchy:** a **4-step configurator** with a progress rail (FR-028) —
**objective → assessment → engagement → loadout** (fix the old label drift: step 3 = `ENGAGEMENT`,
not `PARAMETERS`):
1. **Objective** — what the visitor needs (audit / agentic build / delivery / advisory).
2. **Assessment** — a short set of questions that **actually informs** the recommendation (FR-029,
   no longer decorative).
3. **Engagement** — shape/scope of the engagement.
4. **Loadout** — the recommended **tier** with **prices traced to `retainer.json`** (FR-030, BR-12,
   never free-typed), plus indicative scope.
Then the **terminal action**, routed by ticket size, with **book-a-call as the guaranteed, default,
primary path** (OD-03): low-ticket fixed-price → **Unlock**; high-ticket retainer/project →
**escrow-on-acceptance**; **book-a-call available on every branch**. The **wallet connect button
mounts in-flow** (FR-031) only where a rail needs it.

**Key Moment:** the assessment answers **resolving into a recommended loadout + a real price** — the
console did real work on the visitor's input — immediately followed by a **book-a-call that always
completes**. The proof-first site earns the click here by having already proven itself upstream.

**Full product-state set (FR-035) — each an honest readout, none a dead-end (state machine, arch
§11):** connect-prompt · wrong-chain · checkout-loading · tx-pending · **success (receipt + next
steps)** · error/retry · empty. Every terminal path converges on a confirmed `Captured` state.

**Palette Accents:** cyan = the primary book-a-call CTA, the active step, focus, the success verdict;
per-hat accent tints the recommended loadout to the objective's discipline; amber = testnet/provision
labels; reserved failure color = a genuine tx error/revert (which still degrades to book-a-call).

**Animation Strategy:** step advance ≤200ms rise; the loadout recommendation resolves once (a real
computation on the assessment, not a fake reveal); tx-pending shows the real receipt wait; success
verdict settles then still. No count-up on prices, no confetti on success (a confirmation readout,
not a celebration).

**Spatial Layout:** a focused single-column console with the progress rail; loadout as a clear
recommended tier (not a 3-column pricing-table decoy grid); terminal actions as an honest choice with
book-a-call visually primary. Mobile: full-width steps, book-a-call always thumb-reachable.

**3D Elements:** none. **Glass Effects:** none.

**Typography:** step labels 11px uppercase mono; questions/prose sentence-case grotesk ~16px; **all
prices in mono tabular** with their `retainer.json` provenance; CTA labels 14px.

**References:** Linear onboarding/settings flow clarity; Stripe Checkout state honesty; Tailscale
plain-spoken pricing (no decoy anchoring).

**Key Constraint:** **zero dead-ends** — every state (disconnected, wrong-chain, not-provisioned,
sim-revert, script-fail) **degrades to the book-a-call floor**, which **completes with no wallet, no
chain, no live Worker** (client-queued to localStorage, retries to D1) — BR-11, OBJ-01, NFR-02c.

**HARD survival constraints:**
1. **Book-a-call is the guaranteed, default, primary** terminal action and **always completes**
   (OD-03, BR-11) — the floor beneath every branch.
2. **No dead-ends, no perpetually-disabled buttons** — an unprovisioned rail (escrow/Unlock)
   **hides and degrades to book-a-call**, never shows a dead control (FR-032/034, story anti-pattern
   #11).
3. **Simulate → write → wait** on escrow; **USDC 6-decimal BigInt**, never a float (FR-033, BR-04/06).
4. **Prices trace to `retainer.json`** — no hardcoded/unsourced price strings (FR-030, BR-12).
5. The assessment **informs the loadout** — step 2 is functional, not decorative (FR-029).
6. **Remove** the dead no-op "ENQUIRE" button and the `/test-agent` scaffold (FR-038); every request
   is **captured to D1 with a visible confirmation** (FR-037).
7. **No dark patterns** — no fake scarcity, countdowns, decoy tiers, or pre-checked upsells (story
   anti-pattern #11).

---

## Product owner

**The job the visitor finishes:** A visitor configures the engagement they actually want and reaches John — with the confirmation telling them the truth about what just happened.

**Next needs:**

- ~~Survive a reload.~~ **✎ DONE 2026-08-22.** `configuratorDraft.js` — sessionStorage, restored lazily so the first render already has the answers. Art 5(3) "strictly necessary" (the visitor's own in-progress form), the same basis as `engagementQueue`, and deliberately weaker: session not local, answer keys only, never contact or wallet, no identifier. Shaped on write AND on read, so an older build cannot reintroduce a dropped field.
- **The live agent rail.** ADR-R2-02 scopes a dedicated hardened reception agent for `t.me` hand-off; it is the named next capability for this surface and is owner-gated on a 24/7 host.
- ~~Explain what moves the price.~~ **✎ DONE 2026-08-22, with the premise corrected.** There is no figure: **zero of six tiers are `price_provisioned`**, so `priceLabel` honestly returns "sized on the call" and explaining a number that does not exist would be the opposite of the fix. What was unexplained is the RECOMMENDATION — and `resolveLoadout` already returned `rationale` and `engagementScores` that the UI rendered nowhere. `explainRecommendation()` now shows the per-answer derivation.
