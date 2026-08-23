# Claims sweep — all 31 cleared claims, checked against their source systems

**Why this ran.** Correcting CR-06 on 2026-08-22 exposed a hole no gate covered: `claims-gate`
proves a rendered figure matches the register, `claims-lock` proves the register has not drifted —
**neither can tell you a cleared number is unsupported by the system it names.** CR-06 had shipped
for a month reading *"13-phase pipeline"* against an engine with six phases. The obvious question
was how many of the other thirty had never had that check run. This is that check.

**Method.** For each claim: resolve its `source_system`, find the actual artifact (local repo,
rendered page, ledger read), and try to reproduce the figure. Every clickable receipt was opened in
a real browser, not curl — they are SPAs, and curl sees an empty shell that passes vacuously.

**Headline: seven receipts returned HTTP 200 and evidenced nothing.** One of them contradicted the
claim it was cited for, on the site's most load-bearing credential.

---

## P0 — the CodeHawks receipt contradicts the claim

`codehawks-124-rank` · `codehawks-124-findings` · `codehawks-124-exp` cited
**`https://profiles.cyfrin.io/u/agilegypsy`**, which `evidenceKind` renders as a clickable
*"View the receipt"* link — a contract the register's own doc comment states as *"a URL the reader
can open and check."*

Rendered, logged-out, today:

```
Ranking          Unranked
Total Findings   High 0   Med 0   Low 0
Earnings         0 USDC
```

Against a site that claims **#124 · 17 findings (8 High · 5 Med · 4 Low) · 1,430 EXP**. A skeptical
visitor — the exact reader this credential exists for — clicks through from a security auditor's
portfolio and lands on a profile showing zero findings.

**The credential is not in question.** `mas/facts/PORTFOLIO_REFERENCE.md §1b` records two dated
stats cards (4 Nov 2025 → 12 Jan 2026, #137→#124, 1,288.80→1,430.80 EXP, 13→17 findings), and the
complete First Flight #42 contest report is on disk at
`~/code/projects/audit/codehawks/snowman-merkle-airdrop/`. **Only the receipt broke.**

Cyfrin appears to have gated or dropped public competition stats:
`codehawks.cyfrin.io/profile/agilegypsy` → redirects to `/contests` ·
`codehawks.cyfrin.io/u/agilegypsy` → 404 · `profiles.cyfrin.io/u/agilegypsy/codehawks` →
redirects to `/login`.

**Action taken:** downgraded to attested, pointing at the dated stats cards and the contest report,
naming `codehawks.cyfrin.io/c/2025-06-snowman-merkle-airdrop` in prose. The UI now renders the `†`
attested mark instead of a link into a contradiction. **Restore the URL the moment Cyfrin shows the
record publicly again** — and see the owner action below for the better fix.

## P1 — four KTHULHU ledger figures cited a marketing homepage

`75 audits` · `76 fv-proven findings` · `438 dropped false positives` · `112+ merged PRs` all cited
`https://kthulhu.co`. The rendered homepage contains none of them; it is a product landing page.
The numbers are real and I reproduced three of them against
`mas/audits/KTHULHU_INFRA_AUDIT.md` (2,056 findings across 75 audits → 438 `dropped_fp`, 76
`fv_verdict='proven'`), which is a read of the production ledger — **the actual source**. Merged-PR
count is not publicly checkable at all: the repo is closed.

**Action taken:** all four downgraded to attested against the ledger read.
`kthulhu-paying-users` **keeps** its URL — the page does plainly evidence a live, priced product,
and the network check confirms it.

## P2 — a receipt pointing at a path that does not exist

`delivery-plants-countries` cited `docs/PORTFOLIO_REFERENCE §2`. There is no `docs/` file of that
name; the register lives at `mas/facts/PORTFOLIO_REFERENCE.md`. Path corrected.

---

## The full disposition

| Disposition | n | Claims |
|---|---|---|
| **Reproduced against source** | 9 | `overmind-governance-tests` (1,345 = 273 `npm test` + 1,072 `test:do`, **exact**) · `overmind-pipeline` (reconciled 2026-08-22) · `graphrag-chunks` (77k — `ecograph/README.md:5`) · `graphrag-retriever-uplift` (+18 pts — `ingest/graphrag_query.py:65`) · `graphrag-memory-recovery` (20%→43% = **2.15×**, supports ">2×") · `graphrag-entities` (register 9,828; README says "~9,800-entity" — consistent) · `kthulhu-audits-run` · `kthulhu-fv-proven` · `kthulhu-fp-dropped` |
| **Receipt opened and confirmed** | 7 | `kthulhu-paying-users` + all six Neo4j GraphAcademy certificates (each renders the course title **and** the holder's name) |
| **Receipt broken → downgraded** | 7 | the 3 CodeHawks + 4 KTHULHU above |
| **Pointer path corrected** | 1 | `delivery-plants-countries` |
| **Uncorroborated — attested, no local artifact** | 10 | `overmind-corpus` (192,000+ — no occurrence anywhere in MB-agentic, KTHULHU or AgileCEO; plausibly lives in a database rather than a file) + the 9 certificate claims, which are PDFs and result letters not present in any repo |

**"Uncorroborated" is not "doubted."** Owner-attestation is a legitimate evidence tier and the UI
already distinguishes it — `<Claim>` renders `†` and no link, precisely so an attested figure cannot
be mistaken for a checkable one. It is recorded here so the distinction is visible, not implied.

---

## The gate this produced — `scripts/receipt-check.mjs`

Two modes, because the useful check and the deterministic check are not the same check:

- **Structural (blocking, in CI).** Every cleared claim with a URL pointer must declare, in
  `EXPECTATIONS`, the text its page has to contain. A new URL pointer with no entry **fails**. This
  forces "is this really checkable?" to be answered when the pointer is written.
- **Network (`--net`, on demand).** Loads each receipt in a real browser and asserts the text is
  there. Deliberately **not** blocking: a third party's outage is not our regression, and a gate
  that goes red for reasons the team cannot fix is a gate the team learns to bypass.

Current state: **7 linked receipts, all declaring what they must show, all passing the live check.**

---

---

## Addendum — the replacement receipt, and what stopped it

Acting on owner action 1 below (*publish the First Flight #42 report*) surfaced a **P0 in the
evidence reference itself**, and the build was stopped before it shipped.

`PORTFOLIO_REFERENCE §1b` said a full contest report was on file *"with two written findings"* and
was *"publishable as a sample audit report."* Reading the actual files:

- `John Wellard-Snowman-Merkle-Airdrop.md` — John's **personal** CodeHawks report — reads
  **High: 0 · Medium: 0 · Low: 0**, and is dated **15 Jun 2025**, four days before the contest
  closed. It is an empty mid-contest template.
- The two write-ups §1b described are in the **contest-wide** report, where every finding lists
  dozens of validated submitters and names one *"Selected submission by"*. For **H-01** that is
  `nomadic_bear`; for **M-01**, `robercano`.

**Publishing it as John's sample audit report would have put two other researchers' work on his
portfolio under his name** — on the site of a security auditor, in the same week its whole subject
was attribution. §1b is corrected.

**What the report does establish, read directly:** `agilegypsy` appears in the validated-submitter
list for **exactly two** findings and no others — **H-01 · Unrestricted NFT Minting in
`Snowman.sol` (High)** and **M-01 · DoS to a user trying to claim a Snowman (Medium)**. A validated
High in a public contest is real and specific. The substance was always right; the packaging was
wrong.

**Shipped instead:** a new claim `codehawks-ff42-validated` — *"2 validated findings — 1 High,
1 Medium"* — rendered on the CodeHawks surface with both findings named, worded as **validated
submissions** and never as authorship, with a test asserting the surface never says
*wrote / authored*. **A named finding in a named contest is stronger evidence than the rank number
that broke** — a reader can go and read it.

### Then the owner supplied his contest list, and the record turned out to be 3.5× bigger

Asked whether any of his First Flights matched, and given the catalogue: **eight** of them have
local contest directories — **#42, #43, #48, #49, #50, #51, #52, #53** — against a site that knew
about **one**.

Three of those eight have Cyfrin's **official results** on disk. Parsing each finding's
`_Submitted by …_` set for `agilegypsy`:

| Contest | Validated findings |
|---|---|
| **#42 · Snowman Merkle Airdrop** (Jun 2025) | H-01 Unrestricted NFT Minting **(High)** · M-01 claim DoS (Medium) |
| **#49 · Bid Beasts** (Sep 2025) | H-01 Unauthorized withdrawal in `withdrawAllFailedCredits()` **(High)** · L-01 wrong event emission (Low) |
| **#52 · BriVault** (Nov 2025) | H-01 Repeat `joinEvent` inflates `totalWinnerShares` **(High)** · M-01 ghost state on `cancelParticipation()` (Medium) · M-02 `joinEvent` DoS (Medium) |

**Seven validated findings across three contests — three Highs, in three different codebases.**
That is a materially stronger record than the aggregate the site had been leaning on, and unlike
`#124` it is composed of things a reader can go and read.

### And then two more reports turned up, one of them carrying John's own published prose

The three-report figure above was wrong within the hour, for a reason worth recording: the first
pass searched **filenames** for `result` / `report` / `findings`. The reports for **#50** and
**#51** are named after their contest and sit at the directory root. Searching for the **content**
signature — the literal string `Selected submission by` — found all five at once. *Look for what a
document is, not for what someone named it.*

Also methodological: Bid Beasts ships **both** a preliminary and a final report. The preliminary
credits `agilegypsy` on **nothing**; the final on two findings. Reading the wrong file would have
silently understated the record.

| Contest | Validated findings |
|---|---|
| **#50 · Raisebox Faucet** (Oct 2025) | H-03 reentrancy in `claimFaucetTokens` **(High)** · M-01 `burnFaucetTokens()` drains full balance (Medium) · **L-01 incorrect comparison operator (Low) — SELECTED** |
| **#51 · Company Simulator** (Oct 2025) | H-02 deposit slips accept investor funds without minting shares **(High)** |

**Final tally: 11 validated findings across 5 First Flights — 5 High, 4 Medium, 2 Low.** Against a
site that opened the day claiming a rank with a receipt that said *Unranked*.

### The artifact I said did not exist

On **#50 L-01**, Cyfrin's report reads **"Selected submission by: agilegypsy"** — chosen from the
**24** researchers who reported that bug. The published prose (Root + Impact, annotated Solidity
showing `<=` where `<` belongs, likelihood/impact breakdown, remediation) **is John's writing,
published officially by Cyfrin.**

That is precisely the sample audit report `PORTFOLIO_REFERENCE §1b` believed it had and did not —
it named the #42 contest report, which is other researchers' work. The real one was two directories
away, in a file nobody had opened.

It is a **separate register claim** (`codehawks-selected-writeup`) and stays separate on purpose:
*validated* means the finding was real; *selected* means his write-up became the canonical version.
Merging them would promote ten findings to the standing of one.

**The remaining three contests are deliberately NOT claimed.** #43, #48 and #53 hold only John's own tooling output — no Cyfrin results — and an unverified
contest is worth less than the space it takes. Fetching those three results reports is the
highest-value thing left on this thread: at the observed rate (11 findings from 5 contests) they
would likely add another five or six, and possibly a second selected write-up.

The claim value is **generated** by `summary()` in `src/data/codehawks-contests.js` and pinned to
the register by a test, so a finding added to the rows without regenerating the string fails rather
than desyncing quietly.

Still open, and genuinely the owner's: John's own 13 write-ups in `ai/markdown/` are his work
product against the same codebase. They could anchor an **auditor demo** (this is what my tooling
found), but they are not contest-validated and must never be presented as if they were.

---

## Owner actions

1. **The CodeHawks receipt is the real loss** — it was the one independently checkable proof of the
   audit record, and it is gone through no fault of yours. Three options, best first:
   **(a) publish the First Flight #42 report on jw3b.dev** as a real on-site artifact — the file
   exists, `PORTFOLIO_REFERENCE §1b` already calls it *"publishable as a sample audit report"*, and
   a written audit with annotated Solidity is a stronger proof to a client than a rank number ever
   was; **(b)** link `code4rena.com/@AgileGypsy` (resolves 200 — I have not checked what it
   displays); **(c)** restore the Cyfrin link if they bring the stats back.
2. **`overmind-corpus` (192,000+)** — if that figure is derivable from something (a table count, an
   index size), say where and it becomes source-verified like CR-05 did.
3. **The nine certificates** — several carry verifiable IDs (Chainlink `CLF-9XSZOBM7L2SPS`, Cyfrin
   `RJA259ONK621` / `IUY789PSN004` / `1KG922MS21NX`, APM `P0528947`). If any issuer has a public
   verification URL, those claims can move from attested to checkable.

**Score: seven escalations challenged, five were wrong** — and two of the wrong ones were found by
this sweep rather than by anyone raising them.
