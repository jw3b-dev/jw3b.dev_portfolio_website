# 02 — System Context & Data Flow — jw3b.dev v2 (MAS Phase 3)

**Role:** solutions-architect · **Date:** 2026-08-16 · **Status:** DRAFT (design)
**Reads from:** doc `01` (NFR baseline). Diagrams are Mermaid, protocols annotated.

---

## 1. Architectural pattern (chosen, NFR-justified)

**Pattern: edge-serverless SPA + single edge Worker, stateless request path, D1/KV/R2 for state, with a
3-tier replay/fallback spine.** Justified by:

- **NFR-01 (LCP ≤ 2.5s, first-token ≤ 2–3s):** edge compute + SSE streaming + a prerendered hero shell.
- **NFR-02 (≥95% effective success, 0 hard-broken):** stateless Worker scales horizontally; the replay
  tiers (§7) decouple *availability* from *live upstreams* (Anthropic, RPC).
- **NFR-08 (cost bound):** one Worker, right-sized models per route, AI-Gateway + per-IP rate limits.
- **Fixed stack:** the platform *is* Cloudflare + a React SPA — the pattern is entailed, not chosen. The
  design decisions are *within* it (docs 03 ADRs).

This is **not** microservices (one deployable Worker; splitting adds ops cost with no NFR payoff at this
scale) and **not** a stateful monolith (no origin server; state lives in managed edge stores).

---

## 2. C4 Level 1 — System context

```mermaid
graph TB
    subgraph Actors
      V["Building Founder/CTO<br/>(primary visitor S2)"]
      B["Security Buyer / Recruiter<br/>(S3 / S4)"]
      J["John Wellard<br/>(owner / sole deployer S1)"]
    end

    SYS["jw3b.dev v2<br/>Portfolio you OPERATE<br/>(SPA + edge Worker)"]

    subgraph "External systems"
      GW["Anthropic<br/>via Cloudflare AI Gateway"]
      WAI["Cloudflare Workers AI<br/>(Llama fallback · Whisper STT · Aura TTS)"]
      RPC["Base / Base Sepolia<br/>JSON-RPC"]
      UNL["Unlock Protocol<br/>(checkout script + iframe)"]
      XMTP["XMTP network<br/>(MLS, E2E)"]
      KTH["KTHULHU<br/>(kthulhu.co live app)"]
      AG["agilegypsy.com<br/>(studio cross-link)"]
      SCH["Book-a-call scheduler<br/>(owner-provisioned)"]
    end

    V -->|HTTPS| SYS
    B -->|HTTPS| SYS
    J -->|"deploys (out of band, John-owned)"| SYS

    SYS -->|"HTTPS/SSE (AI reasoning)"| GW
    SYS -->|"binding (fallback/STT/TTS/embeddings)"| WAI
    SYS -->|"JSON-RPC read (CTF verify)"| RPC
    V -->|"JSON-RPC write (wallet, viem)"| RPC
    V -->|"iframe/postMessage (checkout)"| UNL
    V -->|"MLS over WS/HTTPS (E2E chat, P3)"| XMTP
    V -->|"sandboxed iframe (embed)"| KTH
    SYS -->|"HTTPS handoff (engagement lead)"| SCH
    SYS -.->|"rel=me / JSON-LD sameAs"| AG
```

**Protocol/data notes:** all AI reasoning is **server-side via the Worker → AI Gateway** (no browser→
Anthropic; NFR-04 secrets). Wallet **writes** are client-side (viem, user-signed); the Worker only **reads**
chain state for CTF verification. Anthropic is never called directly — always through the AI Gateway
(cost/rate/observability choke point, NFR-08).

---

## 3. C4 Level 2 — Containers

```mermaid
graph TB
    subgraph Browser["Browser — React 19 SPA (Vite)"]
      SHELL["Prerendered hero shell<br/>+ critical CSS (LCP element)"]
      ROUTER["Router + Suspense (lazy routes)<br/>/ · /audit · /ctf · /hire-me · /messages · /privacy"]
      PROV["Provider tree<br/>Wagmi → Query → RainbowKit → Helmet → Router"]
      CHAT["Concierge ChatWidget (global)<br/>SSE client + tag parser"]
      MC["Mission Control<br/>checkout state machine"]
      WALLET["wagmi2/viem2/RainbowKit<br/>simulate→write→wait"]
      CLAIM["Runtime Claim gate<br/>(reads sealed register)"]
      REPLAY2["Tier-2 client replay assets<br/>(bundled recorded runs)"]
      XC["XMTP client<br/>(@xmtp/browser-sdk, P3, flagged)"]
    end

    subgraph Edge["Cloudflare edge"]
      W["Worker: portfolio-agent v2<br/>routes · rate-limit · tag-protocol owner · Tier-1 replay"]
      D1[("D1<br/>analytics · leaderboard · engagements")]
      KV[("KV<br/>replay transcripts")]
      R2[("R2<br/>replay media / recorded TTS")]
    end

    subgraph Upstreams
      GW["AI Gateway → Anthropic<br/>(Haiku concierge · Sonnet/Opus audit)"]
      WAI["Workers AI<br/>Llama · Whisper · Aura · embeddings"]
      RPC["Base / Base Sepolia RPC"]
    end

    subgraph Chain["On-chain (Foundry-authored)"]
      ESC["MilestoneEscrow<br/>USDC 6-dec, Base"]
      VAULT["ReentrantVault + Attacker<br/>Base Sepolia (CTF)"]
    end

    subgraph BuildTime["Build / CI (John-gated deploy)"]
      REG["Evidence register (repo file)<br/>ClaimRecord DE-07 + Credential DE-08"]
      GATE["Claims-gate validator<br/>(fails CI on uncleared claim)"]
    end

    SHELL --> ROUTER --> PROV
    PROV --> CHAT & MC & WALLET & CLAIM
    CHAT -->|"POST / (SSE)"| W
    MC -->|"POST /engagement · /book-a-call (JSON)"| W
    MC --> WALLET
    WALLET -->|"simulate/write/wait (JSON-RPC)"| ESC
    WALLET -->|"deploy Attacker · attack{value}"| VAULT
    XC -->|"MLS"| RPC

    W -->|"reasoning (HTTPS/SSE)"| GW
    W -->|"fallback/STT/TTS (binding)"| WAI
    W -->|"CTF verify (RPC read)"| RPC
    W --> D1 & KV & R2

    CLAIM -. "reads sealed" .-> REG
    REG --> GATE
    REPLAY2 -. "served on Worker-unreachable" .-> CHAT
```

**Container responsibilities**

| Container | Owns | Binding/protocol |
|---|---|---|
| **SPA** | routes, providers, ChatWidget, Mission Control state machine, wallet flows, runtime Claim gate, **Tier-2 bundled replay** | HTTPS/SSE to Worker; JSON-RPC to chain; iframe to Unlock/KTHULHU |
| **Worker** | route contracts, **server-owned tag protocol**, rate-limit, model routing, **Tier-1 replay serving**, D1/KV/R2 access | Cloudflare bindings (`AI`,`DB`,`KV`,`R2`) + secrets |
| **D1** | analytics (conversations/messages/audit_runs), CTF leaderboard, **engagement_requests**, rate_limits, escrow index | Worker binding `DB` |
| **KV** | recorded-run **transcripts** (concierge/audit/tx/CTF), read-mostly, edge-global | Worker binding |
| **R2** | recorded **media** (sample TTS audio, any recorded-run video) | Worker binding |
| **AI Gateway** | the single choke point in front of Anthropic — rate-limit, caching, cost observability | HTTPS |
| **Evidence register + gate** | the claims source of truth; **build-time** enforcement | repo file + CI |

---

## 4. Frontend route tree & provider order

```mermaid
graph LR
    ROOT["<main> persistent layout<br/>+ ≤1-click hire spine (FR-002)<br/>+ global ChatWidget"]
    ROOT --> R0["/  (marquee) — operable hero · 4 flagships · delivery anchor · failures surface"]
    ROOT --> R1["/audit — AI security console"]
    ROOT --> R2["/ctf — Capture the Vault"]
    ROOT --> R3["/hire-me — Mission Control ★"]
    ROOT --> R4["/messages — XMTP (P3, flagged)"]
    ROOT --> R5["/privacy — privacy notice"]
    ROOT --> R6["/thesis/* — explainer pages (COULD)"]
```

- **Provider order (FIXED):** `WagmiProvider → QueryClientProvider → RainbowKitProvider →
  HelmetProvider → RouterProvider`. Routes are **lazy-loaded behind `<Suspense>`**; heavy Web3 + R3F
  chunks are code-split out of the initial bundle and mounted **after** first paint (doc 03 §6, NFR-01).
- **Design-token hookpoint:** brand-architect (P0) publishes a CSS-custom-property token layer on `:root`
  (distinct accent per NFR-09); `tailwind.config.js theme.extend` reads those variables so components use
  **semantic token classes only** (zero raw hex outside the token layer). This is the single seam the
  design track owns; the architecture just guarantees it exists before any surface renders.
- **Claims-gate runtime:** a `<Claim id="…">` component resolves from the **sealed register** and renders
  the value only if `status==='cleared'`; otherwise it renders nothing or a cleared alternative (BR-01).

---

## 5. Sequence — (a) Concierge SSE stream + tag-protocol parse + fallback

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor
    participant W as ChatWidget (SPA)
    participant K as Worker POST /
    participant RL as D1 rate_limits
    participant GW as AI Gateway → Anthropic (Haiku)
    participant LL as Workers AI (Llama)
    participant KV as KV replay
    participant D1 as D1 messages

    U->>W: type message
    W->>K: POST / {messages[], conversationId, walletAddress?}
    K->>RL: check per-IP fixed window
    alt over limit
        RL-->>K: blocked
        K-->>W: SSE data:{response:"[AUDIO:…] rate-limited, book a call"} + [DONE]
    else allowed
        K->>K: input guard (length cap, banned-keyword \b match)
        K->>D1: INSERT user msg (PII-minimized, tags stripped)
        K->>GW: stream (system=curated evidence KB, maxTokens cap)
        alt Anthropic OK
            GW-->>K: token deltas
            K-->>W: SSE data:{response:"…"} frames
        else Anthropic down/timeout
            K->>LL: fallback stream (same system prompt)
            alt Llama OK
                LL-->>K: token deltas
                K-->>W: SSE frames (transparent)
            else both AI down
                K->>KV: GET recorded-run(concierge, intent)
                KV-->>K: recorded transcript
                K-->>W: SSE frames LABELLED "recorded run"
            end
        end
        K-->>W: data:[DONE]
    end
    W->>W: parse+strip [AUDIO:"…"] / [TOOL_CALL:{…}] / [RENDER_CARD:"…"]
    W->>U: render markdown · fire tool-call (open Mission Control) · speak audio
    Note over W,K: If Worker itself unreachable → SPA serves Tier-2 bundled<br/>recorded run + "offline — book a call" (BR-03)
```

**Tag-protocol contract (server-owned, FR-052/017 — grounded in the live Worker):**
`[AUDIO: "…"]` (leading spoken summary, TTS) · `[TOOL_CALL: {json}]` (e.g. `{"action":"openModal","type":"pricing"}`)
· `[RENDER_CARD: "name"]` (e.g. `pricing_tier_card`). **SSE frame shape:** `data: {"response":"…"}\n\n`
terminated by `data: [DONE]\n\n`. The frontend parser strips tags before rendering; the **same regex
contract lives in one shared module** consumed by the widget and asserted in tests so Worker↔parser never
drift (doc 03 §3).

---

## 6. Sequence — (b) `/audit` Solidity-audit stream (heuristic-first + replay)

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor
    participant A as AuditConsole (SPA)
    participant K as Worker POST /audit
    participant H as auditHeuristics (local, in-Worker)
    participant GW as AI Gateway → Anthropic (Sonnet/Opus)
    participant KV as KV replay

    U->>A: paste Solidity source
    A->>A: validate (size cap, non-empty) — FR-013
    A->>K: POST /audit {source}
    K->>K: rate-limit + size guard
    K->>H: regex/line first-pass (deterministic)
    H-->>K: baseline findings (severity table)
    K-->>A: SSE frames: heuristic findings (<300ms)
    alt Anthropic OK
        K->>GW: stream narrative + deeper findings (Markdown, no [AUDIO])
        GW-->>K: token deltas
        K-->>A: SSE frames (AI narrative appended)
    else Anthropic down/timeout
        K->>KV: GET recorded-run(audit, sample)
        KV-->>K: recorded findings
        K-->>A: SSE frames LABELLED "recorded run" (heuristics still real)
    end
    K-->>A: data:[DONE]
    A->>U: render findings + AI-assisted-first-pass DISCLAIMER (FR-014/BR-10)
```

**Why heuristic-first matters (NFR-02):** the deterministic `auditHeuristics` pass runs **inside the
Worker with no upstream dependency**, so `/audit` returns *real* findings even when Anthropic is down — the
recorded run only stands in for the *AI narrative*, never for the whole surface. `/fuzz` and `/tx-explain`
follow the same shape (Claude primary → Workers-AI/KV fallback); `/tx-explain` decodes the tx client-side
first, so a Worker outage still shows the decoded calldata.

---

## 7. The 3-tier replay / fallback architecture (the R-01 existential mitigation)

This is the spine that makes NFR-02 (≥95% effective success, 0 hard-broken) reachable. **Every** live
surface (concierge, `/audit` tools, CTF, KTHULHU embed) implements all three tiers.

```mermaid
graph TB
    LIVE["Tier 0 — LIVE<br/>real upstream (Anthropic / RPC / KTHULHU)"]
    T1["Tier 1 — WORKER REPLAY<br/>Worker up, upstream down/timeout →<br/>serve recorded run from KV/R2, LABELLED"]
    T2["Tier 2 — CLIENT REPLAY<br/>Worker unreachable →<br/>SPA serves bundled recorded run, LABELLED<br/>+ book-a-call queued to localStorage"]
    LIVE -->|"upstream fail / timeout"| T1
    T1 -->|"Worker/edge unreachable"| T2
    T2 -->|"nothing loads = total CF edge outage"| DEBT["Accepted debt:<br/>sole-vendor SPOF (doc 05)"]
```

| Tier | Trigger | Where the artifact lives | Storage decision |
|---|---|---|---|
| **0 Live** | normal | upstream | — |
| **1 Worker replay** | upstream (Anthropic/RPC) down or exceeds timeout, Worker still up | **KV** (JSON/NDJSON transcripts) + **R2** (recorded TTS audio / any video) | ADR-01 (doc 03) |
| **2 Client replay** | Worker/edge unreachable from the browser | **bundled in the SPA build** (imported JSON + asset) — independent failure domain | ADR-01 |

**Labelling invariant (BR-03 + radical-honesty pillar):** a recorded run is **always** visibly labelled
"recorded run" with its capture date; it must never masquerade as live. **Book-a-call floor (BR-11):** the
engagement-capture path uses a client-side queue (localStorage) so a submission **always completes** and
retries to `POST /engagement` when connectivity returns — it depends on no wallet, no chain, and no live
Worker. This is what lets the design survive the red-team's 4-hour-outage challenge (doc 05 §red-team #4).

---

## 8. Sequence — (c) Mission Control book-a-call capture → D1 (no wallet/chain)

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor
    participant MC as Mission Control (SPA)
    participant Q as localStorage queue
    participant K as Worker POST /engagement
    participant D1 as D1 engagement_requests

    U->>MC: objective → assessment → engagement → loadout (tier)
    MC->>MC: assessment informs recommended tier + indicative scope (FR-029)
    MC->>MC: price copied from retainer.json (FR-030/BR-12) — never free-typed
    U->>MC: choose "Book a call" (always-available floor)
    U->>MC: enter contact (email/handle, required) [+ optional wallet]
    MC->>Q: enqueue EngagementRequest {DE-01 fields, route=book_a_call, status=submitted}
    MC->>U: OPTIMISTIC confirmation (request received)
    loop until acked
        Q->>K: POST /engagement (retry w/ backoff)
        alt Worker reachable
            K->>K: validate (contact format, tier∈catalog, wallet 0x42 if present)
            K->>D1: INSERT engagement_requests
            K-->>Q: 200 {id}
            Q->>Q: dequeue
            K-->>MC: (optional) scheduler handoff link (if provisioned)
        else Worker down
            Q->>Q: keep queued, retry later (BR-11 — still "completed" to the user)
        end
    end
```

**No wallet, no chain, no LLM** are on this path — that is the guarantee (BR-11, NFR-02c). The scheduler
handoff (owner-provisioned) is a *bonus* on success, never a dependency.

---

## 9. Sequence — (d) On-chain escrow: simulate → write → wait (USDC 6-dec, Base)

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor (wallet)
    participant MC as Mission Control (SPA)
    participant WK as wagmi/viem hooks
    participant ESC as MilestoneEscrow (Base)
    participant K as Worker POST /engagement

    Note over MC: high-ticket route (retainer/project) → escrow-on-acceptance branch
    MC->>WK: ensure connected + chain==Base (else prompt switch)
    MC->>WK: amount = parseUnits(price, 6)  // USDC 6-dec BigInt (BR-06)
    WK->>ESC: useSimulateContract(fund, {amount})   // BR-04 GATE
    alt simulate reverts
        ESC-->>WK: revert reason
        WK-->>MC: surface revert; block write; offer book-a-call
    else simulate ok
        WK->>ESC: writeContract(fund)  // user signs
        ESC-->>WK: tx hash
        WK->>ESC: useWaitForTransactionReceipt(hash)
        ESC-->>WK: receipt (funded)
        WK-->>MC: SUCCESS state (receipt + next steps) — FR-035
        MC->>K: POST /engagement {route=escrow, status=escrow_funded, tx_hash, wallet}
        K->>K: mirror to D1 escrow index
    end
    Note over MC,ESC: escrow contract deploy/fund is OWNER-PROVISIONED →<br/>feature-flagged; until live, this branch DEGRADES to book-a-call (FR-032/034)
```

**No `writeContract` is ever reachable without a preceding successful `useSimulateContract`** — enforced as
a code-review + web3-gate invariant (BR-04, NFR-04). Testnet vs mainnet is labelled honestly on every
on-chain surface (BR-09).

---

## 10. Sequence — (e) CTF exploit → verify → leaderboard (Base Sepolia)

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor (wallet)
    participant CTF as CtfChallenge (SPA)
    participant WK as wagmi/viem
    participant VA as ReentrantVault (Base Sepolia, deployed)
    participant AT as Attacker (deployed by visitor)
    participant K as Worker POST /ctf/verify
    participant RPC as Base Sepolia RPC
    participant D1 as D1 ctf_solves

    CTF->>CTF: LABEL "Base Sepolia testnet · no real funds" (BR-09/FR-024)
    U->>WK: connect + switch to Base Sepolia (wrong-chain guarded)
    WK->>VA: useSimulateContract(deploy Attacker)  // BR-04
    WK->>AT: deploy Attacker (write)
    WK->>AT: useSimulate → attack{value}  // reentrancy drains vault
    AT-->>VA: reentrant withdraw loop
    WK->>K: POST /ctf/verify {address, attacker, txHash}
    K->>RPC: read vault balance delta / drain event
    alt drain confirmed & not already solved
        K->>D1: INSERT ctf_solves (address PK, tx_hash UNIQUE, block, ts)
        K-->>CTF: success + rank
    else already solved / no drain
        K-->>CTF: idempotent status (already-solved / vault-empty)
    end
    Note over CTF,K: chain/Worker down → serve recorded solve (Tier-1 KV / Tier-2 client), LABELLED (FR-026)
```

---

## 11. Mission Control checkout state machine (all 3 rails, book-a-call floor)

```mermaid
stateDiagram-v2
    [*] --> Configuring
    Configuring --> Loadout: objective, assessment, engagement (step-3 label = ENGAGEMENT not PARAMETERS, FR-028)
    Loadout --> Routing: tier chosen (price from retainer.json, BR-12)

    Routing --> BookACall: DEFAULT / PRIMARY floor (always available, BR-11)
    Routing --> UnlockLockCheck: low-ticket fixed-price
    Routing --> EscrowWalletCheck: high-ticket retainer/project

    UnlockLockCheck --> UnlockCheckout: real lock deployed (42-char)
    UnlockLockCheck --> BookACall: placeholder/undeployed (FR-034, hide, no dead button)
    UnlockCheckout --> Owned: membership key minted
    UnlockCheckout --> BookACall: script/checkout fail (degrade)

    EscrowWalletCheck --> Disconnected: no wallet
    Disconnected --> EscrowWalletCheck: connect (FR-031)
    EscrowWalletCheck --> WrongChain: not Base
    WrongChain --> EscrowWalletCheck: switch chain
    EscrowWalletCheck --> BookACall: escrow not provisioned (flag off, degrade)
    EscrowWalletCheck --> Simulating: connected + Base + provisioned
    Simulating --> TxPending: simulate ok, write (user signs, BR-04)
    Simulating --> BookACall: simulate revert (reason shown, degrade)
    TxPending --> Funded: receipt (success, FR-035)
    TxPending --> BookACall: tx error (degrade)

    BookACall --> Captured: contact submitted, queued, D1 (FR-036/037)
    Owned --> Captured: engagement recorded
    Funded --> Captured: engagement recorded
    Captured --> [*]: confirmation shown (never a dead-end)
```

**Invariant:** every terminal path converges on `Captured` with a visible confirmation. There is **no
state** — disconnected, wrong-chain, not-provisioned, sim-revert, script-fail — that dead-ends; each
degrades to the book-a-call floor (OBJ-01: terminal dead-ends = 0).

---

## 12. Sequence — (f) XMTP MLS onboarding (P3, off the conversion critical path)

```mermaid
sequenceDiagram
    autonumber
    participant U as Visitor (wallet)
    participant X as XMTP surface (/messages, flagged)
    participant SDK as @xmtp/browser-sdk (MLS)
    participant NET as XMTP network
    participant J as John's inbox

    Note over X: renders the "E2E encrypted channel" claim ONLY when the feature is live (FR-039)
    U->>X: open priority-support channel (requires connected wallet)
    X->>SDK: create/load MLS identity (installation key)
    SDK->>U: request wallet SIGNATURE (identity, not a tx)
    U-->>SDK: sign
    SDK->>NET: register installation / load inbox
    X->>SDK: newConversation(John's inboxId / XMTP_RECIPIENT)
    U->>SDK: send message (E2E encrypted)
    SDK->>NET: deliver
    NET->>J: John reads/replies (E2E)
```

**Placement:** entirely client-side, lazy-loaded, behind a feature flag; it **never** gates book-a-call or
checkout (P3 per roadmap). Wallet signature is for MLS identity, not a payment.

---

*End 02 — context, flows, replay spine, and state machine set. Proceed to 03 (stack ADRs, route
contracts, D1 DDL, model routing, cost).*
