# ACTIVE_AGENTS.md — jw3b.dev v2 (activated MAS build roles)

**Owner:** requirements-architect (Phase 2) · **Date:** 2026-08-16 · **Status:** ACTIVE
**Dispatch:** lead-architect assembles + sequences these in MAS Phase 5 build (per `project_management/05_master_project_plan.md` RACI). **John = sole approver + deployer at every gate.**
Each role is traced to the `REQUIREMENTS.md` fields it owns. Project-scope skills in `.claude/skills/` (retargeted to jw3b.dev) take precedence over the user-scope versions of the same name.

---

## Design track
| Role | jw3b.dev responsibility | Owns (REQUIREMENTS refs) |
|---|---|---|
| **art-director** | Design story (proof-as-interface, verification-as-signature, radical honesty), per-section creative briefs, structured visual QA against briefs. Kills the avoid-list clichés. | Vision §2; FR-001/005/006; NFR-09; OBJ-06 |
| **brand-architect** | Token layer (color/type/space/motion/elevation) — **distinct-from-studio** accent + dimensionality; zero raw hex outside tokens; WCAG-AA contrast on dark theme. | NFR-05/09; C7; P0 token layer |
| **creative-technologist** | The **explorable/steppable Overmind graph + validated-pipeline** object; any R3F within the frame budget (≥30fps mobile / ≥50fps desktop) with non-3D fallback. | FR-006; NFR-03 |

## Architecture / scaffold
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **lead-architect** | Scaffold + provider tree on `v2` (Wagmi→Query→RainbowKit→Helmet→Router); root configs; shared contracts (tag-protocol, D1 schema) as single source of truth; build/deploy gating; cross-subsystem sequencing. | M1; FR-052; P0 contracts; all NFRs at the gate |

## Frontend build
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **frontend-engineer** | Public-facing UI: operable proof-first hero, four-hat identity IA (filters dim, never hide), the radical-honesty failures surface, persistent hire spine, branded SEO/OG/structured-data, delivery-credibility anchor, accessibility/motion. | FR-001/002/003/005/007/044/045/053/054/060; OBJ-02/03/04/06 |
| **app-ui-engineer** | Mission Control app surface: 4-step configurator (label-drift fixed), assessment-informs-loadout, full product-state set (connect/loading/pending/success/error/empty), in-flow wallet prompt, checkout-states, engagement-request capture UI. | FR-028/029/030/031/035/037; E-epic |
| **full-stack-integrator** | Wire the wallet/payment hooks end-to-end (RainbowKit connect button, Unlock wrapper, wagmi read/write hooks), the concierge/audit stream hooks + tag-strip parser, XMTP `@xmtp/browser-sdk` onboarding wiring. | FR-011/015/017/040/041; FR-039 wiring |

## Backend / domain logic
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **backend-specialist** | Cloudflare Worker routes (concierge/audit/STT-TTS/CTF-verify/leaderboard/engagement/book-a-call), D1 persistence, AI-endpoint rate-limiting, secrets server-side, structured errors mappable to fallbacks. | FR-048/049/050/051; NFR-04/08 |
| **domain-engine** | The core logic engines: **claims-gate content gate** (ClaimRecord DE-07), **ticket-size routing** (BR-05), assessment→loadout recommendation, price-provenance from `retainer.json`, the cached/replay **fallback harness** (BR-03), server-side tag-protocol contract. | FR-029/030/043/046/047/052; BR-01/03/05/11/12; DE-07 |
| **audit-heuristics-engineer** | The `/audit` console detectors (Solidity first-pass heuristics + streamed findings); severity labels + recommendation strings **are public security claims** — treat as reputational. AI-assisted-first-pass disclaimer. | FR-008/009/010/013/014; BR-10 |

## Web3 / contracts
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **smart-contract-engineer** | Foundry authoring/testing/deploy of **MilestoneEscrow** (USDC-on-Base) + the **CTF reentrancy vault + attacker** (Base Sepolia); fuzz tests; forge deploy scripts. | FR-022/027/033 (contracts); P2 long pole |
| **web3-blockchain** | On-chain correctness judgment: **simulate-first as a gate** before any `writeContract`, USDC 6-decimal/BigInt precision, testnet-vs-mainnet honesty on the Base Sepolia demos, the wagmi-2/viem-2 floor that must not be bumped. | FR-027/033/042; BR-04/06/09; DE-03 |

## Data / evidence / content
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **portfolio-evidence** | **Seed + arbitrate the evidence register** — the 10 cleared CV stats + evidence pointers + **AgileGypsy-Labs/EcoGraph provenance notes**; enforce cleared/forbidden claims; resolve the **CR-10 Neo4j caveat**. Every rendered number/credential is its jurisdiction. | **FR-061**; FR-043/046/047; §11; BR-01/02 |
| **synthetic-data** | Produce the **recorded-run / replay artifacts** for every live surface (audit runs, concierge transcripts, CTF solve) + seed leaderboard fixtures — the data that makes BR-03 fallback "verifiably real". | FR-012/020/026; BR-03 support |

## Quality / security / compliance gates (Phase-5 gate roles)
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **qa-tester** | Validate against the suite; write unit/integration/E2E; regression sweeps with failure attribution; hold the coverage gate; assert real behavior (not a green suite). | All FRs at the gate; NFR-01 perf assertions |
| **security** | SAST (injection/XSS/secrets/deps), DAST (auth/rate-limit/CORS/headers), **client-bundle secret-leak scan**, deploy/rollback authority. | FR-050/051; NFR-04; US-043/044 |
| **codebase-auditor** | Map every requirement → implementation evidence (built/partial/missing); detect orphan code (the old escrow-orphan class); architecture-compliance; pre/post-deploy gate. | Full FR↔code trace; FR-038 (no dead scaffolds) |
| **performance-monitor** | Independent quality review of agent deliverables (weighted rubric + Blue/Red team + PASS/WARN/FAIL); anti-sycophancy — "done to what standard?". | Deliverable quality across all phases |
| **compliance-officer** | Binary pass/fail against declared regimes; verify AI disclosure, testnet honesty, audit disclaimer, privacy notice; drive the 6 `[NEEDS RESEARCH]` items + OD-04 jurisdiction. | FR-014/021/024/042/057/058/059; NFR-07; §13 |

## DevOps
| Role | jw3b.dev responsibility | Owns |
|---|---|---|
| **devops-engineer** | GitHub Actions CI (lint → coverage → build → deploy), the Cloudflare Worker + D1 migrations + wrangler bindings/secrets, the frontend deploy. **Never deploys without John**; build stops at `v2`. | FR-048/049/050 infra; CI gate |

---

**Not activated as flagship-build roles (context only):** DevGuild/EcoGraph/Art-of-Zeta are **not** flagships (OD-01) — they may surface as supporting proof, handled by portfolio-evidence + frontend-engineer, not a dedicated build role. The studio (agilegypsy.com) is out of scope (cross-link only).
