import { KNOWLEDGE_BASE } from './knowledge.js';
import { claudeSSEStream, staticSSEStream } from './llm.js';
import { runHeuristics, findingsToMarkdownTable } from './auditHeuristics.js';

const CLAUDE_MODEL_DEFAULT = 'claude-opus-4-8';

// Workers AI (Llama) stream in the same `data:{response}` SSE format — used as the
// graceful fallback when Claude is unavailable (no key, rate limit, etc.).
function llamaStream(env, system, messages, maxTokens = 2560) {
    return env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
        messages: [{ role: 'system', content: system }, ...messages],
        max_tokens: maxTokens,
        stream: true,
    });
}

// 🚦 Fixed-window rate limit (per client IP), backed by the existing D1 DB.
// Fail-open: any DB error or missing binding/IP lets the request through.
const RATE_LIMIT_MAX = 30;            // requests allowed...
const RATE_LIMIT_WINDOW_MS = 60_000;  // ...per rolling 60s window

async function isRateLimited(env, ip) {
    if (!env.DB || !ip) return false;
    const windowStart = Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
    try {
        const row = await env.DB.prepare(
            "INSERT INTO rate_limits (ip, window_start, count) VALUES (?, ?, 1) " +
            "ON CONFLICT(ip, window_start) DO UPDATE SET count = count + 1 RETURNING count"
        ).bind(ip, windowStart).first();
        return !!row && row.count > RATE_LIMIT_MAX;
    } catch (err) {
        console.error("Rate limit check failed:", err);
        return false; // fail-open — never block on infrastructure errors
    }
}

export default {
    async fetch(request, env) {
        // Restrict cross-origin access to known first-party origins
        const ALLOWED_ORIGINS = [
            "https://jw3b.dev",
            "https://www.jw3b.dev",
            "http://localhost:5173",
            "http://localhost:3000",
        ];
        const requestOrigin = request.headers.get("Origin");
        const allowOrigin = ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "https://jw3b.dev";
        const corsHeaders = {
            "Access-Control-Allow-Origin": allowOrigin,
            "Vary": "Origin",
        };

        // Handle CORS preflight
        if (request.method === "OPTIONS") {
            return new Response(null, {
                headers: {
                    ...corsHeaders,
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                },
            });
        }

        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        }

        // 🚦 Per-IP rate limit — protects the paid AI routes + D1 from abuse/cost-runup
        const clientIp = request.headers.get("CF-Connecting-IP") || "";
        if (await isRateLimited(env, clientIp)) {
            return new Response(JSON.stringify({ error: "Rate limit exceeded. Please slow down and try again shortly." }), {
                status: 429,
                headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
            });
        }

        const url = new URL(request.url);

        // 🎙️ SPEECH-TO-TEXT ROUTE
        if (url.pathname.endsWith("/speech-to-text")) {
            try {
                const audio = await request.arrayBuffer();
                const response = await env.AI.run("@cf/openai/whisper", {
                    audio: Array.from(new Uint8Array(audio))
                });
                return new Response(JSON.stringify(response), {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "application/json",
                    },
                });
            } catch (err) {
                console.error("STT Error:", err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 🔊 TEXT-TO-SPEECH ROUTE
        if (url.pathname.endsWith("/text-to-speech")) {
            try {
                const { text } = await request.json();
                if (!text) return new Response("Text required", { status: 400 });

                const response = await env.AI.run("@cf/deepgram/aura-1", {
                    text: text,
                    speaker: "orion" 
                });

                return new Response(response, {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "audio/wav",
                    },
                });
            } catch (err) {
                console.error("TTS Error:", err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 🔍 LIVE CONTRACT AUDITOR ROUTE
        if (url.pathname.endsWith("/audit")) {
            try {
                const { code } = await request.json();
                if (!code || typeof code !== "string") {
                    return new Response(JSON.stringify({ error: "Solidity `code` is required" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }

                // Deterministic first pass — always streamed first so it shows even if the AI is unavailable.
                const findings = runHeuristics(code);
                const table = findingsToMarkdownTable(findings);

                // No Claude key → return the deterministic table only (still useful).
                if (!env.ANTHROPIC_API_KEY) {
                    const note = "_Connect an Anthropic API key on the Worker to enable AI-written analysis of these findings._";
                    return new Response(staticSSEStream(table + note), {
                        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                    });
                }

                const auditSystem = `You are "Sentinel", John Wellard's smart-contract security auditor AI. You are given Solidity source and a JSON array of findings from a deterministic static scan.

Rules:
- Explain ONLY the findings provided. Do NOT invent new vulnerabilities.
- For each finding: one line on why it's exploitable and a concrete fix. Be precise and technical.
- If a finding looks like a false positive in context, say so plainly.
- End with a one-line overall risk read. Keep it tight — no padding, no preamble.
- Markdown only (no [AUDIO] tags here). Use bold severity labels.

STATIC FINDINGS (JSON):
${JSON.stringify(findings)}`;

                const auditMessages = [{ role: "user", content: "Here is the Solidity to review:\n\n```solidity\n" + code.slice(0, 24000) + "\n```" }];
                const stream = claudeSSEStream({
                    apiKey: env.ANTHROPIC_API_KEY,
                    baseURL: env.ANTHROPIC_BASE_URL, // optional Cloudflare AI Gateway route
                    model: env.ANTHROPIC_MODEL || CLAUDE_MODEL_DEFAULT,
                    system: auditSystem,
                    messages: auditMessages,
                    thinking: { type: "adaptive" },
                    maxTokens: 2048,
                    prefixText: table,
                    fallback: () => llamaStream(env, auditSystem, auditMessages),
                });
                return new Response(stream, {
                    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                });
            } catch (err) {
                console.error("Audit Error:", err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 🧪 FUZZ-HARNESS GENERATOR ROUTE
        if (url.pathname.endsWith("/fuzz")) {
            try {
                const { spec } = await request.json();
                if (!spec || typeof spec !== "string") {
                    return new Response(JSON.stringify({ error: "A contract `spec` is required" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
                if (!env.ANTHROPIC_API_KEY) {
                    return new Response(staticSSEStream("_Connect an Anthropic API key on the Worker to generate fuzz harnesses._"), {
                        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                    });
                }
                const fuzzSystem = `You are "Sentinel", John Wellard's smart-contract testing AI. Given a contract description or Solidity source, write a RUNNABLE Foundry invariant/fuzz test.

Rules:
- Output ONE fenced \`\`\`solidity code block: a complete Foundry test with pragma, imports (forge-std/Test.sol, StdInvariant), a handler if useful, and invariant_/testFuzz_ functions.
- Pick meaningful invariants (balance/supply conservation, no double-spend, access control, monotonicity, solvency).
- One sentence above the block naming the invariants you chose and why. No other prose, no [AUDIO] tags.`;
                const fuzzMessages = [{ role: "user", content: spec.slice(0, 24000) }];
                const stream = claudeSSEStream({
                    apiKey: env.ANTHROPIC_API_KEY,
                    baseURL: env.ANTHROPIC_BASE_URL, // optional Cloudflare AI Gateway route
                    model: env.ANTHROPIC_MODEL || CLAUDE_MODEL_DEFAULT,
                    system: fuzzSystem,
                    messages: fuzzMessages,
                    thinking: { type: "adaptive" },
                    maxTokens: 2048,
                    fallback: () => llamaStream(env, fuzzSystem, fuzzMessages),
                });
                return new Response(stream, {
                    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                });
            } catch (err) {
                console.error("Fuzz Error:", err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 🔗 TX EXPLAINER ROUTE (transaction decoded client-side via viem)
        if (url.pathname.endsWith("/tx-explain")) {
            try {
                const { decoded } = await request.json();
                if (!decoded || typeof decoded !== "object") {
                    return new Response(JSON.stringify({ error: "A `decoded` tx object is required" }), {
                        status: 400,
                        headers: { ...corsHeaders, "Content-Type": "application/json" },
                    });
                }
                if (!env.ANTHROPIC_API_KEY) {
                    return new Response(staticSSEStream("_Connect an Anthropic API key on the Worker to enable AI narration of this transaction._"), {
                        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                    });
                }
                const txSystem = `You are "Sentinel", John Wellard's on-chain analyst AI. You are given a decoded EVM transaction as JSON (from, to, value, status, gas, ERC-20 transfers/approvals, method selector).

Explain in plain English what the transaction did: intent, token movements, and any risk signals (unlimited approvals, failed calls, sandwich/MEV hints, contract creation). Concise and technical. Markdown, no [AUDIO] tags. If the data is thin, say what's knowable and what isn't.

DECODED TX (JSON):
${JSON.stringify(decoded).slice(0, 12000)}`;
                const txMessages = [{ role: "user", content: "Explain this transaction." }];
                const stream = claudeSSEStream({
                    apiKey: env.ANTHROPIC_API_KEY,
                    baseURL: env.ANTHROPIC_BASE_URL, // optional Cloudflare AI Gateway route
                    model: env.ANTHROPIC_MODEL || CLAUDE_MODEL_DEFAULT,
                    system: txSystem,
                    messages: txMessages,
                    thinking: { type: "adaptive" },
                    maxTokens: 1536,
                    fallback: () => llamaStream(env, txSystem, txMessages),
                });
                return new Response(stream, {
                    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                });
            } catch (err) {
                console.error("Tx Explain Error:", err);
                return new Response(JSON.stringify({ error: err.message }), {
                    status: 500,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                });
            }
        }

        // 🛡️ MAIN CHAT ROUTE (With Security Guards)
        try {
            const { messages, conversationId, walletAddress } = await request.json();

            // 🛡️ WORKER-LEVEL SECURITY GUARD (Hacker Proof)
            const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
            const lastUserMessage = (lastMsg && typeof lastMsg.content === "string") ? lastMsg.content.toLowerCase() : "";
            const bannedKeywords = ["20 questions", "hangman", "game", "ascii", "draw", "art", "cat", "dog", "sing", "poetry", "song"];
            // Word-boundary match so short words don't false-match ("art"⊄"smart", "draw"⊄"withdraw", "cat"⊄"education")
            const isBanned = bannedKeywords.some(keyword => new RegExp(`\\b${keyword}\\b`, "i").test(lastUserMessage));

            if (isBanned) {
                const refusal = `[AUDIO: "That's a bit outside my lane — I'm here to help with John's Web3 security and engineering work. What can I point you to?"] That's outside what I do here — I'm the concierge for John's Web3 security and engineering services. Happy to help with audits, smart-contract work, projects, or how to hire him. What are you working on?`;
                // Return as an SSE-compatible chunk
                return new Response(`data: ${JSON.stringify({ response: refusal })}\n\ndata: [DONE]\n\n`, {
                    headers: {
                        ...corsHeaders,
                        "Content-Type": "text/event-stream",
                    },
                });
            }

            // 📊 D1 ANALYTICS LOGGING
            if (env.DB && messages && messages.length > 0 && conversationId) {
                const lastMsg = messages[messages.length - 1];
                if (lastMsg.role === "user") {
                    try {
                        await env.DB.prepare("INSERT OR IGNORE INTO conversations (id, wallet_address) VALUES (?, ?)")
                            .bind(conversationId, walletAddress || null)
                            .run();

                        await env.DB.prepare("INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)")
                            .bind(conversationId, lastMsg.content)
                            .run();
                    } catch (dbErr) {
                        console.error("D1 Log Failure:", dbErr);
                    }
                }
            }

            // System prompt — natural, personable concierge voice.
            // Keep the [AUDIO] / [TOOL_CALL] / [RENDER_CARD] tag contract in sync with
            // usePortfolioAgent.js + ChatWidget.jsx if you change it.
            const systemPrompt = `You are "Sentinel", the AI concierge for John Wellard (JW3B) — a blockchain engineer and smart-contract security auditor. You speak on John's behalf to people considering hiring him.

VOICE & TONE:
- Warm, sharp, and genuinely helpful — like a knowledgeable colleague, not a robot and not a salesperson.
- Technically fluent but plain-spoken. Match the user's level: go deep with engineers, keep it simple with everyone else.
- Concise by default. Answer the question first, then offer one useful next step. Never pad or repeat yourself.
- A little cyber-confidence suits the brand; cold, stiff, or over-formal does not.

WHAT YOU COVER:
- John's services (smart-contract audits, Web3 + full-stack engineering, technical delivery), his experience, his projects, and how to hire him.
- If a question is unrelated, answer in a sentence if you can, then steer back to John's work — briefly, no lecture.
- You do NOT have and never guess John's private contact details (phone, home address, personal email). If asked, say so in one friendly sentence and point to the Hire Me page or the secure chat.

EVERY REPLY HAS TWO PARTS:
1. A spoken summary tag first: [AUDIO: "..."]
   - This is read ALOUD by text-to-speech, so write it for the ear: 1–2 short, natural sentences with contractions. No markdown, lists, tables, code, prices-as-symbols, or emoji. Say numbers as words if it reads better aloud.
   - Capture the gist conversationally — don't just repeat the text below.
2. Then the visible chat reply: as short as it can be while genuinely helpful. Use Markdown where it helps (headings, bullets, and a table for pricing). This part can go deeper than the audio.

TOOLS — use only when they fit, and keep the tags plain (no bold/backticks):
- Talking pricing/rates → add [RENDER_CARD: "pricing_tier_card"] and show the numbers in a Markdown table.
- Sending the user somewhere → [TOOL_CALL: {"action": "openModal", "type": "pricing"}] or {"type": "contact"}.

${KNOWLEDGE_BASE}

---
EXAMPLES — match this natural, brief style:

USER: "what's john's phone number?"
ASSISTANT: [AUDIO: "I can't share John's personal contact details, but I can point you to the best way to reach him."]
I don't have John's private contact info — but the fastest way to reach him is the **Hire Me** page, or the secure (end-to-end) chat here once your wallet's connected.

USER: "how much are the engineering retainers?"
ASSISTANT: [AUDIO: "John runs three engineering retainers, from six thousand a month up to twelve and a half thousand for a full tech-lead engagement. I've dropped the full breakdown in the chat."]
Here are the monthly engineering retainers:

| Tier | Rate | Included |
|---|---|---|
| Fractional Dev | $6,000/mo | ~60 hrs — build + security oversight |
| Standard Engineer | $10,000/mo | ~120 hrs — dedicated delivery |
| Tech Lead | $12,500/mo | ~160 hrs — full engineering lead |

[RENDER_CARD: "pricing_tier_card"]
Want me to open Mission Control so you can put a request together?
`;

            // 🤖 Prefer Claude when a key is configured; otherwise fall back to Workers AI (Llama).
            // Both paths emit the same `data: {"response": "..."}` SSE frames the frontend expects.
            if (env.ANTHROPIC_API_KEY) {
                const stream = claudeSSEStream({
                    apiKey: env.ANTHROPIC_API_KEY,
                    baseURL: env.ANTHROPIC_BASE_URL, // optional Cloudflare AI Gateway route
                    model: env.ANTHROPIC_MODEL || CLAUDE_MODEL_DEFAULT,
                    system: systemPrompt,
                    messages, // user/assistant turns; system goes in its own param for Claude
                    maxTokens: 2560, // chat: thinking omitted for lowest first-token latency
                    fallback: () => llamaStream(env, systemPrompt, messages),
                });
                return new Response(stream, {
                    headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
                });
            }

            const response = await env.AI.run("@cf/meta/llama-3.1-70b-instruct", {
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages
                ],
                max_tokens: 2560,
                stream: true,
            });

            return new Response(response, {
                headers: {
                    ...corsHeaders,
                    "Content-Type": "text/event-stream",
                },
            });
        } catch (err) {
            console.error("General Error:", err);
            return new Response(JSON.stringify({ error: err.message }), {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
        }
    },
};
