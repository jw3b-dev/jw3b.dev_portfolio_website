# v1 → v2 feature-parity audit

**v1** = `jw3b.dev_website` (branch `v2-upgrade`) — the mature prior site.
**v2** = `jw3b.dev-v2` (branch `v2`) — the from-scratch MAS rebuild.

The MAS was told "scrap everything, reuse nothing." That was right for the **design/IA** but got
applied to **feature implementations** too — so working, mature code was rebuilt as MVPs. This is
the diff of what regressed. Verdict per row: ✅ parity/better · ⚠️ downgraded · ❌ dropped ·
🟢 fixed this session.

## AI / concierge

| Feature | v1 | v2 | Status |
|---|---|---|---|
| Concierge markdown render | rich: bold, headings, lists, **tables, code blocks** (custom renderer) | plain text (raw syntax shown) → renderer added | 🟢 fixed (`84edb28`) |
| **Concierge voice — STT** | mic → `MediaRecorder` → `/speech-to-text` = `@cf/openai/whisper` (real) | no UI; worker `/speech-to-text` returns `{text:''}` (**stub**) | ❌ dropped |
| **Concierge voice — TTS** | `[AUDIO:"…"]` → `/text-to-speech` = `@cf/deepgram/aura-1` (real) + playback | no UI; worker `/text-to-speech` returns `{audio:null}` (**stub**) | ❌ dropped |
| Concierge model | Claude Haiku + Llama fallback | Claude Haiku (oat) + Llama fallback | ✅ parity |
| Concierge grounding | system-prompt KB | curated cleared-claims KB (claims-gated) | ✅ parity (better governance) |
| Conversation logging (D1) | yes | yes (PII-min) | ✅ parity |

## AI security console (/audit, /fuzz, /tx-explain)

| Feature | v1 | v2 | Status |
|---|---|---|---|
| `/audit` narrative model | **Claude Opus** + Llama fallback | Claude (gateway) + Llama fallback | ✅ ~parity |
| `/audit` RAG grounding | Neon pgvector KB (9.5k findings) | Neon pgvector KB (wired this session) + retrieval-safety guard | ✅ parity (better) |
| `/audit` heuristics | deterministic pre-screen | deterministic pre-screen | ✅ parity |
| **`/fuzz` model** | **Claude Opus** + Llama fallback | **Llama 70B only** (no Claude) | ⚠️ downgraded |
| **`/tx-explain` model** | **Claude Opus** + Llama fallback | **Llama 70B only** (no Claude) | ⚠️ downgraded |

## On-chain / hire

| Feature | v1 | v2 | Status |
|---|---|---|---|
| CTF (on-chain) | deployed vault + verify + leaderboard | same vault reused (this session) | ✅ parity |
| Escrow / Unlock / wallet / hire | live | built, flagged, degrade-first | ✅ parity (awaits provisioning) |
| Claims gate + evidence register | — | **new** (CI-enforced) | ✅ v2 better |

## The regressions to port (priority order)
1. **Concierge voice I/O** — real `/speech-to-text` (Whisper) + `/text-to-speech` (Aura) worker
   impl, + mic capture and `[AUDIO]`→playback in the widget. [porting now]
2. **`/fuzz` model** → restore Claude (Opus/gateway) with Llama fallback (v2 dropped it to Llama).
3. **`/tx-explain` model** → same — restore Claude with Llama fallback.
4. Concierge markdown — ✅ already done.

**Not regressions (v2 deliberately better):** the design/IA, the claims-gate + evidence register,
the retrieval-safety guard on RAG, degrade-first everywhere.
