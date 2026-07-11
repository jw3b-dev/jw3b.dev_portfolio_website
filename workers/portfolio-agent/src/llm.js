import Anthropic from '@anthropic-ai/sdk';

const encoder = new TextEncoder();

// Build an Anthropic client that works with either a standard API key (sk-ant-api…,
// sent as x-api-key) or a Claude Code OAuth token (sk-ant-oat…, sent as a Bearer
// token with the oauth beta header).
function makeClient(token) {
    // maxRetries: 0 — we run our own bounded retry loop (below) so we control the
    // wait cap and the fallback, instead of the SDK's opaque backoff.
    if (token.startsWith('sk-ant-oat')) {
        return new Anthropic({
            authToken: token,
            defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
            maxRetries: 0,
        });
    }
    return new Anthropic({ apiKey: token, maxRetries: 0 });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Backoff for a retryable error, honoring the Retry-After header (seconds) when
// present, else exponential — capped so a rate-limited request never blocks the
// response for long before we fall back.
function backoffMs(err, attempt, capMs) {
    const h = err?.headers;
    const raRaw = h && typeof h.get === 'function' ? h.get('retry-after') : h?.['retry-after'];
    const ra = Number(raRaw);
    const fromHeader = Number.isFinite(ra) && ra > 0 ? ra * 1000 : 0;
    const exp = 400 * 2 ** attempt; // 400, 800, 1600…
    return Math.min(Math.max(fromHeader, exp), capMs);
}

/**
 * One Server-Sent-Events frame in the exact shape the frontend parser expects:
 *   data: {"response":"<text>"}\n\n
 * (usePortfolioAgent.js / useContractAuditor.js accumulate `.response`.)
 */
export function sseFrame(text) {
    return `data: ${JSON.stringify({ response: text })}\n\n`;
}

const DONE = 'data: [DONE]\n\n';

/**
 * Emit a single fixed string as an SSE stream (one frame + [DONE]).
 * Used for the no-Claude-key fallbacks (e.g. heuristics-only audit, refusals).
 */
export function staticSSEStream(text) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(sseFrame(text)));
            controller.enqueue(encoder.encode(DONE));
            controller.close();
        },
    });
}

/**
 * Bridge a streamed Claude message into the app's `data:{response}` SSE contract.
 * Claude text deltas are re-emitted as frames so the frontend needs zero changes.
 *
 * @param {object} opts
 * @param {string} opts.apiKey    - Anthropic API key (from env secret).
 * @param {string} opts.model     - Model id (e.g. "claude-opus-4-8").
 * @param {string} opts.system    - System prompt.
 * @param {Array}  opts.messages  - [{role:'user'|'assistant', content}] turns.
 * @param {object} [opts.thinking]- e.g. {type:'adaptive'}; omit for fastest chat.
 * @param {number} [opts.maxTokens]
 * @param {string} [opts.prefixText] - emitted as the first frame before streaming.
 */
export function claudeSSEStream({
    apiKey,
    model,
    system,
    messages,
    thinking,
    maxTokens = 2560,
    prefixText,
    fallback,
    maxRetries = 2,
    retryCapMs = 3000,
}) {
    const client = makeClient(apiKey);
    // Claude Code OAuth tokens (sk-ant-oat…) require the Claude Code identity as the
    // FIRST system block — Anthropic 401s / throttles otherwise. The real system prompt
    // follows as a second block. A raw API key takes the system prompt as-is.
    // (Reference: KTHULHU lib/ai/gateway.ts.)
    const systemParam = apiKey.startsWith('sk-ant-oat')
        ? [
            { type: 'text', text: "You are Claude Code, Anthropic's official CLI for Claude." },
            ...(system ? [{ type: 'text', text: system }] : []),
          ]
        : system;
    return new ReadableStream({
        async start(controller) {
            const send = (t) => controller.enqueue(encoder.encode(sseFrame(t)));
            let emittedContent = false;

            if (prefixText) send(prefixText);

            for (let attempt = 0; ; attempt++) {
                try {
                    const stream = client.messages.stream({
                        model,
                        max_tokens: maxTokens,
                        system: systemParam,
                        messages,
                        ...(thinking ? { thinking } : {}),
                    });
                    for await (const event of stream) {
                        if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
                            emittedContent = true;
                            send(event.delta.text);
                        }
                    }
                    controller.enqueue(encoder.encode(DONE));
                    break; // success
                } catch (err) {
                    // Retry rate-limit (429) / overloaded (529) with Retry-After backoff,
                    // but only while nothing has streamed yet and within the bound.
                    const retryable = err?.status === 429 || err?.status === 529;
                    if (!emittedContent && retryable && attempt < maxRetries) {
                        await sleep(backoffMs(err, attempt, retryCapMs));
                        continue;
                    }
                    // Exhausted → fall back to Workers AI (Llama) if we have a fallback
                    // and haven't streamed anything; otherwise surface a readable note.
                    if (!emittedContent && typeof fallback === 'function') {
                        try {
                            const fb = await fallback();
                            const reader = fb.getReader();
                            for (;;) {
                                const { value, done } = await reader.read();
                                if (done) break;
                                controller.enqueue(value); // already data:{response} SSE bytes
                            }
                        } catch (fbErr) {
                            send(`\n\n_(AI unavailable: ${fbErr?.message || 'unknown error'})_`);
                            controller.enqueue(encoder.encode(DONE));
                        }
                    } else {
                        send(`\n\n_(AI unavailable: ${err?.message || 'unknown error'})_`);
                        controller.enqueue(encoder.encode(DONE));
                    }
                    break;
                }
            }
            controller.close();
        },
    });
}
