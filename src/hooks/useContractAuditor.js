import { useState, useCallback } from 'react';
import { AGENT_AUDIT_URL } from '../config/worker';

/**
 * useContractAuditor
 *
 * Streams a Solidity audit from the portfolio-agent Worker `/audit` route.
 * The Worker emits the same `data: {"response": "..."}` SSE frames as the chat
 * pipeline: a deterministic heuristics table first, then a streamed AI analysis.
 */
export const useContractAuditor = () => {
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const auditContract = useCallback(async (code) => {
        if (!code || !code.trim()) return;
        setIsLoading(true);
        setError(null);
        setReport('');

        try {
            const response = await fetch(AGENT_AUDIT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code }),
            });

            if (!response.ok) throw new Error('Auditor endpoint error');

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (value) buffer += decoder.decode(value, { stream: true });

                // Frames are newline-separated; hold a partial trailing line until the next read.
                const lines = buffer.split('\n');
                buffer = done ? '' : lines.pop();

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.response) {
                                accumulated += data.response;
                                setReport(accumulated);
                            }
                        } catch {
                            // Ignore partial/non-JSON frames (e.g. the [DONE] marker)
                        }
                    }
                }

                if (done) break;
            }

            return accumulated;
        } catch (err) {
            console.error('Auditor Error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { report, auditContract, isLoading, error, reset: () => setReport('') };
};
