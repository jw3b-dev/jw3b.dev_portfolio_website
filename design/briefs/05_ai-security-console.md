# Brief 05 — AI Security Console (`/audit`)

**Route:** `/audit` (and the compact instance embedded in the hero) · **Hats:** Auditor+AI+Engineer ·
**Phase:** P1 (auditor) / P2 (fuzz + tx-explain)
Implements `design/design-story.md`. This is the hero's engine, expanded to its full surface — the
operable tool the Security Buyer runs.

**Mood:** a bench security instrument, powered on. You paste code; it works in front of you and
streams real findings. Calm, dense, exact — a professional tool, not a toy.

**Composition & Hierarchy:** two-zone operable layout — **input left, live readout right** (stacks on
mobile). Three tools as a segmented control in the console header:
1. **Solidity auditor** (default) — paste source → **streamed findings** (FR-008): a severity-coded
   findings table (High/Med/Low) with the finding, location, and recommendation, each a readout row.
2. **Fuzz-harness generator** (FR-009) — paste source → streamed Foundry/fuzz harness in a mono code
   block.
3. **Transaction explainer** (FR-010) — paste a Base tx hash → **client-decoded calldata shown first**
   (works even if the Worker is down), then a plain-language narration streams in.
The readout carries a **liveness tick** while streaming and a persistent **AI-assisted-first-pass
disclaimer** (FR-014, BR-10). Heuristic findings appear <300ms (real, deterministic, in-Worker); the
AI narrative appends after.

**Key Moment:** the **first heuristic finding landing in <300ms** with its severity, then the AI
narrative streaming in behind it — the tool is demonstrably *doing security work*, live, and it's
fast because the real work runs at the edge with no upstream dependency.

**Palette Accents:** graphite console; **severity grammar** = the reserved failure color scales for
High (the honest-danger red), amber for Medium, muted for Low — reserved and meaningful, never
decorative; cyan for the live tick, the run control, and a clean/`VERIFIED-no-issues` result; amber
for the disclaimer + any `RECORDED RUN` label.

**Animation Strategy:** real token/finding streaming (the latency is the proof); severity rows settle
then still; liveness tick. **No** fake progress bar, **no** typing-shimmer over canned text, **no**
count-up on the findings total.

**Spatial Layout:** input pane ~40%, readout ~60% desktop; readout is fixed-height-stable so 1s
streaming updates cause **no layout shift**; tools segmented in the header; mobile = input → readout.

**3D Elements:** none. **Glass Effects:** none — flat console, cyan edge-light when running.

**Typography:** all I/O in **mono** (source, findings, harness, hashes, calldata) — tabular where
numeric; finding titles 14px w600; severity labels 11px uppercase mono; disclaimer 12px muted amber.

**References:** a real Code4rena/CodeHawks finding report (severity table grammar); Linear/Sentry
issue-detail density; Etherscan tx-decode readouts (for tx-explain).

**Key Constraint:** the deterministic **heuristic pass runs in-Worker with no upstream dependency**,
so `/audit` returns **real findings even when Anthropic is down** — only the AI *narrative* falls back
to a labelled recorded run (Tier-1 KV → Tier-2 client). First-token ≤ 3s; effective success ≥ 95%.

**HARD survival constraints:**
1. The **AI-assisted-first-pass disclaimer is always visible** with output — never a substitute for a
   full professional audit (FR-014, BR-10). A severity label here is a public security claim; it must
   read as first-pass, not a verdict.
2. **Input validated** — source size cap, tx-hash format — with a **specific** error in the API's own
   words (FR-013), never a generic failure.
3. **Tag protocol parsed/stripped** before render (`[AUDIO]`/`[TOOL_CALL]`/`[RENDER_CARD]`) — no raw
   tags leak (FR-011/017).
4. Degrades to a **labelled recorded run** for the AI narrative; the heuristic findings stay real
   (BR-03) — never a broken/empty console.
5. Severity colors are **reserved signal** — the danger-red used for High findings appears nowhere
   decorative on the site (story §4).
6. **No client-side "estimated" findings** while waiting, no fabricated finding counts — real stream
   or honest recorded run only.

---

## Product owner

**The job the visitor finishes:** A visitor pastes a contract, watches it get screened, iterates on it, and leaves with an artifact worth keeping.

**Next needs:**

- **Compare two runs.** Runs accumulate as tabs, each pinned to the exact source it read — the hard part is done — but there is no side-by-side, which is the thing an auditor actually wants after applying a fix.
- **A shareable run.** Export is a local `.md` download. A permalink to a run (source hash + findings, no source stored) is what turns the console into something a visitor sends to a colleague.
- ~~Load an example.~~ **✎ DONE 2026-08-22** — three teaching contracts ship in `src/lib/auditExamples.js` as chips above the editor. Not from the Worker-side corpus this line proposed: they are client-side, and each is *tested* to raise exactly the finding it advertises and nothing else, so an example that quietly stopped demonstrating its own detector fails the suite rather than teaching a visitor the wrong lesson.
