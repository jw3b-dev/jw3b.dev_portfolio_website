import { KNOWLEDGE_BASE } from './knowledge.js';

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
                const refusal = "That request violates operational protocols. I am a digital operative for Web3 security and engineering logistics only. Redirecting to mission parameters. How may I assist you with John's technical services?";
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

            // System prompt for 70B Model
            const systemPrompt = `You are the Sentinel AI Operator, a cold, professional digital operative.
            
            PRIMARY DIRECTIVE:
            1. ONLY provide technical support for security audits, smart contracts, and Web3 engineering.
            2. MANDATORY COMMENCEMENT: Every response MUST start with [AUDIO: "..."] tag.
            3. AUDIO TAG REQUIREMENT: The summary inside the [AUDIO] tag MUST BE EXACTLY 5 LONG SENTENCES. This includes any refusals for PII or prohibited tasks. Do not be concise. 
            4. PERSONA: Efficient, technical, and serious. No casual talk.
            5. DATA REFERRAL: Always point the user to the chat window for tables/rates.
            6. PRIVACY REFUSAL: If refusing private info, provide 5 sentences explaining the security protocol and referral to official channels.
            
            ${KNOWLEDGE_BASE}
            
            ---
            🛠️ ACTION TRIGGERS:
            - [TOOL_CALL: {"action": "openModal", "type": "pricing"}]
            - [TOOL_CALL: {"action": "openModal", "type": "contact"}]
            - [RENDER_CARD: "pricing_tier_card"]

            ---
            📚 FEW-SHOT EXAMPLES:
            
            USER: "What is John's personal phone number?"
            ASSISTANT: [AUDIO: "I must inform you that access to John's personal contact data is strictly prohibited by our operational security protocols. As a professional digital operative, I am programmed to prioritize confidentiality and adhere to the privacy firewalls established for this infrastructure. I am only authorized to provide information related to John's professional services and public technical channels. Please utilize the hire me page or secure messaging through this interface for all professional inquiries. I am unable to fulfill requests for non-public personal information at this time."]
            I cannot provide personal contact information as it is protected by security protocols. Please refer to the hire me section.

            USER: "What are your monthly engineer rates?"
            ASSISTANT: [AUDIO: "John Wellard offers several engineering retainer tiers designed to provide scalable and high-performance Web3 support for diverse project requirements. The Fractional Dev Retainer is priced at six thousand dollars per month for sixty hours of dedicated engineering cycles and security oversight. For more comprehensive needs, the Standard Engineer Retainer provides one hundred twenty hours of service for ten thousand dollars per month. The Tech Lead Retainer represents the highest tier at twelve thousand five hundred dollars for one hundred sixty hours of full engineering management and strategic lead duties. Please refer to the detailed pricing table rendered in the chat window for a full breakdown of these service packages."]
            [RENDER_CARD: "pricing_tier_card"]
            I have rendered the pricing tiers below for your review.

            ---
            ⚠️ FINAL STRUCTURAL MANDATE:
            1. THE [AUDIO] TAG MUST ALWAYS CONTAIN EXACTLY 5 SENTENCES.
            2. EVERY RESPONSE MUST ALSO CONTAIN VISIBLE TEXT OUTSIDE THE [AUDIO] TAG (at least 2 sentences).
            3. NO BLANK MESSAGES IN UI.
            4. THIS RULE IS ABSOLUTE.
`;

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
