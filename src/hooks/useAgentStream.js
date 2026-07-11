import { useState, useCallback } from 'react';

/**
 * Generic streaming client for the portfolio-agent Worker SSE routes.
 *
 * POSTs `body` to `url` and accumulates the `data: {"response": "..."}` frames
 * the Worker emits (same contract as the chat + auditor). Shared by the
 * contract auditor, fuzz-harness generator, and tx explainer.
 */
export const useAgentStream = (url) => {
    const [output, setOutput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const run = useCallback(async (body) => {
        setIsLoading(true);
        setError(null);
        setOutput('');

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error('Agent endpoint error');

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
                                setOutput(accumulated);
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
            console.error('Agent stream error:', err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [url]);

    return { output, run, isLoading, error, reset: () => setOutput('') };
};
