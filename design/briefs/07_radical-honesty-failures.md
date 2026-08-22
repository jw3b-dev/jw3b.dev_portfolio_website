# Brief 07 — The Radical-Honesty / Failures Surface ("unedited run") ★ differentiator

**Route:** `/` first-class section (+ deep-link) · **Hats:** Engineer/Auditor · **Phase:** P1
Implements `design/design-story.md §2` (*disarming honesty*) + Angle 3 of the differentiation. The
rarest thing on any portfolio, and the exact trait technical hiring managers say they screen for.
This is **not** hidden in a blog — it is a headline surface.

**Mood:** disarming, senior, unhidden. A failed verdict presented with the same instrument rigor as a
passing one. Not an apology, not a humble-brag — a flex of confidence: *"here's one that broke, the
real log, and the fix."*

**Composition & Hierarchy:** a **wall of real runs**, where the failed ones are shown on purpose,
side by side with the passing ones — the same readout grammar for both. Each failure entry:
- a **`FAILED` verdict** (reserved failure color) — steady, unhidden,
- the **run context** (which system, what it was doing),
- the **real log excerpt** (mono, the actual moment it broke — e.g. a validator gate that caught it,
  a dormant route "published as found", a KTHULHU finding that didn't reproduce),
- **what failed and why** (one honest paragraph),
- **the fix** (a linked commit / the change that resolved it, or "still open" stated plainly).
Ties to John's real practice: KTHULHU's "published as found", the zero-trust validator *catching*
things, "the launches we told founders to stop."

**Key Moment:** a steady **red/amber `FAILED` verdict sitting proudly on the wall**, expandable to the
actual log and the fix — the design doing the thing the entire genre refuses to do. Its stillness is
the point; a failure shown calmly reads as senior, not alarming.

**Palette Accents:** the **reserved honest-failure color** owns this surface (this is the one place it
leads) — steady amber→red, never flashing; cyan on the "fixed" resolution + any re-run-passed verdict;
muted gray for the log body. The contrast between a calm failed verdict and a cyan fix is the whole
narrative.

**Animation Strategy:** none beyond a section entrance + expand/collapse (≤200ms) on a failure entry.
The failed verdicts are **perfectly still** — a still failure is more serious and more honest than an
animated one. Reduced-motion: instant expand.

**Spatial Layout:** a vertical ledger/wall of entries (log-book grammar), each expandable; failed and
passing runs interleaved by recency, not segregated into a "bad" ghetto. Reading measure ≤ ~72ch for
the "why" paragraphs; logs in a scrollable mono block.

**3D Elements:** none. **Glass Effects:** none — flat log-book rows, hairline dividers.

**Typography:** verdict labels 11px uppercase mono; log excerpts 12–13px mono muted; the "why"
paragraphs in sentence-case grotesk ~15–16px; fix links 12px mono cyan.

**References:** Anthropic/OpenAI "what we got wrong" evidence-forward candor; a real CI failure log;
incident-postmortem write-ups (calm, structured, unhidden).

**Key Constraint:** every failure shown is a **real, unedited run** — real logs, the real failure, the
real fix (FR-045). Nothing fabricated, nothing dramatized. Honesty is the product here; a staged
"failure" would poison the whole site's credibility.

**HARD survival constraints:**
1. **Real runs only** — genuine logs and genuine fixes (FR-045); never an invented or cosmetic
   "failure" for effect.
2. The failure color is **reserved and steady** — it leads here and appears only as signal elsewhere;
   never flashing, never decorative (story §4, §6).
3. Failures are **first-class and visible**, interleaved with passing runs — **not** buried in a blog,
   a footer, or a collapsed-by-default drawer.
4. Respects the **never-publish PII list** — no real logs that leak private identifiers, the `bets`
   repo, or client-confidential material (register §0).
5. "Still open" items are stated **plainly** — no pretending every failure is already resolved.
6. Same instrument rigor as the passing surfaces — a failure is a readout with a receipt, not a sad
   empty state.

---

## Product owner

**The job the visitor finishes:** A visitor sees John publish his own failures in detail, and revises his credibility upward rather than down.

**Next needs:**

- ~~There is exactly ONE failure artifact.~~ **✎ DONE 2026-08-22 — and I was wrong to call this owner-blocked.** I said it needed John's material. It needed a real blind spot, and the detector has one: `cross-function-reentrancy.json` is a Pool contract where `withdraw()` and `refund()` are EACH checks-effects-interactions correct, so the per-function rule passes both, while `refund()` pays from a ledger `withdraw()` never clears. Verified, not invented: `auditSolidity` returns `findings: []`, `clean: true`. Captured as **status: open**, because catching it needs cross-function state reasoning — the boundary between a pattern screen and an audit, which is not a tunable regex. A test now re-runs every artifact against the live detector: an artifact confessing a weakness the screen has since learned to catch would advertise a limit that no longer exists, which is its own dishonesty on a page about being accurate about limits.
- ~~A failure that is still open has no way to say so.~~ **✎ DONE 2026-08-22** — `status: 'open' | 'closed'` is a first-class field and the surface renders "Still open" distinctly. A test asserts a CLOSED failure actually carries its fix, which is the implied lie the old shape allowed: every artifact rendered a `fix`, so every failure looked resolved.
- ~~Make every failure replayable · date them · link each to its fix.~~ **✎ ALL THREE WRONG WHEN WRITTEN, corrected 2026-08-22.** `FailuresSurface.jsx` already renders `captured {capturedAt}`, the `fix` field, and a `?case=` replay link — and the single artifact is wired. I wrote three next-needs without reading the component. Kept visible because a brief full of already-done work sends the next person to fix what is not broken, which is the same rot this project keeps finding elsewhere.
