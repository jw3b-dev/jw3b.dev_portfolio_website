# Role ledger — jw3b.dev v2 build (role-first hard rule)

**Invariant:** every build task is done *in role* — its role Skill was loaded BEFORE any
file was touched. No row may be `n`. Verify:

```bash
# match only a SKILL-LOADED table cell equal to n (pipe, spaces, n, spaces, pipe)
grep -nE '^\| .*\| +n +\|' mas/ROLE_LEDGER.md && echo "VIOLATION: task(s) not done in-role" || echo "OK: all tasks in-role"
```

Legend — SKILL-LOADED: `y` = role skill loaded this session before the work ·
`prior` = completed in the pre-compaction session with its role per the MAS log ·
`n` = NOT loaded → must be redone with the skill loaded.
"Role (actual)" names the closest-fit skill when the PLAN role has no skill of that name.

**Substitutions retired 2026-08-16:** the six previously-missing PLAN roles now exist as real
user-scope skills (`~/.claude/skills/`) + jw3b project-scope overrides (`.claude/skills/`), authored
via `example-skills:skill-creator` — **smart-contract-engineer · web3-blockchain · full-stack-integrator ·
portfolio-evidence · audit-heuristics-engineer · devops-engineer**. Every task originally done under a
closest-fit substitute was then **re-verified in-role** (see the "Redo sweep" section) — those rows now
read `real-role ✓ re-verified (was <sub>)` with both the original and redo commits. From P2-02 onward
each PLAN role loads its OWN skill; no substitution remains anywhere in the ledger.

| TASK  | PLAN role | Role (actual) | SKILL-LOADED | COMMIT |
|-------|-----------|---------------|--------------|--------|
| P0-01 | lead-architect | lead-architect | prior | (prior session) |
| P0-02 | art-director | art-director | prior | cb1667c |
| P0-03 | brand-architect | brand-architect | prior | 4ddad49 |
| P0-04 | domain-engine | domain-engine | prior | e971a6a |
| P0-05 | backend-specialist | backend-specialist | prior | c3ba300 |
| P0-06 | backend-specialist | backend-specialist | prior | c3ba300 |
| P0-07 | domain-engine | domain-engine | prior | e971a6a |
| P0-08 | portfolio-evidence | portfolio-evidence ✓ re-verified (was compliance-officer) | y | 59e25aa → 623186a |
| P0-09 | full-stack-integrator | full-stack-integrator ✓ re-verified (was frontend-engineer) | y | ad23ad9, 2364d2a → a1d3f20 |
| P0-10 | domain-engine | domain-engine | y | 646796c, 2364d2a |
| P0-11 | lead-architect | lead-architect | y | 7e610ce, 2364d2a |
| P0-12 | devops-engineer | devops-engineer ✓ re-verified (was security) | y | 69a44d1 → 028fed4 |
| P1-09 | frontend-engineer | frontend-engineer | y | 2364d2a |
| P1-01 | backend-specialist | backend-specialist | y | 57cc24c |
| P1-02 | backend-specialist | backend-specialist | y | 66d59ac |
| P1-03 | domain-engine | domain-engine | y | 14651bb |
| P1-05 | audit-heuristics-engineer | audit-heuristics-engineer ✓ re-verified (was domain-engine) | y | ad81ff3 → 3e571f0 |
| P1-04 | backend-specialist | backend-specialist | y | cc5d236 |
| P1-06 | backend-specialist | backend-specialist | y | 2bb633e |
| P1-07 | full-stack-integrator | full-stack-integrator ✓ re-verified (was frontend-engineer) | y | 289560f → a1d3f20 |
| P1-08 | full-stack-integrator | full-stack-integrator ✓ re-verified (was frontend-engineer) | y | cafd28e → a1d3f20 |
| P1-18a | domain-engine | domain-engine | y | 2bb633e (retainer.json catalog seed; loadout logic pending in P1-18) |
| P1-10 | frontend-engineer | frontend-engineer | y | 884e576 |
| P1-11 | frontend-engineer | frontend-engineer | y | 348738b |
| P1-12 | frontend-engineer | frontend-engineer | y | 03a2ace |
| P1-14 | frontend-engineer | frontend-engineer | y | 68634a1 |
| P1-15 | frontend-engineer | frontend-engineer | y | 08921b2 |
| P1-16 | synthetic-data | synthetic-data | y | 3f065be |
| P1-13 | frontend-engineer | frontend-engineer | y | c390640 |
| P1-17 | app-ui-engineer | app-ui-engineer | y | d4d9cb0 |
| P1-18 | domain-engine | domain-engine | y | 1beb03f |
| P1-19 | app-ui-engineer | app-ui-engineer | y | 90a0d9c |
| P1-20 | compliance-officer + frontend-engineer | compliance-officer + frontend-engineer | y | be747a1 |
| P1-21 | lead-architect | lead-architect | y | 5bb215a |
| P1-22 | portfolio-evidence | portfolio-evidence ✓ re-verified (was compliance-officer) | y | fc56f53 → 623186a |
| P1-GATE | qa-tester + security + codebase-auditor + compliance-officer + performance-monitor | (all 5, in-role) + frontend-engineer for PRIVACY-01 fix | y | d7344da |
| P2-01 | smart-contract-engineer | smart-contract-engineer ✓ re-verified (was domain-engine) | y | 1a4d41b → 5481ac7, 75d6f43 |
| P2-02 | smart-contract-engineer | smart-contract-engineer (real skill — first no-substitution P2 task) | y | a4c4ef1 |
| P2-03 | web3-blockchain | web3-blockchain (real skill) | y | 409a5bb |
| P2-04 | app-ui-engineer + full-stack-integrator | app-ui-engineer + full-stack-integrator (both real) | y | a4a6286 |
| P2-05 | full-stack-integrator | full-stack-integrator (real) | y | 2bb796c |
| P2-06 | domain-engine | domain-engine | y | 74a8b68 |
| P2-07 | app-ui-engineer | app-ui-engineer | y | 2f6d2c2 |
| P2-08 | backend-specialist | backend-specialist | y | a7a914a |
| P2-09 | app-ui-engineer | app-ui-engineer | y | eedb6c3 |
| P2-10 | frontend-engineer | frontend-engineer | y | 6a2f2f1 → 8a4e449 (KTHULHU embed→linked launch card: kthulhu.co refuses framing, verified live) |
| P2-11 | creative-technologist | creative-technologist (NON-3D per design lock — stated) | y | 6e6bf8b |
| P2-12 | frontend-engineer | frontend-engineer | y | 807ac7c |
| P2-13 | frontend-engineer | frontend-engineer | y | b93eea2 → 41a2cb3 (wired FlagshipShowcase onto a dedicated /work route + nav link; was mounted on no route) |
| P2-14 | backend-specialist + audit-heuristics-engineer | backend-specialist + audit-heuristics-engineer | y | e114b44 |
| P2-15 | audit-heuristics-engineer | audit-heuristics-engineer | y | e442120 |
| P2-16 | full-stack-integrator | full-stack-integrator | y | 6fbb236 |
| P2-17 | full-stack-integrator + domain-engine | full-stack-integrator + domain-engine | y | 05d2841 |
| P2-18 | synthetic-data | synthetic-data | y | 343f4c6 |
| P2-19 | frontend-engineer | frontend-engineer | y | 9507ddd |
| P2-GATE | qa-tester + security + codebase-auditor + compliance-officer + performance-monitor + web3-blockchain | (all 6, in-role) | y | PASS — report mas/audits/P2-GATE_0_SUMMARY.md |
| PROV-01 | devops-engineer | devops-engineer (deploy wiring: reuse old + provision new) | y | e9bffd3, a86b761, cc29e4b, 196e4f0, f682c99 (+runbook) |
| PROV-02 | backend-specialist | backend-specialist (worker auth: dual-credential sk-ant-oat/api so reused secret works) | y | aaf14db |
| PROV-03 | devops-engineer | devops-engineer (v2 preview-deploy CI → isolated -v2 test URLs; reuse configs+secrets; --config discovery fix) | y | fc584cd |

## Redo sweep — 2026-08-16 (real roles now exist; every substituted task re-verified in-role)

After the six missing role skills were authored, John asked the real roles to redo everything
that had been done under a closest-fit substitute. Each was re-verified against its proper
role's standard and **every one found and closed a real gap** (not a no-op):

| TASK | Real role (now loaded) | Redo commit | Gap the substitute missed → fix |
|------|------------------------|-------------|----------------------------------|
| P2-01 | smart-contract-engineer | 5481ac7 | No Slither pass + no stateful invariant → ran Slither (fixed `_owner` shadow), added balance==Σfunded invariant (128k calls) |
| P1-05 | audit-heuristics-engineer | 3e571f0 | reentrancy/tx-origin had no NEGATIVE (false-positive) case → added CEI-safe + msg.sender negatives + determinism |
| P0-09, P1-07, P1-08 | full-stack-integrator | a1d3f20 | ConnectButton had ZERO tests; ChatWidget failure-ending untested at the seam → added both (BR-09 honest label, FR-020 floor) |
| P0-08, P1-22 | portfolio-evidence | 623186a | client blocklist enforced 4 of 7 register-declared forbidden items → added Neo4j GDS / "combined experience" / "dollar bounties" + a guard that enforces every register.forbidden item |
| P0-12 | devops-engineer | 028fed4 | 20 forge tests ran only locally → added a Foundry `contracts` CI job (fmt + test) |

**Knock-on audit (post-sweep):** traced every redo's production change to its consumers. Only 3 touched
non-test code — MilestoneEscrow.sol (param rename), claimsValidate.js (+3 patterns), ci.yml (additive).
One real drift found + fixed: the escrow **ABI** was stale after the `_owner`→`initialOwner` rename →
re-exported (`75d6f43`, name-only diff). The blocklist +3 blocked **0** of 28 claims (worker KB + all
P1 surfaces unaffected). No downstream task needed redoing (P2-04, the only ABI consumer, isn't built
yet). Ci.yml has no consumers.

Final consolidated state — **all green**: 222 vitest + 20 forge tests; coverage thresholds met;
claims-gate 28 cleared; Slither clean (bar the benign OZ-pragma note); build + secret-scan clean;
nothing deployed/pushed. The main table above now shows each redone task in-role with both commits;
no `(no such skill)` substitution remains.

## Post-P2 audit & gap remediation — 2026-08-16 (user-requested full v1↔v2 audit)

John asked for a full v1↔v2 codebase + cloud-infra audit + gap report before continuing, then
"full gap tested fixes to P2 handover" with standing authority to push/deploy the **preview** (test
URL) autonomously; production stays owner-gated. See `mas/P2_HANDOVER.md`.

| TASK | Role | SKILL-LOADED | COMMIT | Outcome |
|------|------|--------------|--------|---------|
| AUDIT-01 | codebase-auditor | y | b6ff2fb | Full v1↔v2 audit (code+infra) → `mas/audits/V1_V2_FULL_AUDIT.md`. 0 P0 · 1 P1 · 3 P2 · 3 P3. Verdict: v2 ≥ v1 on every dimension. |
| GAP-01 | devops-engineer | y | b6ff2fb | CSP/headers missed `/` on the live SPA (`wrangler-action` shipped a wrangler that ignored `run_worker_first`). Pinned `wranglerVersion 4.123.0` (CI) + `npx wrangler@4` (RUNBOOK prod) + corrected the stale `_headers` note. **Verified live:** `/` → CSP + x-served-by + no-store. |
| GAP-02 | backend-specialist | y | f37978e | Restored v1's bounded Anthropic retry (429/529 + Retry-After) before the Workers-AI fallback — shared `anthropicFetch()` across concierge/audit/fuzz/tx + 12 tests. |
| GAP-03 | devops-engineer | y | b6ff2fb | Hashed `/assets/*` immutable caching (same root cause as GAP-01). **Verified live:** `…max-age=31536000, immutable`. |
| GAP-01-guard | codebase-auditor + devops-engineer | y | (this handover commit) | `src/lib/__tests__/siteWorkerHeaders.test.js` — CI regression guard on worker.js header logic (3 tests). |

**Deferred (owner's-call, NOT defects):** GAP-05 (Education content dropped — deliberate proof-first IA),
GAP-06 (`[RENDER_CARD]` inline pricing card + CV chat link — design decisions; parser support exists),
GAP-07 (cosmetic corpus-count comment; same live Neon table). **Hygiene:** `.claude/skills/` (6 project-scope
role skills) is untracked — track in a follow-up. **v1-prod exposure:** jw3b.dev keeps shipping no CSP until
v2 is promoted with wrangler ≥4 (or a v1-repo hotfix — out of the v2 build's scope).

Gate at handover — **all green**: lint · 66 files / 415 vitest · coverage 99.07/94.92/100/100 · GAP-01/03 live-verified on the preview.

## P3 — GA hardening + XMTP + provisioning (in progress)

| TASK | PLAN role | Role (actual) | SKILL-LOADED | COMMIT |
|-------|-----------|---------------|--------------|--------|
| P3-01 | full-stack-integrator | full-stack-integrator | y | a1aa32c |
| P3-05 | full-stack-integrator + backend-specialist | full-stack-integrator + backend-specialist | y | ac70695 |
| P3-06 | frontend-engineer | frontend-engineer | y | (this commit) |

**P3-01 — XMTP E2E messaging (FR-039).** Migrated to `@xmtp/browser-sdk@7.1.0` (MLS): pure FSM
`src/lib/xmtpFlow.js` (+27 tests, added to the coverage gate) + effectful `src/hooks/useXMTP.js` (wagmi
EOA signer + **lazy** WASM import, degrade-first) + `src/components/messages/XmtpChannel.jsx` (6 states —
connect/start/initializing/conversation/unreachable/error — each keeping the book-a-call floor one click
away) + `src/pages/Messages.jsx` (flag `xmtp` **AND** a provisioned `VITE_XMTP_RECIPIENT` → live channel;
either missing → RouteGate floor). Vite: `@xmtp/*` excluded from prebundle + own code-split chunk +
`target: esnext` (WASM top-level await); the 12.8 MB WASM downloads ONLY when a visitor starts the channel
(off the boot path / first paint). **Flag stays OFF (fails closed)** until John provisions his XMTP
recipient and the live wallet→inbox→message path is verified — owner-gated, exactly like escrow/Unlock/CTF.
Gate green: lint · 67 files / 442 tests · coverage 99.15/95.41/100/100 · build 0-warn · claims · secret-scan.

**P3-05 — Voice STT/TTS (FR-016).** The three verifications (mic→STT→text, `[AUDIO]`→TTS→playback,
mic disables gracefully) were already met by the AI-tier restore (`voice.js` + `useVoice` + ChatWidget).
Formal completion: extracted the named `src/components/chat/VoiceControls.jsx` (`SpeakerToggle` +
`MicButton`, presentational, mic hidden when the browser can't record) and refactored ChatWidget onto it
(behaviour/aria/classes preserved); added the **R2 recorded-audio fallback** to `handleTts` — on live-Aura
failure it serves a pre-recorded clip keyed by `sha256(text)` from R2, else the silent 204 (never a 5xx).
+2 tests (VoiceControls render/aria + R2 fallback all branches). **Deviation:** the STT/TTS worker route
lives in `voice.js` (built during the AI-tier restore), not the PLAN's `speech.js` — same functionality,
better name (it owns both STT and TTS); left as-is to avoid churn. Gate: lint · 69 files / 452 tests ·
coverage 99.15/95.41/100/100 · build 0-warn · claims · secret-scan.

**P3-06 — Content-gap explainer pages (FR-055, COULD).** Two `/thesis/*` pages —
`src/pages/thesis/SystemsAreGraphs.jsx` ("systems are graphs" — graph-native engineering / GraphRAG)
and `ZeroTrustValidator.jsx` ("reproduce, don't assert" — the proof-not-promises security thesis) —
lazy-routed in App.jsx, article-typed SEO (branded + content-gap search), cross-linked to each other
and into the audit console (no orphans/dead-ends), and surfaced from the site footer for crawl
discovery. Claims-safe (no numeric claims — claims-gate clean). +1 render/link smoke test. Gate:
lint · 70 files / 454 tests · coverage 99.15/95.41/100/100 · build 0-warn · claims · secret-scan.

**Concierge degrade fix (found while John tested P3).** The preview concierge intermittently degraded
to the recorded run. Root cause (diagnosed by hitting the live workers directly — /audit/Opus worked,
concierge/Haiku returned a 200 then a 0-byte body): the concierge committed to the Anthropic (Haiku via
oat) response on its initial 200 and never fell back when that stream then errored or came back EMPTY,
so the client saw an empty reply and dropped to its Tier-2 bundled run. Fix (full-stack-integrator +
backend-specialist): `conciergeLiveStream` pumps Anthropic → falls back to Llama IN THE SAME response on
empty/errored Claude (mirroring v1's `!emittedContent` fallback); both-empty → empty stream → client
Tier-2 floor. +4 tests. Gate: lint · 71 files / 458 tests · coverage 99.15/95.41/100/100 · build 0-warn ·
claims · secret-scan.

**Concierge persona + voice UX fix (John caught both live).** (1) Identity leak — Haiku introduced itself
as "Claude Code, Anthropic's official CLI" because the oat-token auth requires that identity as the FIRST
system block: added a `PERSONA_GUARD` to the concierge's own system block that overrides it for the
visitor-facing persona. (2) "No audio" — the pipeline was intact (verified live: Aura TTS returns
audio/wav, CORS allow-origin + preflight OK, the `[AUDIO:"…"]` tag parses from the accumulated stream);
it's opt-in, so enabling the speaker now speaks the last reply immediately (within the click gesture →
discoverable + autoplay-permitted). Gate green.

**Correction — the ACTUAL "no audio" root cause (found via chrome-devtools in-browser):** `play()` failed
with `NotSupportedError: no supported source`, NOT autoplay. `@cf/deepgram/aura-1` returns **MP3** (magic
`ff f3` = MPEG ADTS layer III), but `/text-to-speech` labeled it `audio/wav`, so the browser couldn't
decode it → silence. Fix: the worker now sends `Content-Type: audio/mpeg` (and the R2 key → `.mp3`). The
opt-in toggle-speaks-on-enable stands as a UX win. But the MIME fix alone wasn't enough — the HTML
`<audio>` element still rejected the raw MP3 STREAM (frame-sync, no container/ID3) with NotSupportedError,
while WebAudio `decodeAudioData` decoded the SAME bytes fine (verified in-browser: `OK dur=1.49s`). Final
fix: the client plays TTS via WebAudio (`decodeAudioData` + `AudioBufferSourceNode`, AudioContext resumed
on the toggle gesture), not `new Audio()`. The audible fix = worker `audio/mpeg` + client WebAudio.

**Live-voice (P3 · BUILT + BROWSER-VERIFIED on the preview) — free on-device real-time voice.**
Deep-researched the *unpaid* path: the Web Speech API is Brave-blocked, but **on-device transformers.js
Whisper (WebGPU→WASM)** is free, private (audio never leaves the browser), real-time, and works in Brave.
Landed (`b556055` foundation · `bbd5a86` runtime · `8a7a43a` full loop · `2791b43` verified fixes):
`voiceLive` flag (default OFF; preview build lights it via CI env) · pure `voiceSession.js` FSM +
`micTurn.js` audio math (RMS/hysteresis-VAD/16k resample/turn classify — both full-coverage) ·
`useLiveVoice.js` full loop: mic frames → 900 ms endpoint → on-device Whisper → concierge SSE (shared
tag protocol) → Aura TTS via WebAudio → loop, with barge-in (louder echo-guard bar), 4-min session cap,
generation-counter stop-safety, every failure → honest ERROR strip naming the working fallback ·
call strip UI in ChatWidget. **Verified live in-browser** (fake mic = real Aura speech, all else genuine):
loading→listening→transcript→thinking (Claude streams)→speaking→listening loop-back; cap + manual stop.
**Hard-won plumbing (in code comments too):** HF 404s model fetches from `*.workers.dev` page origins →
site worker serves a same-origin `/hf-models/*` mirror (strict allow-list, immutable edge cache; CSP
needs no HF hosts); ORT runtime self-hosted via `?url` (default = jsdelivr, CSP-blocked) with
`useWasmCache=false` (blob: import); WASM floor pinned to **fp32** (pinned ORT rejects every QDQ
quantized whisper-base variant: "qdq_actions… Missing required scale"); `requestAdapter()` pre-flight
picks the engine (gpu-object-without-adapter machines route to WASM — a post-failure retry can't work,
the library caches the rejected session).

**Owner-feedback hardening round (a488f0a · 7fc4183 · a2fcb11 — all browser-verified):** John's real-
machine testing surfaced and we fixed: (1) *"not listening"* → fixed VAD gate replaced with per-session
**room calibration** (~0.7s idle median ×3, clamped 0.003–0.05; `calibrateVad` pure+tested) + a live
mic-level meter in the strip; (2) *"forever to load"* → WASM floor switched to **whisper-tiny fp32**
(~152MB vs 290, ~3× faster CPU; WebGPU keeps base) + live download-% + one-time honesty note;
(3) *~20-min "transcribing" hangs* → his Brave returns a **software WebGPU adapter (llvmpipe)**; pre-
flight now rejects software adapters (`isFallbackAdapter`/llvmpipe/SwiftShader/lavapipe), warm-up
inference runs under a 20s watchdog during LOADING, and a per-turn 20s watchdog falls back one-way to
**server Whisper** (`encodeWavPcm16` WAV → `/speech-to-text`, same utterance retried, disclosed in the
strip — audio leaving the browser must be visible); degrade chain webgpu-base → wasm-tiny → server,
each step verified live (incl. WASM hard-disabled → disclosed server-floor loop). New TRANSCRIBING FSM
state ("Heard you — transcribing…"). (4) *"star star" TTS + strip garbage* → `sanitizeSpeech`/
`stripMarkdown` (pure+tested) at both TTS choke points; `trimPartialTag` (client-only, in tagProtocol,
drift grammar untouched) kills mid-stream `[AUDIO: "` flashes; **voice turns now mirror into the chat
thread** as real bubbles (🎙 transcript + full markdown reply), so spoken-summary-vs-written-detail
reads as intended. **Barge-in browser-verified:** loud speech during THINKING flipped to LISTENING in
≤300ms, aborted the reply, and the interruption ran as its own complete turn (two 🎙 bubbles).
**Open (owner):** real-hardware WebGPU pass (no hw adapter anywhere I can test); tiny's proper-noun
accuracy (CodeHawks→"co-dox" — options: whisper-small on real GPUs, or default the floor to server
STT for accuracy over privacy); `voiceLive` ON for prod is John's call.

**P3-07 (frontend-engineer) — GitHub ↔ site reinforcement (FR-056) · DONE (`e7c6099`).**
`RepoLinks.jsx` on the flagship surface: `github.com/jw3b-dev` (rel=me) + the four public non-fork
claim-supporting repos (solidity-audits · the site's own source · development_agent ·
cyfrin-updraft-track), every href curl-verified 200 pre-link; MB-agentic is 404 (not public) and
deliberately absent; commercial flagships' closed-source status stated honestly; forbidden-repo
absence (bets/DecentX) asserted in test. Live-verified on `/work`. Remaining P3 is owner/research-
gated (P3-02 provisioning · P3-03/04 legal research · P3-09 external input) except P3-08 (GA sweep).

**P3-08 (qa-tester + security + codebase-auditor + performance-monitor) — GA sweep · PASS w/ 2 findings, both fixed+re-verified (`mas/audits/P3-08_GA_SWEEP.md`).**
FINDING-1 (P1): rate limiting silently failed OPEN live — v1's reused D1 table shape made every v2
UPSERT throw (IF-NOT-EXISTS migration no-op'd over v1's table). Fixed: `rate_limits_v2` table +
migration 0002 applied remote; re-probed 10×200→429×3. FINDING-2 (P2): axios <1.18.0 transitive
advisories → `overrides` pin ^1.18.0 (closes P2-GATE backlog SEC-P2); audit high 5→4 (rest =
Node-only stubbed chain). Perf: LCP 1.107s ✓ · first-token ~230ms ✓ · CLS 0.10 (watch). SC-5: 4
CodeHawks surfaces. **Incident:** a piped-exit-masked chain + prod-named root config briefly
deployed v2 to production jw3b.dev (~3–4 min); rolled back to John's prior version and verified;
guardrail: both wrangler configs now default to `-v2` names (prod promotion = explicit `--name`).
Remaining Ps are all owner-gated: P3-02 (addresses) · P3-03/04 (legal research) · P3-09 (OD-04).

**P3-03 + P3-04 + P3-09(dispositions) (research-specialist → compliance-officer + frontend/app-ui + backend-specialist) — DONE.**
The 6 `[NEEDS RESEARCH]` items were assigned to research/compliance ROLES, not John — researched at
HIGH confidence (`docs/COMPLIANCE_RESEARCH.md`; key currency: **AI Act Art. 50 in force 2 Aug 2026**
— site already compliant via FR-021; **EDPB blockchain Guidelines v2.0 final 7 Jul 2026** — wallet
address = PII, nothing identifying on-chain ✓). Encoded (`docs/COMPLIANCE.md`): P3-03
`ConsentBanner.jsx` behind new `consent` flag (OFF — verified cookieless, banner = contingency +
standing rule); P3-04 `terms.md` + `CheckoutTerms.jsx` structurally gating BOTH paid rails
(state-machine tests prove pre-acceptance unreachability; floor friction-free); DSAR runbook +
privacy-notice updates (30-day commitment, regime statement, wallet-as-PII); data-minimization fix —
`rate_limits_v2` raw-IP rows now purge (~10 min) in `rateLimit.js`. Gate 76 files/531 tests green;
both -v2 targets deployed; prod untouched. **P3-09 closes on one owner line: "OD-04: ratified"
(strictest-rule lead recommended, already what ships).**

**P-SERIES CLOSED — 2026-08-18.** Owner decisions captured via structured ask: **OD-04 RATIFIED**
(strictest-rule lead → P3-09 CLOSED, NFR-07 final); **P3-02 formally DEFERRED to post-GA**
(recorded in DEFERRED.md — rails degrade by design; terms gate pre-wired); **prod promotion: not
yet** (v2 stays preview; promotion runbook in DEFERRED.md); **voiceLive: ON** (default flipped,
owner decision — preview now lights it without env override). Gate 76/531 green.
P0 ✓ · P1+GATE ✓ · P2+GATE ✓ · P3-01 ✓ 02 deferred-by-owner ✓ 03 ✓ 04 ✓ 05 ✓ 06 ✓ 07 ✓ 08 ✓ 09 ✓.

**P4-01 (web3-blockchain + smart-contract-engineer) — testnet rails activation · PARTIAL (CTF done; escrow/Unlock owner-gated).**
viem selector check proved the v2 rebuild's contracts are INCOMPATIBLE with the old Base Sepolia
deployments (escrow 2/10 selectors) — so no blind reuse. CTF vault IS compatible (deposit/withdraw
match; worker verifies by eth_getBalance) → ACTIVATED on preview (VITE_FEATURE_CTF=true), live
challenge browser-verified (testnet label, connect-ready, vault armed). Escrow → redeploy prepared
(forge build + 27 tests green, DeployEscrow dry-run clean; broadcast = owner keystore, turnkey ask in
DEFERRED.md). Unlock → owner locks. Prod-default CTF withheld (bait too small). Loop continues to P4-02.

**P4-02 (frontend-engineer + performance-monitor) — proof polish · DONE.**
No screenshots to replace (v2 design is deliberately imageless — the design lock); no orphan
routes (v2 clean). Real fixes, browser-verified:
- **CLS 0.1047 → 0.00.** Culprits (via PerformanceObserver layout-shift sources, NOT the hero as
  first guessed): the SiteFooter reflowing when the lazy route resolved under a short "Loading…"
  fallback, + the scrollbar appearing and shifting the fixed concierge button. Fixes: `main`/
  fallback `min-h-[100svh]` reserves the footer's position during Suspense; `scrollbar-gutter:
  stable` (index.css + critical CSS). Hero-shell geometry also aligned to the real hero (bonus).
- **Boot bandwidth:** stripped the auto-injected heavy-vendor modulepreload hints, and made
  `loadTranscriber` a DYNAMIC import in useLiveVoice — the ~534 KB transformers chunk is now
  fetched only when a visitor starts a live call (verified: 0 on boot, 1 on demand). LCP 0.66s.
- **PERF-P2 (wagmi boot) re-justified:** the web3 chunk (2.9 MB) stays a static import of the
  provider tree; the static hero shell paints LCP (0.66s) before any JS, so it breaches no NFR.
  A careful lazy-provider refactor is tracked as a P5 perf item, not risked in an autonomous loop.

**P4-03 (frontend-engineer) — SEO & branded-search follow-through (SC-5) · DONE.**
Audit found real gaps: `/sitemap.xml` + `/robots.txt` were the SPA HTML fallback (crawlers got
HTML), and the LIVE `/ctf` branch (CtfChallenge) rendered with no `<Seo>` (only the gated
RouteGate branch had it). Fixes, browser-verified: real `public/sitemap.xml` (9 routes,
application/xml) + `public/robots.txt` (text/plain → sitemap), with a drift-guard test that
parses App.jsx paths and fails CI if a route lacks a `<loc>`; `<Seo>` added to the live CTF
branch (title + OG confirmed); `WebSite` JSON-LD (name + JW3B/AgileGypsy alternates, NO
fabricated SearchAction) alongside Person on home → branded-search anchor. Home JSON-LD now
[Person, WebSite]; canonicals resolve to jw3b.dev. Gate 77 files/536 tests green.
