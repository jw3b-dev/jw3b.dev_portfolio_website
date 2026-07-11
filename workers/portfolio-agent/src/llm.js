import Anthropic from '@anthropic-ai/sdk';

const encoder = new TextEncoder();

// Build an Anthropic client that works with either a standard API key (sk-ant-api…,
// sent as x-api-key) or a Claude Code OAuth token (sk-ant-oat…, sent as a Bearer
// token with the oauth beta header).
function makeClient(token) {
    if (token.startsWith('sk-ant-oat')) {
        return new Anthropic({
            authToken: token,
            defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
        });
    }
    return new Anthropic({ apiKey: token });
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
export function claudeSSEStream({ apiKey, model, system, messages, thinking, maxTokens = 2560, prefixText, fallback }) {
    const client = makeClient(apiKey);
    return new ReadableStream({
        async start(controller) {
            const send = (t) => controller.enqueue(encoder.encode(sseFrame(t)));
            let emittedContent = false;
            try {
                if (prefixText) send(prefixText);
                const stream = client.messages.stream({
                    model,
                    max_tokens: maxTokens,
                    system,
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
            } catch (err) {
                // If Claude failed before emitting any content (e.g. a 429 from a
                // subscription token), fall back to Workers AI so the user still gets
                // a response. Otherwise surface a readable note.
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
            } finally {
                controller.close();
            }
        },
    });
}
