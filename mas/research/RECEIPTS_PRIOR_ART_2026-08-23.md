# Research — "Receipts" (attested evidence graph): prior art, toolchain, market

**Date:** 2026-08-23 · **Role:** research-specialist · **Subject:** `mas/concepts/ATTESTED_EVIDENCE_GRAPH.md`
**Status:** delivered before any code was written, which is the point of it.

> **confidence: HIGH** on Q1–Q3 (prior art, novelty, toolchain) — 3+ sources each, 2–3 tiers,
> primary specs read, no unresolved contradictions.
> **confidence: MEDIUM** on Q4 (market) — strong convergent evidence, but the *specific* niche
> ("prove facts about audit work you cannot publish") produced **no direct demand evidence either
> way**. That gap is stated rather than papered over, and it costs the level.

---

## Verdict first

**Do not build Receipts as a product. Build the 200-line internal version and stop there.**

Every layer of the proposed stack already exists, and the two lowest layers are free:

| Proposed layer | Already shipped as | Price |
|---|---|---|
| Merkle commitment over the register | **EAS Private Data Attestations** — root on-chain, salted leaves, per-field disclosure | **free** (open, permissionless, tokenless) |
| Merkle-batched credential issuance | **POK** — Blockcerts + Merkle proof, root anchored on Ethereum | **$0.06/credential** at 50k, $0.30 with no minimum |
| Boolean queries over committed evidence | **Zero-Knowledge Sets** (Micali–Rabin–Kilian, FOCS 2003) | 23-year-old academic primitive |
| Field-level selective disclosure | **BBS+ / `bbs-2023`** | W3C Candidate Recommendation, not production |
| On-chain audit representation | **ERC-7512** | proposed Sept 2023, **still DRAFT** |

The differentiator was never going to be the cryptography. It is the corpus and the discipline
around it — and that is not a thing you sell as a ZK product.

---

## Q1 — Prior art and competitors: solved, and commoditised

**EAS (Ethereum Attestation Service) already ships the exact design**, including the detail I
called essential (per-attribute random salts). Its own description of the mechanism: the issuer
generates one random salt per attribute, uses the ordered concatenated pairs as Merkle leaves, and
the root is the commitment; disclosure reveals the claim values plus their salts and the proof path
needed to recreate the root. `T2`

- Free, open-source, permissionless, tokenless. **9.5M+ attestations, 450k+ attesters.** `T2`
- Schema registry, resolver contracts, public *and* private attestations.
- Corroborated independently by W3C CCG's **Merkle Disclosure 2021** draft and by arXiv work on
  selective disclosure of VC claims — the salted-Merkle-leaf construction is a documented pattern,
  not one vendor's trick. `T3`

**POK** sells the commercial version: credentials batched into a Merkle tree, only the root
anchored on Ethereum, each credential carrying its proof. 1,100+ institutions across 19 countries,
1EdTech certified for Open Badges 3.0. **$3,000/yr for 50,000 credentials (~$0.06 each)**, or
$0.30/credential with no minimum. `T2` 💰

**What this means for the plan:** the "build the commitment layer first, ~200 lines" instinct was
correct engineering and is now a *worse* build decision than it looked, because the same 200 lines
exist as free infrastructure with 450k users. Writing them is still right for jw3b.dev — see
Recommendation 2 — but as the foundation of a *product* it is a commodity.

## Q2 — The boolean-oracle design is not novel. It is Zero-Knowledge Sets (2003)

The owner's design — evidence committed into something nothing decrypts, queried to return only
true/false — is **Zero-Knowledge Sets**, introduced by Micali, Rabin and Kilian at FOCS 2003. `T3`

> A prover commits to a set **without revealing even the size of the set**, then answers
> membership / non-membership queries with proofs that reveal nothing beyond the truth of that one
> assertion. Non-interactive.

Two things follow, and they point in opposite directions:

1. **It vindicates the design.** The concept doc says "that design is sound"; the literature agrees
   so thoroughly it has a name and a 23-year history. **All existing ZKS schemes use a Merkle tree
   as the base structure**, with mercurial commitments at the nodes — so "Merkle first, ZK second"
   is not just a pragmatic ordering, it is how the primitive is actually constructed. `T3`
2. **It removes the novelty.** There is no invention to sell here.

**The enumeration leak is also already formalised.** Zero-knowledge accumulator security is
defined against an adversary *with query and update oracle access* — precisely the repeated-boolean
attack. `T3` The doc's mitigations (capability-scoped predicates, rate limiting, prefer selective
disclosure where the field is not secret) are the right shape; they are also not a research
contribution.

**⚡ Conflicting evidence:** ZKS is well-studied yet I found **no deployed product** built on it in
23 years. Two readings: the primitive is impractical at product scale, or nobody found a business
for it. The literature on ZKS performance is thin enough that I could not resolve which — see
Information Gaps. Either reading argues against building on it.

## Q3 — Toolchain maturity: both dependencies are pre-production

**BBS+ / `bbs-2023`.** Published as a **Candidate Recommendation, not a Recommendation** — and
deliberately held there, because it must wait for the IETF to finalise the underlying BBS
signature. Independent assessment: advanced schemes like BBS+ and ZKPs "are still emerging and not
yet widely deployed in production." `T2` Rust implementations exist (Trinsic reference impl,
mattrglobal FFI over Hyperledger Ursa, herculas) but I found **no security audit of a BBS+ crate**;
the nearest audited neighbour is `blsful` (Kudelski, Feb 2026, no significant findings), which is
BLS, not BBS+. `T1`/`T2`

**Noir (Aztec).** 1.0 pre-release, 600+ GitHub projects, 900+ stars, 2,000+ VS Code installs — real
adoption for a ZK DSL. But Aztec's own guidance is explicit: **"Noir remains unaudited and we warn
against production use-cases involving financial assets."** `T2` OpenZeppelin and Nethermind have
both published "how to not write unsound Noir circuits" guides, which tells you where the footguns
are. `T2`

**Disposition:** a solo builder shipping paid product on a Candidate Recommendation that is waiting
on another standards body, plus an unaudited circuit language, is taking on standards risk they
cannot control. The spec can change underneath you and the fix is not yours to make.

## Q4 — Market: the closest comparables died, stalled, or pivoted

**Every specific comparable I could find failed, and the generic market numbers come from people
who sell market reports.**

- **Trinsic — the VC infrastructure company — pivoted away from it.** Founder Riley Hughes
  announced at IIW 38 that *"SSI didn't work. Trinsic is pivoting."* He noted having ~99% of his net
  worth in the company as evidence of how genuinely he had held the opposite view. Trinsic moved
  from helping companies *issue* credentials to helping them *accept* existing digital IDs. `T1`/`T2`
- **The cold-start problem is structural**, not a marketing failure: users will not maintain
  credentials without verifiers who accept them, and verifiers will not integrate without a critical
  mass of users. Without a regulatory mandate, nobody moves first. `T2`/`T3`
- **POAP shut down after 5+ years — despite Coinbase and Amex adoption.** The stated cause is the
  one that matters here: *"No token meant no built-in revenue flywheel."* Co-founder Isabel
  Gonzalez: crypto's funding and distribution dynamics "made it hard to build a sustainable company
  without cannibalizing the ethos that made POAP mean something." Commentary drew the general
  lesson — **users of open attestation infrastructure expect it to be free.** `T2`
- **ERC-7512 — on-chain representation of smart-contract audits — is the closest existing thing to
  the differentiated claim, and it has been DRAFT since September 2023.** Authored by Safe,
  OtterSec, ChainSecurity, Ackee, OpenZeppelin, Hats Finance and Omniscia. Only Ackee committed to
  implementing it. `T2` **Seven of the largest firms in exactly this niche, three years, no
  adoption** — that is the strongest single market signal in this report.

**The bull case, stated fairly and then discounted:**

- Analyst reports put the VC platform market at ~$1.8B (2025) → $12.6B (2034), 24% CAGR. 💰
  **Discount heavily** — these come from firms whose product is the report, and the same genre
  projects confidential computing from $24B (2025) to $350B (2032), which is not a credible curve.
- **Verifiable** (healthcare credentialing) raised $47M since 2020 and is a real business — but it
  wins by being an API that checks primary sources in real time, cutting credentialing from weeks to
  days. **It is not cryptographic and not decentralised.** The lesson runs against the concept: the
  money is in *doing the verification*, not in *proving you did it*.
- Genuine tailwind: EU/APAC digital-identity mandates. Regulation is the one force that beats
  cold-start — and it is not aimed at auditor evidence registries.

---

## Recommendations

**1. Do not build Receipts as a sellable product.** `confidence: MEDIUM`
The commitment layer is free (EAS) or six cents (POK). The query layer is a 2003 academic primitive
with no product in 23 years. The disclosure layer is a Candidate Recommendation waiting on the IETF.
The nearest domain-specific standard stalled for three years with seven major backers. Each of those
alone is survivable; together they are a market telling you something.

**2. Do build the internal version — an afternoon, no dependencies, and it is a site feature.**
`confidence: HIGH`
A salted Merkle root over the 33-claim evidence register, published with its date, plus
`verify(claim, proof, root)`. It makes the register **tamper-evident** and lets a single claim be
proven without handing over the set. Use EAS's construction (random salt per attribute, ordered
pairs as leaves) because it is the documented pattern, and skip the chain entirely at first — a
dated root in the repo has the same integrity property against everyone except a time-travelling
owner. Anchor on-chain later if the timestamp needs to be someone else's.

**3. Be careful what it claims.** `confidence: HIGH`
A Merkle root proves the register has not been **edited**. It proves nothing about whether a claim
was **true** when written — that is still the `verified`/`attested` split doing the work. The whole
category blurs those two. This site's stated position is that it does not.

**4. If the ZK idea is pursued at all, pursue it as a KTHULHU feature, not a company.**
`confidence: MEDIUM`
"Prove this codebase passed invariant suite X at commit C, without revealing the code" is a
plausible feature of a product that already has paying users and already runs the suites. As a
standalone SaaS it inherits every cold-start problem above; as a KTHULHU capability it inherits an
existing customer.

---

## Remaining flaws

1. **The Trinsic primary source was unreadable.** `rileyparkerhughes.medium.com/...` returned
   **HTTP 403**. The quotes above come from search-surfaced excerpts of that article and from
   secondary coverage, not from my own read of the original. The pivot itself is corroborated by
   Trinsic's own site and by podcast coverage; the *reasoning* is second-hand. Costs Q4 a level.
2. **EAS private-data mechanism is single-vendor for the detail.** The docs URL returned an empty
   shell and the GitHub tutorial path 404'd; the construction detail comes from EAS's own mirror.xyz
   post. Partially offset by W3C Merkle-Disclosure-2021 and arXiv selective-disclosure papers
   describing the same salted-leaf construction, so the *pattern* is corroborated even though EAS's
   *implementation* is not independently verified.
3. **No performance data on Zero-Knowledge Sets.** I could not establish whether ZKS is
   impractical or merely unmarketed. I flagged this as ⚡ rather than resolving it.

## Dissenting evidence

- The digital-identity market genuinely is growing, and EU/APAC mandates are a real forcing
  function that has broken cold-start problems before.
- Noir's adoption numbers are healthy for a ZK DSL, and "unaudited" is a moving target — it may well
  be audited within the year.
- EAS existing for free could be read as validation of demand rather than as competition. I do not
  find that persuasive when the free option has 450k attesters and the paid comparable (POAP) died,
  but it is a coherent opposing read.

## Information gaps

- **No direct evidence, positive or negative, of demand for "prove facts about client audit work
  you cannot publish."** Four query formulations returned audit-firm listings, not buyers. The
  ERC-7512 stall is a proxy, not a measurement. **What would settle it:** five conversations with
  protocol security leads asking whether an auditor's cryptographic proof of unpublished findings
  would change a procurement decision. That is a week of the owner's time and worth more than any
  amount of further desk research.
- No pricing found for any product selling *predicate proofs over private evidence* — possibly
  because none exists.
- BBS+ crate audit status: not established.

## Bias disclosure

- 💰 POK, Sertifier, Dock, EveryCred, AI Certs and the dataintelo market reports are all
  commercially incentivised on the "verifiable credentials are the future" side. Their growth
  figures are treated as directional at best.
- 💰 Aztec is the vendor for Noir; its adoption numbers are self-reported. Its *warning* against
  production use is credited more highly precisely because it cuts against its own interest.
- **Confirmation-bias check:** the first three searches returned negative signals, so a deliberate
  fourth round searched only for successful and profitable companies in the space. That round
  produced the Verifiable and market-size material in the bull case above — which is why the bull
  case is stated rather than omitted. It did not change the recommendation, but it was looked for.
- **Survivorship check:** POAP and Trinsic are *failures* found on purpose. The surviving comparable
  (Verifiable, $47M) is the one that dropped the cryptography, which is the finding.

## Sources

Micali/Rabin/Kilian ZKS (FOCS 2003) and follow-ups · W3C `vc-di-bbs` Candidate Recommendation ·
W3C VC Data Model 2.0 · W3C CCG Merkle Disclosure 2021 · EAS docs + "Private Data Attestations
using Merkle Trees" · eips.ethereum.org ERC-7512 · Aztec Noir beta / 1.0 pre-release posts ·
OpenZeppelin + Nethermind Noir circuit-safety guides · POK pricing page · Riley Hughes,
"Why Verifiable Credentials Aren't Widely Adopted & Why Trinsic Pivoted" (403 — via excerpts) ·
The Block / crypto.news / CryptoBriefing on the POAP shutdown · Ackee Blockchain on ERC-7512 ·
arXiv 2402.15447, 2401.08196 (selective disclosure) · eprint 2015/404, 2019/1255 (ZK accumulators,
set membership) · dataintelo market reports 💰
