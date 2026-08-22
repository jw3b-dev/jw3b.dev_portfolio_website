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
