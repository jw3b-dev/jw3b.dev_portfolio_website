# 01 — Personas (who lands on jw3b.dev and decides)

**Project:** Ground-up rebuild of jw3b.dev — John Wellard, "Senior Agentic AI Developer."
**Purpose of this doc:** name the humans who land, what each must see in ~5 seconds to trust
and act, and which one the design must optimize for. Every persona attribute is sourced or
marked `[INFERRED]` / `[UNVERIFIED]`.

> Method note: these are B2B/hiring decision personas, not app end-users. Sources are hiring
> playbooks, auditor-procurement guides, and AI-engineer portfolio guides (2026). No persona
> here is fiction with a name — each frustration is tied to a citation in the Sources block.

---

## PRIMARY — "The Building Founder/CTO" (seed–Series A, needs an agentic-AI system that survives production)

- **Who:** Technical founder or first-engineering-lead at an AI-native startup (seed to
  Series A). Has an LLM feature that demos well and breaks in production. Hiring a
  contractor or founding-engineer-caliber builder, not a researcher.
- **Goal in 5 seconds:** "Can this person ship a *reliable* multi-agent system — not a demo?"
- **What they must see immediately (trust triggers):**
  1. A **live, running agentic system** they can poke (not screenshots) — this is the whole ballgame.
  2. Evidence of **evaluation / reliability engineering** (the validator, tests, coverage, failure logs) — because their #1 scar is "works in demos, fails in production."
  3. **Orchestration-as-distributed-systems** language, not "I fine-tuned a model" language.
- **Frustrations (sourced):**
  - "The founding engineer who can't design evaluation infrastructure will build a product
    that works in demos and fails in production." — Islands HQ CTO playbook.
  - "A clean notebook doesn't tell you about production readiness" — they screen for error
    handling, logging, testing, docs. — same.
  - The scarcest, highest-signal skill is **agentic AI orchestration + responsible-AI
    documentation** — "high-signal and low-competition," most portfolios lack it. — Fonzi / DataExpert.
- **Why John wins here:** deterministic orchestration + zero-trust validator between every
  step + 1,345 tests / 100% cov + "publishes unedited runs including failures" is a
  *point-for-point answer* to this persona's exact fear. This is his rarest, least-contested asset.
- **Current tools / where they look:** GitHub (commit cadence, real repos), a live demo,
  referrals, AI-engineering job boards, Twitter/X threads, YC/founder Slack circles. `[INFERRED]`

## SECONDARY A — "The Protocol Security Buyer" (needs a smart-contract audit, buys on verifiable proof)

- **Who:** Web3 protocol founder / lead dev shipping value-bearing contracts, or a security
  lead assembling a layered defense. Procuring an audit or a security-minded engineer.
- **Goal in 5 seconds:** "Is this a *real* auditor with **externally verifiable** findings,
  or a logo wall?"
- **What they must see immediately:**
  1. **Verifiable competitive-audit record** — CodeHawks #124, 17 findings (8 High) — with a
     link to the public contest, not a self-asserted badge.
  2. A **working security tool** (KTHULHU / the live AI audit console) they can run.
  3. Specific-researcher signal over firm-brand signal.
- **Frustrations (sourced):**
  - "Competitive leaderboard performance on Sherlock, Code4rena, and CodeHawks is the best
    externally verifiable proxy for individual skill." — Blockonomi / Sherlock / TalentLevelUp.
  - "The firm's brand matters far less than the specific researchers assigned… you get
    whoever is available, not necessarily who is best suited." — Blockonomi. (Opening for a
    named individual with a public record.)
- **Why John wins here:** CodeHawks #124 is a *public, clickable* record; KTHULHU is a live
  proof-of-competence artifact. This persona is explicitly taught to buy on exactly that.
- **Note:** smaller audience than Primary, but higher intent + budget and near-zero "is it
  real?" friction if the proof is one click away.

## SECONDARY B — "The Senior-AI Hiring Manager / Staff Recruiter"

- **Who:** Eng manager or technical recruiter sourcing a senior/staff AI or agent engineer
  for a funded company. Scanning 30 candidates; John is one tab of many.
- **Goal in 5 seconds:** "Is this senior and real, or another bootcamp-grid portfolio?"
- **What they must see immediately:**
  1. **Three deep, real systems**, not twenty toys ("show exactly three polished projects").
  2. A **named focus** ("agentic systems / graph-native AI"), not a 30-logo skills cloud.
  3. **Seniority markers**: 20+ yrs delivery, 7 countries, AgilePM Practitioner, a "what
     failed and why" section (intellectual honesty is explicitly screened for).
- **Frustrations (sourced):**
  - "Leading with skills lists and burying the actual projects" is the top mistake. — Fonzi.
  - "A 'Key Learnings' section documenting what failed and why signals intellectual honesty…
    traits technical hiring managers screen for explicitly." — Fonzi / DataExpert.
- **Why John wins here:** "proof, not promises / publishes failures" is literally the trait
  this persona is told to hunt for.

---

## Priority call

**Design for the Primary (Building Founder/CTO).** It is the largest high-intent segment for
"Senior Agentic AI Developer," it lands on John's *rarest and least-contested* asset (live
production agentic systems + verification), and the site's marquee live features (AI security
console, AI concierge, on-chain flow) are themselves the proof this persona needs. Serve
Secondary A (audit buyers) with a one-click-verifiable proof surface and Secondary B (hiring
managers) with the "three real systems + failures shown" structure — both are satisfied by the
*same* proof-first architecture, so there is no conflict, only emphasis.

## Red-team (persona phase)

- **Vendor bias:** hiring-playbook sources (Recruiting-from-Scratch, Islands HQ, Sherlock,
  TalentLevelUp) sell recruiting/audit services — incentivized to over-state rigor of buyer
  evaluation. **Counter-evidence:** the "verifiable leaderboard" and "fails in production"
  themes recur across *independent* outlets (Blockonomi, Fonzi, DataExpert, Khosla), so the
  signal survives any single vendor's slant.
- **Geography:** sources are US/global; John is Benoni, South Africa (UK citizen). Remote
  contract hiring is geography-agnostic on proof, but **timezone/location bias is a real
  friction** for the Primary — mitigate by foregrounding async proof (live demos, public
  record) over "hire me for standups." `[INFERRED]`
- **Survivorship:** portfolio "best practice" lists over-index on people who got hired *and
  wrote about it*. Counter: John's differentiators (live systems, public audit record) are
  objective artifacts, not self-report, so less exposed to this bias.
- **Confidence: HIGH** for Primary selection (3+ independent sources, 2 tiers: hiring
  playbooks + portfolio guides). MEDIUM on the SA-location friction magnitude (inferred).

## Sources
- https://blog.islandshq.xyz/how-to-hire-your-first-ai-engineer-a-playbook-for-ctos-0f0c1bf921dd
- https://www.recruitingfromscratch.com/blog/how-to-hire-a-founding-engineer-at-an-ai-startup-2026
- https://www.khoslaventures.com/posts/how-to-hire-a-cto
- https://fonzi.ai/blog/ai-engineer-portfolio
- https://www.dataexpert.io/blog/ultimate-guide-ai-engineering-portfolios
- https://www.upskillist.com/blog/10-ai-portfolio-examples-impress-recruiters/
- https://blockonomi.com/best-smart-contract-auditors-and-web3-security-companies-2026-ranked-by-verifiable-public-evidence
- https://sherlock.xyz/post/top-10-best-smart-contract-auditing-companies-in-2026
- https://talentlevelup.com/hire-smart-contract-auditor/
- https://www.cyfrin.io/blog/how-to-become-a-smart-contract-auditor-courses-and-resources
