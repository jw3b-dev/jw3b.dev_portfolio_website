# Existing App Audit — jw3b.dev (v2 redesign input)

**Auditor:** codebase-auditor · **Mode:** Static (scoped to interactive/app flows) · **Date:** 2026-08-15
**Purpose:** Give the design track (app-ui-engineer, full-stack-integrator, frontend-engineer) an accurate map of what the app *actually does today*, so Mission Control and the other in-app flows are rebuilt as first-class product experiences — not "re-skinned sections." This is **not** a security/compliance sweep.

**Read-only.** No `src/` file was modified. Every claim cites file + line. Live Worker routes were **not** probed (that is a live-audit, out of scope).

**Headline finding:** `REQUIREMENTS.md` (FR-4, lines 158/177) treats `/hire-me` as *"re-skin … simulate-first pattern unchanged … No functionality change."* That is **mismatched with the code**. Mission Control is a polished 4-step configurator that **terminates in a dead end**: every checkout CTA is either a disabled Unlock placeholder or a no-op button, and the on-chain `MilestoneEscrow` "hire flow" FR-4 references **is not wired into the UI at all** (the hook is orphaned). The owner's correction is correct: this must be designed as a product (configure → loadout → checkout), and the checkout half currently does not exist.

---

## 1. App-flow inventory

Routes from `src/App.jsx:43-49`; provider tree `Wagmi → ReactQuery → RainbowKit → Helmet → Router` (`App.jsx:26-37`). Status legend: **Built** / **Partial** / **Stubbed** / **Orphan** / **Missing**.

| # | Flow (route / component) | What it does | States handled | Status |
|---|---|---|---|---|
| 1 | **Mission Control** `/hire-me` · `MissionControl.jsx` (648 ln) | 4-step "Configure Protocol" wizard: objective → assessment → engagement → service loadout w/ checkout CTA | step machine (1-4), assessment-incomplete disables CTA, recommended/active card; **no** loading/success/error on checkout (there is no checkout) | **Partial** — wizard built & polished; checkout is a dead end |
| 2 | **AI Security Console** `/audit` · `audit/AuditConsole.jsx` | 3 streaming tools: Solidity **Auditor**, **Fuzz Harness** generator, **Tx Explainer** (decodes a Base tx client-side then narrates) | idle/empty-hint, loading spinner, streamed output, tx-hash validation error (`useTxExplainer.js:51`) | **Built** (client wiring complete; depends on live Worker) |
| 3 | **Capture the Vault** `/ctf` · `ctf/CtfChallenge.jsx` + `useCtf.js` | Real on-chain reentrancy CTF on Base Sepolia: deploy Attacker → `attack{value}` → Worker verifies drain → leaderboard | `idle/switching/deploying/attacking/verifying/success/error` (`useCtf.js:32`), not-connected, wrong-chain, vault-empty/armed, already-solved | **Built** (testnet-only; real wallet tx flow) |
| 4 | **Sentinel AI** ChatWidget (global) · `chat/ChatWidget.jsx` + `usePortfolioAgent.js` | Floating concierge: SSE streaming chat, voice STT (mic) + TTS playback, tag-protocol parsing (`[AUDIO]`/`[TOOL_CALL]`/`[RENDER_CARD]`), mood/amplitude viz | empty "AGENT STANDBY", loading dots, typewriter reveal, transcribing, voice on/off, error (console only) | **Built** (depends on live Worker) |
| 5 | **Wallet connect** · `wallet/ConnectButton.jsx` (RainbowKit custom) | Connect / wrong-network / account+chain pills | not-ready, disconnected, unsupported-chain, connected | **Built** — mounted in `Navbar.jsx:188`, `Hero.jsx:137`, `CtfChallenge.jsx:129` (**not** in Mission Control) |
| 6 | **Unlock paywall** · `pricing/UnlockPaywall.jsx` | Wraps `window.unlockProtocol.loadCheckoutModal`; script loaded in `index.html:69` | loading/locked/unlocked; **placeholder-guard disables the button** (`UnlockPaywall.jsx:51`) | **Stubbed** — only consumer is Mission Control step 4; all lock addresses are `0x...` |
| 7 | **MilestoneEscrow hire flow** · `hooks/useEscrow.js` + `config/abis/escrow.js` | Simulate→Write→Wait over deployed escrow `0xF75e…B543` (Base Sepolia); fund/approve/release/refund | reads gated on address; `send()` simulates then writes | **Orphan** — **zero importers**; not wired to any component |
| 8 | **XMTP E2E messaging** | Referenced as a shipped feature (CLAUDE.md stack) and a retainer perk ("Priority Support channel in XMTP", `retainer.json:11`) | — | **Missing** — no `@xmtp` dep in `package.json`, no `useXMTP` hook, no component |
| 9 | `/test-agent` · `AgentTest.jsx` | Dev scaffold ("Antigravity Agent Active") | — | **Orphan** — remove before ship |

**Orphan-code note:** `useEscrow.js` (item 7) and `AgentTest.jsx` (item 9) map to no live UI requirement. Escrow is real backend/contract work with no front door; AgentTest is a stray route in `App.jsx:48`.

---

## 2. Mission Control flow map (the centerpiece)

Single component, client-only state (`useState`): `step`, `objective`, `assessment`, `engagement` (`MissionControl.jsx:201-205`). No wallet, no router params, no persistence. Signature interaction = `FlippableCard` (3D tilt-on-hover + click-to-flip, `MissionControl.jsx:48-180`).

**Persistent header** (`:294-336`):
- Badge **"Mission Control Active"**; H1 **"Configure Protocol"**.
- Sub: **"Initialize your engagement parameters. Select your objective, assess tactical requirements, and generate a custom service loadout."**
- Progress rail labels: **`01 OBJECTIVE` → `02 ASSESSMENT` → `03 PARAMETERS` → `04 LOADOUT`**. ⚠️ Label drift: step 3's content is the **engagement** choice, shown as **"PARAMETERS"** (the code comment calls it ENGAGEMENT, `:462`).

**Step 1 — OBJECTIVE** (`:342-388`): three cards, each `setObjective(id); setAssessment({}); setStep(2)`:
- **"SECURE"** (`security`, purple) — *"Deploy advanced defensive measures. Fortify protocols against sovereign threats, economic exploits, and nation-state vectors."*
- **"BUILD"** (`engineering`, cyan) — *"Architect the new internet. Severe-grade decentralized infrastructure, autonomous agents…"*
- **"LEAD"** (`pm`, green) — *"Command and control. Orchestrate distributed engineering teams…"*
- CTA per card: **"Initiate →"**. (Objective cards pass no `backContent`, so they don't flip — the "LEARN MORE" worry in the stale comment at `:383-384` is moot; the render is guarded at `:132`.)

**Step 2 — ASSESSMENT** (`:391-460`): "BACK TO OBJECTIVE"; renders `ASSESSMENT_DATA[objective]` (`:183-199`) — 3 questions × 3 options each, stored as `assessment[q_id]=answer`:
- security: **"Attack Surface"** [Smart Contracts / Frontend / DNS / Full Protocol] · **"Economic Value (TVL)"** [Seed <$1M / Growth $1M-$10M / Whale $50M+] · **"Code Complexity"** [Standard ERCs / Novel Mechanisms / Forked/Modified]
- engineering: **"Development Phase"** · **"Critical Constraint"** · **"Architecture"**
- pm: **"Team Topology"** · **"Methodology"** · **"Governance"**
- CTA **"CONFIRM INTEL →"** disabled until all three answered (`isAssessmentComplete`, `:227-230`, `:442-443`).
- ⚠️ **The assessment answers are collected but never used to compute anything.** They do not change the loadout or price; they are only forwarded as `metadata.assessment` to `UnlockPaywall` at `:619`. "Assess tactical requirements" is, functionally, decorative today.

**Step 3 — ENGAGEMENT (shown as "PARAMETERS")** (`:463-549`): "BACK TO ASSESSMENT"; two flippable cards, each `setEngagement(id); setStep(4)`:
- **"TACTICAL OPS"** — subtitle **"One-Off Projects"** (`project`, orange) — *"Surgical intervention. Fixed-scope deliverables… audits, MVPs, and specific module implementations."*
- **"CORE INTEGRATION"** — subtitle **"Monthly Retainer"** (`retainer`, blue) — *"Strategic embedding. I integrate directly into your core team as a force multiplier…"*
- Card back = **"// Deployment Specs"** with generic bullets incl. **"E2E encrypted secure channel"** (XMTP claim — not built) + **"SELECT THIS OPS"** button.

**Step 4 — LOADOUT** (`:552-640`): "ADJUST PARAMETERS"; `loadoutPackages = SERVICE_PACKAGES[objective][engagement]` (`:218-219`) — an array of **3 tiers**. Each renders a `FlippableCard`:
- Front: `name`, `price` (**static string**), `period`, `description`, `features[]` ✓. `recommended` tier gets pulse dot + lift (`-mt-4`) + colored price (`:579-597`).
- Back (`getBackContent`, `:233-268`): **"TECHNICAL SPECS"** — a **hardcoded** stack list keyed only by objective (e.g. security → *Foundry/Echidna, Slither/Aderyn, Manual Review*), "Ideal For" = `pkg.description`, "BEST VALUE" badge if recommended.
- **Checkout CTA** (`:612-634`):
  - if `PACKAGE_TO_LOCK[pkg.name]` exists → `<UnlockPaywall lockAddress={SERVICE_LOCKS[…]} metadata={{objective, engagement, package, assessment}} />`
  - else → **"ENQUIRE →"** button **with no `onClick`** (`:622-634`) — a **dead button**.

**How the loadout + price are computed:** they are **not computed** — pure lookup. `SERVICE_PACKAGES[objective][engagement]` returns fixed tiers with hardcoded price strings (`constants/index.js:198-377`, e.g. `"$500"`, `"$2,500+"`, `"$12,500"`). Assessment inputs never enter the calculation. "Generate a custom service loadout" = select one of six static tier-triples.

---

## 3. Checkout / engagement reality — how a visitor actually "hires" today

**Answer: they can't complete anything on-chain from Mission Control.** Trace of every terminal CTA:

1. **Unlock lock resolution** (`config/contracts.js`): `PACKAGE_TO_LOCK` (`:20-35`) maps only **11 of the ~20** package names to a lock ID, and every `SERVICE_LOCKS` value is the literal **`"0x..."`** placeholder (`:5-14`). `UnlockPaywall` flags any sub-42-char address as placeholder (`UnlockPaywall.jsx:51`) and renders a **disabled "Lock Pending"** button (`:60-67`). → Mapped packages = purchasable **never**, today.
2. **Unmapped packages** ("Standard Audit", "Enterprise Verification", "Smart Contract Module", "dApp MVP", "Full Protocol Build", "Protocol Launch", "DAO Governance Setup") → the **dead "ENQUIRE"** button. Clicking does nothing (no handler, no mailto, no nav).
3. **MilestoneEscrow is absent from the flow.** `useEscrow.js` (correct Simulate→Write→Wait, `:33-40`) is imported by **nothing** (grep: 0 hits outside its own file). Mission Control imports `UnlockPaywall`, `SERVICE_LOCKS`, `PACKAGE_TO_LOCK` — **not** `useEscrow`, **not** `ConnectButton`, **not** any wagmi hook. A visitor is **never even prompted to connect a wallet** in `/hire-me`.

**Gaps: aspirational copy vs. working flow**

| Copy / claim | Location | Reality |
|---|---|---|
| "generate a **custom** service loadout" | `MissionControl.jsx:323` | Static lookup; assessment does not customize it |
| "**assess** tactical requirements" (Step 2) | header + `:391-460` | Answers collected, then unused except as Unlock metadata |
| `/hire-me` = "on-chain **MilestoneEscrow** flow" | `REQUIREMENTS.md:83,144,158` | No escrow code in the component; hook orphaned |
| "**E2E encrypted secure channel**" / "Priority Support channel in **XMTP**" | `MissionControl.jsx:497`; `retainer.json:11` | XMTP not built (no dep/hook/component) |
| "Initialize Checkout" (Unlock) | `UnlockPaywall.jsx:66` | Blocked — all locks are `0x...` → "Lock Pending" |
| "ENQUIRE" CTA | `MissionControl.jsx:631` | No-op button |

**Two disjoint, non-functional payment mechanisms exist and neither is reachable end-to-end:** Unlock membership (placeholder locks, Base mainnet `network: 8453` in `UnlockPaywall.jsx:44`) and MilestoneEscrow USDC (Base **Sepolia testnet** demo, `config/wagmi.js:17-24`; real per-client escrows deploy at deal-close per the file comment). The site currently has **no path** by which money or a signed engagement changes hands.

---

## 4. Design-track recommendations

Rebuild `/hire-me` as a **product** with a real terminal state, not a marketing page. Preserve the strong parts; supply the missing back half.

**Preserve (do not lose in the re-skin):**
- The 4-step **configurator state machine** (objective → assessment → engagement → loadout) and the progress rail — it's a genuine wizard.
- The `FlippableCard` 3D tilt/flip signature interaction and the "recommended tier" emphasis.
- Real content: `SERVICE_PACKAGES` (6 tier-triples), the assessment question bank, the persona/color system (purple/cyan/green = SECURE/BUILD/LEAD; the 4-hat rule from CLAUDE.md).
- The genuinely-built adjacent flows — `/audit` console, `/ctf`, Sentinel ChatWidget — as first-class "operable proof," not decoration.

**Elevate / fix (the product gap):**
1. **Make the assessment mean something.** Either feed answers into the loadout/price (recommended-tier logic, scope hints, an indicative quote) or reframe Step 2 honestly as "brief" intake that pre-fills the engagement request. Today it's a dead-weight funnel step.
2. **Give Step 4 a real terminal action.** Replace the dead "ENQUIRE" and the perpetually-disabled "Lock Pending" with one coherent, wired CTA (see payment decision below). Add the product states the wizard currently lacks: connect-wallet prompt, checkout loading, tx pending, success (receipt/next-steps), and error/retry.
3. **Fix the label drift** ("03 PARAMETERS" vs. engagement) and **remove `/test-agent`** before ship.
4. **Decide XMTP:** either build it (treat as a migration to `@xmtp/browser-sdk` per CLAUDE.md, a project not a bump) or **stop advertising** "E2E encrypted channel" / "Priority Support in XMTP" until it exists.

**MAS role ownership:**

| Work | Owner |
|---|---|
| Configurator **wizard + checkout state machine** — step flow, assessment→loadout logic, the full loading/success/error/empty set, tier gating & upgrade prompts, the terminal "engagement" screen | **app-ui-engineer** |
| **Wallet + escrow/paywall wiring** — mount ConnectButton in-flow, wire `useEscrow` Simulate→Write→Wait (or Unlock real locks), tx lifecycle via `useWaitForTransactionReceipt`, testnet↔mainnet honesty | **full-stack-integrator** |
| Marketing surfaces (`/` Home, Hero, Services, Projects, Footer) restyle to pillar tokens | **frontend-engineer** |
| `/audit`, `/ctf`, ChatWidget visual restyle to new tokens (behavior unchanged) | **frontend-engineer** (UI) + **full-stack-integrator** (any wiring) |

**Payment-backend flag (product decision needed before build):**
- The current on-chain machinery is a **Base Sepolia testnet demo**, and real escrows are described as **deployed at deal-close** (`config/wagmi.js:14-16`) — i.e. a **sales-assisted** flow, not instant self-serve e-commerce. High-ticket retainers ($6k–$12.5k) and open-ended project scopes ("$50,000+") argue **against** an instant crypto checkout and **for** a "request engagement / book a call / generate quote" terminal step feeding a real backend (or an escrow-deployed-on-acceptance flow).
- If instant self-serve is wanted for the **low-ticket, fixed-price** tiers only (Security Review Lite $500, Sprint Facilitation $2,500), the **Unlock** path is closest — but it needs **real lock addresses deployed on Base mainnet** to replace the `0x...` placeholders in `config/contracts.js` and `retainer.json`.
- Either way this is **not** wired today. Choosing one coherent path (escrow-on-acceptance vs. Unlock membership vs. off-chain quote/booking + a real payment/CRM backend) is the single biggest decision the redesign must make for Mission Control to become a real product.
