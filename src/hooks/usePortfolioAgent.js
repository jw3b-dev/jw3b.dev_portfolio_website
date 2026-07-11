import { useState, useCallback } from 'react';
import { AGENT_CHAT_URL } from '../config/worker';

/**
 * usePortfolioAgent Hook
 * 
 * Handles interaction with the Cloudflare Worker AI Agent.
 */
export const usePortfolioAgent = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // 📊 Session Conversation Trace (Phase 9 D1 Analytics)
    const [conversationId] = useState(() => typeof window !== 'undefined' && window.crypto ? crypto.randomUUID() : Math.random().toString(36).substring(7));

    const askAgent = useCallback(async (prompt, walletAddress = null) => {
        setIsLoading(true);
        setError(null);

        const newMessages = [...messages, { role: "user", content: prompt }];
        setMessages(newMessages);

        try {
            const response = await fetch(AGENT_CHAT_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    messages: newMessages,
                    conversationId,
                    walletAddress
                })
            });

            if (!response.ok) throw new Error("Worker endpoint error");

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulatedContent = "";
            let buffer = "";

            // Initialize placeholder for stream response
            setMessages(prev => [...prev, { role: "assistant", content: "" }]);

            while (true) {
                const { value, done } = await reader.read();
                if (value) buffer += decoder.decode(value, { stream: true });

                // Cloudflare text/event-stream frames are newline-separated. A frame can be
                // split across chunk boundaries, so hold the trailing partial line in `buffer`
                // until the next read; flush everything on the final (done) read.
                const lines = buffer.split("\n");
                buffer = done ? "" : lines.pop();

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        try {
                            // Trim "data: " and parse
                            const data = JSON.parse(line.substring(6));
                            if (data.response) {
                                accumulatedContent += data.response;
                                setMessages(prev => {
                                    const next = [...prev];
                                    next[next.length - 1] = {
                                        ...next[next.length - 1],
                                        content: accumulatedContent
                                    };
                                    return next;
                                });
                            }
                        } catch {
                            // Ignore partial JSON parsing errors that sometimes trigger on cuts
                        }
                    }
                }

                if (done) break;
            }

            // 🛠️ TOOL CALL PARSER (Phase 2 Actionable AI)
            // Example Trigger: [TOOL_CALL: {"action": "openModal", "type": "pricing"}]
            const toolCallMatch = accumulatedContent.match(/\[TOOL_CALL:\s*({.*?})\]/);
            if (toolCallMatch) {
                try {
                    const tool = JSON.parse(toolCallMatch[1]);
                    console.log("🛠️ AI triggering automated action:", tool);
                    if (window && typeof window.dispatchEvent === 'function') {
                        window.dispatchEvent(new CustomEvent('ai_tool_trigger', { detail: tool }));
                    }
                } catch (e) {
                    console.error("AI Tool call parse error:", e);
                }
            }

            return { role: "assistant", content: accumulatedContent };
        } catch (err) {
            console.error("Agent Error:", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [messages, conversationId]);

    return {
        messages,
        askAgent,
        isLoading,
        error,
        clearHistory: () => setMessages([])
    };
};
