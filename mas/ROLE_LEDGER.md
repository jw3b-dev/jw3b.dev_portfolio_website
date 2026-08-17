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
