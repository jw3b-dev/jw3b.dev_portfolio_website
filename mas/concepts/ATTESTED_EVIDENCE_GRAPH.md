# Concept — the attested evidence graph (working name: **Receipts**)

**Status:** brainstorm + architecture sketch, 2026-08-23. Nothing built. Written after consulting
`agilegypsy-website/ecograph` for reusable tooling. Owner's idea; my job here is to separate the
part that is a product from the part that is a research programme, and to say which is which.

---

## 0. The correction that changes what gets built

The pitch says *ZK proof*. Almost nothing in the description needs zero-knowledge, and saying so up
front is the difference between a shippable product and a two-year detour.

| What you described | What it actually needs | Cost |
|---|---|---|
| "each piece of evidence once proven is written to the blockchain" | a **hash commitment** — publish `H(evidence)`, proves existence-at-time + integrity | trivial |
| "the address is the encryption that solves the model graph" | a **Merkle root** over the graph's canonical state; any single fact proves against it with an O(log n) path | small |
| "constantly updates and keeps itself fresh" | a **re-anchoring job** + visible staleness | small |
| "live proof and attestation" | **deterministic re-verification**, published | you already built this twice |
| prove something about evidence you **cannot show** | **this** is zero-knowledge | large |

**Zero-knowledge earns its keep in exactly one place in your business, and it is a good place:
client audit data you are contractually unable to publish.** You cannot show a client's findings.
But you could prove *"this engagement produced N criticals"*, or *"this codebase passed invariant
suite X at commit C"*, without revealing the code, the findings, or the client. That is a real,
differentiated claim. Everything else on the list is a Merkle tree and a cron job.

So: **build the commitment layer first, and treat ZK as a later module with one specific job.**
Anything else inverts the risk — the hard cryptography would gate the boring part that carries the
value.

## 0b. ✎ Correction, after the owner clarified — ZK moves from optional to load-bearing

§0 argued ZK was a later module. That was answering a **different design** from the one intended,
and the difference matters.

**What I argued against:** an AI that holds a decryption key, decrypts to answer, and is trusted to
decide what to reveal. That is an oracle wearing a lock — decomposed questions and prompt injection
walk straight out with the contents.

**What was actually meant:** the evidence is committed into a ciphertext **nothing decrypts**. A
query is evaluated *against* it and returns **only a boolean**. The AI never sees plaintext and
never authorises anything — it turns English into a predicate and reports the verified answer. The
owner's analogy is exact: a wallet signature proves control of a key without revealing the key;
this proves a claim without revealing the register.

That design is sound, and it makes the cryptography the product rather than a bolt-on.

### The primitive stack, cheapest first

| Layer | What it answers | Cost |
|---|---|---|
| **Merkle commitment** over the canonical register | *"Is this exact claim in the attested set?"* — proof reveals that one leaf and nothing else | ~200 lines. Do this first. |
| **Salted leaves** | stops a small claim-space being brute-forced out of the root | trivial, and mandatory (§5.3) |
| **ZK predicate** (Noir / Plonk) | *"≥3 Highs"*, *"cert issued before X"* — true/false over a value never revealed | weeks, genuinely needed here |
| **Encrypted search / PIR** | hides the QUESTION as well as the data | research-grade — avoid unless a customer pays for it |

**Most "invisible register, answerable questions" behaviour is the first two rows, not the third.**
Membership and integrity are a Merkle tree; only a claim *about a hidden quantity* needs ZK.

### The one real leak — design for it now, not later

**A true/false oracle still leaks under repetition.** Unlimited yes/no queries over an enumerable
space (certs, issuers, contest names, small integers) reconstruct the register by exhaustion — the
same way an unlimited password check is a password dump. The ciphertext is never broken; the
*answers* are the side channel.

So the boolean must not be freely askable:

1. **Authorised predicates, not open querying.** A verifier presents a capability naming the
   questions they may ask. This is the actual boundary — not the encryption, and not the AI.
2. **Rate-limit and log every query**, per verifier. An enumeration attempt should be visible as
   one.
3. **Prefer selective disclosure where the field is not secret.** W3C Verifiable Credentials with
   **BBS+** reveals *"holds AgilePM Practitioner"* from a credential while hiding every other field
   in it — no oracle, no leak, and a far smaller build than ZK. Reach for ZK when the claim is
   about a hidden *quantity*; reach for BBS+ when it is about a hidden *field*.

**Net:** the architecture holds. Build Merkle commitments + BBS+ selective disclosure first — that
covers most of the promise with no research risk — and add ZK predicates for the numeric claims.
§7's build order stands, with ZK promoted from "later, if ever" to "second".

## 1. You are closer than you think — the EcoGraph inventory

Consulting `ecograph/` rather than guessing, the prover primitive **already exists** and is running:

- **`schema/02_assertions.cypher`** — *"Every query here MUST return ZERO rows… encode the
  constraint so the model cannot silently violate it, then keep the receipts. Run in CI."* That is
  the prover. It is not ZK; it is something better for v1 — a **deterministic, replayable,
  human-auditable predicate suite over a graph.**
- **`schema/07_support_assertions.cypher` A2** — a **canary that must return exactly one row**, so
  the isolation assertion is proven to still fire. Testing the test. This is the single most
  valuable pattern in the repo for this product: *an attestation that can prove it is still alive.*
- **`06_support_agent.cypher`** — multi-tenant schema with POPIA-by-design (no per-question nodes).
  Tenancy is already solved.
- **`04/05_rwa_erc3643`** — RWA / ERC-3643 ontology **with reserve-backing invariants already
  written**. Keep this in view; §4 argues it is the wedge.
- **`ingest/`** — crawl → chunk → embed → entity/relationship extraction → PageRank/Louvain.
  77k chunks, ~9.8k entities. The evidence intake pipeline exists.
- **`bridge/radcad_bridge.py`** — graph ⇄ Monte-Carlo. Not needed for v1; interesting for
  forward-looking attestations ("under these assumptions the reserve holds").

**Missing:** canonical serialization, the commitment/anchor layer, the verifier, and the
staleness model. That is a much shorter list than the idea implies.

## 1b. ✎ I queried the live graph — and the prover is currently red

§1 was written from the `.cypher` files. Running them against the live database (`ecograph-neo4j`,
up 14 hours) says something the files cannot.

**First, it verifies two of the site's claims better than the README did:**

| Claim | README | **Live graph** |
|---|---|---|
| `graphrag-entities` = 9,828 | "~9,800-entity" | `KGEntity` = **9,828** — exact |
| `graphrag-chunks` = 77k | "77k chunks" | `Chunk` = **77,235** |
| (context) | "~10,600 crawled pages" | `DocPage` = **10,557** |

Those two move from *"consistent with a rounded README"* to **source-verified against the running
database**. Worth re-running before the next claims sweep.

**Then the finding that matters.** Running all three assertion suites:

- `07_support_assertions` — **exactly one row, the A2 canary**, declaring itself
  `"A2 EXPECTED (exactly one row): isolation probe present"`. Working as designed.
- `02_assertions` — **two rows**: `A1 conservation broken` (RWA-DEMO: 0 allocated against
  1,000,000 supply) and `A3 unguarded rug path`.
- `05_rwa_assertions` — **one row**: `R2 non-compliant holder`.

Two of those four are **deliberately seeded counter-examples** — the nodes carry
`hypothetical: true` and a `[WHAT-IF]` tag. They are proof the detectors fire. But:

1. **The runner does not exist.** `02_assertions.cypher` says *"Run in CI"* and names
   `ecograph/verify.sh (greps for any output rows)`. There is no such file anywhere in the repo.
   A gate documented and never wired — the same shape as jw3b.dev's product-owner rule, which sat
   in `CLAUDE.md` unenforced until a script was written for it.
2. **A grep-based runner would fail anyway**, because a seeded what-if is indistinguishable from a
   real violation in its output. The A2 canary solved this properly by *declaring* itself expected;
   A1/A3/R2 do not.
3. **A1 is not marked hypothetical at all.** RWA-DEMO carries no `[WHAT-IF]` tag, so it is either a
   real model inconsistency or an unlabelled fixture. Either way it is indistinguishable from a
   breach.

### The architectural lesson, and it is the important one

**The prover's hardest problem is not cryptography. It is telling an intentional counter-example
from a real failure.** Get that wrong and the gate cries wolf, someone adds `|| true`, and the
whole apparatus becomes decoration — which is exactly how `#124` survived on a site with five
passing gates.

So the evidence product needs, before any commitment scheme:

- **Every seeded fixture self-declares**, the way A2 does. A violation row must carry its own
  verdict — `EXPECTED` or `BREACH` — not rely on the reader knowing the fixture.
- **A canary per invariant**, not per suite. A2 proves tenant-isolation still fires; nothing proves
  A1 or A3 still fire. An assertion that silently stopped matching is worse than an absent one.
- **The runner ships with the assertions**, or the assertions are a document, not a gate.

That is a week of unglamorous work and it is the part that makes the cryptography worth anything —
a Merkle root over a corpus whose invariants nobody actually checks is a signed lie.

## 2. What the product actually is

> **A claim you publish, with a receipt that keeps working.**

Three properties, in priority order:

1. **Tamper-evident.** The evidence behind a claim is committed; altering it after the fact is
   detectable by anyone, without trusting you.
2. **Live.** The claim carries a verification timestamp and **decays visibly**. A receipt that has
   not re-verified in 30 days says so. This is the differentiator — every existing "verified badge"
   is a one-time stamp that silently rots.
3. **Selectively disclosed.** Reveal the fact, not the corpus. (Merkle path for public evidence;
   ZK for private.)

**The market research already happened, this week, on your own site.** Your CodeHawks receipt went
from a working public profile to *"Ranking: Unranked · High 0 Med 0 Low 0"* with no notice to you.
A cleared claim carried an unsupported number for a month. A reference document nearly caused two
other researchers' work to be published under your name. **Every organisation that publishes claims
has this problem and none of them know it.** That story sells the product better than any deck.

## 3. Architecture

```
  EVIDENCE            NORMALISE           PROVE              COMMIT             SERVE
  ─────────           ─────────           ─────             ──────             ─────
  contest reports     ecograph/ingest     invariant suites   canonical          verifier lib
  CI runs        →    → typed nodes  →    (zero-row)    →    serialize     →    receipt page
  attestations        + provenance        + receipt-check    → Merkle root       badge + API
  client audits       edges               (live fetch)       → chain anchor      ZK module
       │                                        │                  │                 │
       │                                        │                  │                 └─ anyone can
       │                                        │                  └─ EAS on Base (attestations are
       │                                        │                     the native primitive; do NOT
       │                                        │                     hand-roll a registry)
       │                                        └─ AI extracts + triages; DETERMINISTIC code decides.
       │                                           An LLM's opinion is never the proof (see §5).
       └─ every node carries source_system + evidence_pointer, exactly like jw3b.dev's register
```

**Overmind's role** is the honest one: it *orchestrates* the pipeline — ingest, re-verify,
re-anchor, escalate on failure — with its own governance gates (a phase transition that halts on an
EXCEPTION-severity violation is already the right shape). It is the operator, not the prover.

**KTHULHU's role**: the highest-value evidence source. An audit that reproduces an exploit on an
ephemeral fork is *already* a deterministic, replayable proof. Anchoring those is the flagship use.

## 4. Where I would aim it — and it is not auditors

The obvious market (auditors proving their track record) is small, poor, and mostly served by
vanity. Three better targets, best first:

1. **Tokenized RWA / ERC-3643 issuers.** They must continuously demonstrate that reserves back
   supply and that compliance paths hold. **You already wrote those invariants**
   (`05_rwa_assertions.cypher`). They have budgets, auditors, and a regulator asking. The product is
   *"a live, anchored attestation that the reserve invariant held at every block since issuance"* —
   and when it breaks, the receipt says so before the journalist does.
2. **AI corpus provenance.** Prove a training/RAG corpus did or did not contain a document, without
   publishing the corpus. Merkle for inclusion; ZK for exclusion-with-privacy. Genuinely hard, very
   topical, and your ingest pipeline is the front half of it.
3. **Compliance attestations** (the Kointel adjacency). *"Prove we hold consent for every subject in
   this dataset"* without revealing the register. POPIA/GDPR-shaped, and you already encode advice
   boundaries and PII-absence as graph invariants.

## 5. The three things that will bite

1. **"AI-attested" is not a proof, and selling it as one is the failure mode.** A model asserting a
   fact is evidence of nothing. The trustworthy core must be deterministic — the zero-row suites,
   the fetch-and-compare checks, the hash. AI belongs in extraction, normalisation and triage,
   clearly labelled, never in the verdict. Your own claims discipline already says this; the product
   must not quietly abandon it for a better pitch.
2. **Canonical graph serialization is the actual engineering problem.** Hashing a graph requires a
   deterministic ordering — node/edge sort, property normalisation, float and timestamp
   canonicalisation, a version tag. Get it wrong and the same graph hashes two ways, which destroys
   the whole product silently. This is where the real week goes, not the cryptography.
3. **Low-entropy commitments are brute-forceable.** `H("passed")` is not private, and neither is
   `H(client_name)`. Every commitment over a small domain needs a per-leaf salt (a nonce), stored
   with the evidence and revealed only with the proof. This is the mistake that turns a privacy
   product into a data leak.

## 6. Red team

1. **Why would anyone trust the anchor?** Because it is checkable without trusting you — but only
   if the verifier is open-source and someone else can run it. **Ship the verifier before the
   badge.** A badge whose verifier only you can run is a logo.
2. **What stops garbage-in?** Nothing. The chain proves *"this was committed at time T"*, never
   *"this is true"*. The invariant suite is what carries truth, and its quality is the product.
   Over-claiming here is fraud-adjacent — say plainly: *committed, not certified.*
3. **What happens when a re-verification fails?** This is the whole design, not an edge case. It
   must be **visible and public**, or the product is a rubber stamp. The receipt shows the failure
   and the last-good anchor. That is the behaviour worth paying for — and it is exactly what
   `receipt-check` did to jw3b.dev this week.
4. **Chain choice / cost.** Base + EAS. Attestations are the native primitive, revocation is
   built in, and hand-rolling a registry is a solved-problem tax. Batch to one root per interval;
   per-item anchoring will not survive contact with volume.
5. **Which regulation applies?** If any client evidence touches personal data, POPIA/GDPR apply to
   the *hashes* too where they are re-identifiable. Salt everything, and keep the graph
   PII-free-by-design as `06_support_agent.cypher` already does.

## 7. What I would build first

**Two weeks, no cryptography beyond SHA-256.**

1. `canonicalize(graph) -> bytes` + `merkleRoot()` + `proveLeaf()` + a standalone `verify()` that
   depends on nothing of ours. **The verifier is the product; write it first.**
2. Anchor jw3b.dev's **own** evidence register — 33 claims — as one EAS attestation on Base.
3. Point each `<Claim>` receipt at its Merkle proof. Re-verify nightly; **render the staleness**.
4. Dogfood the failure: break a claim on purpose and show the receipt going red in public.

That is a complete, honest, demonstrable product on a corpus you own, with no client data and no ZK.
**And it fixes your actual problem** — the receipt that died this week — rather than being a demo.

**Then**, and only then, one ZK module with one job: *prove a KTHULHU engagement produced N findings
of severity ≥ High, without revealing the engagement.* Circuit over a Merkle inclusion + a
comparison. Small, well-understood, and the first thing a client would actually pay to keep private.

**What I would not build:** ZK proofs *of graph queries* (research-grade), a general-purpose
"AI attestation" claim (indefensible), or per-item on-chain writes (cost).

## 8. The EcoGraph MCP

`neo4j-ecograph` is registered in `agilegypsy-website/.mcp.json` — **not in this project**, so I
could not call it from this session and read the repo instead. To use it here, add the server block
to a `.mcp.json` in the jw3b.dev working tree (password stays in the gitignored file, as it is now)
and approve it. Worth doing before any modelling work: interrogating the live graph beats reading
`.cypher` files, and the assertion suites are meant to be *run*, not read.

---

**One-line verdict:** the valuable product is **live, tamper-evident, selectively-disclosed
receipts** — and you already own the ingest, the ontology, the invariant pattern and the
orchestration. Drop "ZK" from the v1 name, ship the verifier, and keep zero-knowledge in reserve for
the client-confidential case where it is genuinely the only tool that works.
