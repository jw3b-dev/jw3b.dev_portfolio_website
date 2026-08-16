# 03 — Stakeholder Register — jw3b.dev v2

**Role:** project-manager (MAS Phase 1.5) · **Date:** 2026-08-16 · **Status:** DRAFT
**Traces to:** `mas/business_analysis/01_stakeholders.md` (S1–S7). Engagement strategy ∈ {inform · consult · collaborate · empower}.
**Governance reality:** one human (John) who is sponsor, sole approver, and sole deployer; the "delivery team" is a MAS agent
pipeline. The communication plan is therefore **async, digest-based, and gated** — not a standing human team cadence.

---

## 1. Stakeholder register

| # | Stakeholder | Interest | Influence | Core need | Communication need | Engagement strategy |
|---|---|---|---|---|---|---|
| **S1** | **John Wellard** — owner / sponsor / project lead / sole approver + deployer | **HIGH** | **HIGH** (total control) | A site that converts without overclaiming; deploy control retained; every claim defensible | **Phase-gate decision digests** + immediate escalation on RED risks, MUST-scope changes, provisioning, and deploy approval | **EMPOWER** — John decides everything; the pipeline serves rulings, never overrides them |
| **S2** | **PRIMARY buyer — Building Founder/CTO** (seed–Series A) | **HIGH** (actively evaluating) | **HIGH** (converts or doesn't → drives SC-1) | Proof in the first interaction that John ships agentic systems that survive production | Indirect: their behaviour is the KPI signal (completion rate, requests) measured via D1 analytics | **COLLABORATE** — design *for* them; measure and calibrate against their behaviour over the first 90 days |
| **S3** | **SECONDARY — Protocol Security Buyer** | MED–HIGH | MED | A *verifiable* audit record (CodeHawks #124) one click away + a runnable security tool | Served through the product itself (deep-link + `/audit` console); no direct channel | **CONSULT / inform** — proof surfaces answer their evaluation; verified via SC-5 |
| **S4** | **SECONDARY — Senior-AI Hiring Manager / Recruiter** | MED | MED | Four deep real systems (not 20), a named focus, seniority markers, an honest "what failed" surface | Served through the product (four flagships + failures surface + delivery anchor) | **INFORM** — the site *is* the message; measured via SC-2/SC-4 depth signals |
| **S5** | **AgileGypsy Labs** (studio, sibling brand) | MED | MED (brand-distinctness constraint C7/NFR-09) | jw3b.dev stays a distinct person-brand; studio-only metrics don't leak / mis-attribute | John wears both hats; provenance discipline (R-05) + cross-link are the touchpoints | **CONSULT** — cross-link, don't absorb; provenance note on every studio-origin figure |
| **S6** | **Compliance / data-protection** (John as POPIA Information Officer; EU/SA visitors) | HIGH | MED–HIGH (can block a surface at the compliance gate) | AI disclosure, privacy notice, testnet honesty, audit disclaimer, lawful wallet/engagement-data handling | compliance-officer gate reports; escalate OD-04 + the 6 `[NEEDS RESEARCH]` items to John | **COLLABORATE** — clear duties ship now; gated duties (consent, checkout-terms) resolved before their surface ships |
| **S7** | **MAS delivery team** — lead-architect + engineering roles + gate roles (qa/security/audit/perf/compliance) | **HIGH** | **HIGH** (they build it) | Testable, traceable requirements + explicit open decisions, so they build without guessing | **Surgical coordinates in, digest-only out** (status + files + gate result, no code dumps); gate reports at phase boundaries | **EMPOWER within gates** — autonomous inside a phase; every phase exit is a hard QA/security/audit/perf gate + John's approval |

## 2. Communication plan

| Event / cadence | From → To | Channel / form | Trigger |
|---|---|---|---|
| **Phase-gate decision digest** | PM / lead-architect → **John (S1)** | Async written digest: scope delta, gate results, decisions requested | Start & exit of every release phase |
| **RED-risk / MUST-scope / provisioning escalation** | PM → **John (S1)** | Immediate escalation note (see §3) | Any RED risk realised, any MUST-scope change, any provisioning dependency going critical |
| **Deploy-approval request** | devops-engineer / lead-architect → **John (S1)** | Deploy checklist + smoke-test plan; **John is the only one who can deploy** | A phase passes all gates and is ready for production |
| **Agent task dispatch** | lead-architect → **delivery roles (S7)** | Surgical coordinates: exact files + one task + digest-only return contract | Each build slice |
| **Gate report (PASS/WARN/FAIL)** | qa-tester / security / codebase-auditor / performance-monitor / compliance-officer → PM + John | Structured verdict + issue registry (severity-ranked) | Every phase exit |
| **Provenance / claims-gate audit** | portfolio-evidence + codebase-auditor → John | Register-vs-surface diff; any uncleared/mis-attributed claim flagged | Every release gate (SC-3) |
| **KPI calibration report** | PM → John | Analytics readout vs SC-1 targets | Day 30 and Day 90 post-launch |
| **Buyers (S2–S4)** | (no direct channel) | The product itself + first-90-day analytics loop | Continuous post-launch |

## 3. Escalation path

Single human endpoint — **all escalations converge on John.**

```
delivery role blocked / gate FAIL
        │
        ▼
   lead-architect  ── (dispatch / rework within a phase) ──┐
        │                                                  │
        ▼                                                  │
 gate owner (qa-tester · security · codebase-auditor ·     │
 performance-monitor · compliance-officer)  ── PASS/FAIL ──┤
        │                                                  │
        ▼                                                  ▼
   Project Manager (governance · change-control · risk)  ──► JOHN (S1)
                                                     • all decisions
                                                     • RED risks (R-01, R-03)
                                                     • MUST-scope changes
                                                     • provisioning (R-02)
                                                     • compliance rulings (OD-04)
                                                     • SOLE deploy authority
```

**Auto-escalate to John (never absorbed by the pipeline):** any RED risk realised; any change to a MUST scope item or a success
criterion; any provisioning dependency (Unlock / escrow / scheduler / KTHULHU embed) going critical; any compliance-gate FAIL;
any deploy. **Resolved within the pipeline (logged, not escalated):** SHOULD/COULD reprioritisation inside a phase, mechanical
rework on a gate WARN, agent-throughput scheduling.

## 4. Self-critique (stakeholder register)

1. **≥ 3 groups, each fully specified?** 7 groups, each with interest + influence + need + comms need + engagement strategy. ✔
2. **Owner-of-communication on each channel?** Yes — every row names a from→to. ✔
3. **Uncomfortable truth captured?** The single-human bottleneck (S1 = sponsor + sole approver + sole deployer) is stated as the
   central governance reality, not glossed. ✔
4. **Fillable placeholders?** None. ✔
5. **Escalation unambiguous?** Yes — one endpoint (John), with an explicit auto-escalate vs resolve-in-pipeline split. ✔
