import { renderHook, act, waitFor } from '@testing-library/react';
import { useContractAuditor } from '../useContractAuditor';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// A reader that yields the given string as one chunk, then a null/done read.
function streamOf(text) {
    return {
        getReader: () => {
            let sent = false;
            return {
                read: async () => {
                    if (sent) return { value: null, done: true };
                    sent = true;
                    return { value: new TextEncoder().encode(text), done: false };
                },
            };
        },
    };
}

describe('useContractAuditor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            // Covers: a response frame, a non-`data:` empty line, a frame with no
            // `.response`, and the non-JSON `[DONE]` marker (parse-catch branch).
            body: streamOf('data: {"response": "# Report"}\n\ndata: {"ignored": true}\n\ndata: [DONE]\n\n'),
        }));
    });

    afterEach(() => vi.unstubAllGlobals());

    it('initializes empty', () => {
        const { result } = renderHook(() => useContractAuditor());
        expect(result.current.report).toBe('');
        expect(result.current.isLoading).toBe(false);
    });

    it('does nothing for empty/whitespace code', async () => {
        const { result } = renderHook(() => useContractAuditor());
        await act(async () => { await result.current.auditContract('   '); });
        expect(global.fetch).not.toHaveBeenCalled();
    });

    it('streams and accumulates a report', async () => {
        const { result } = renderHook(() => useContractAuditor());
        await act(async () => { await result.current.auditContract('contract C {}'); });
        await waitFor(() => expect(result.current.report).toBe('# Report'));
        expect(result.current.isLoading).toBe(false);
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/audit'),
            expect.objectContaining({ method: 'POST' }),
        );
    });

    it('sets error when the endpoint is not ok', async () => {
        global.fetch.mockResolvedValueOnce({ ok: false });
        const { result } = renderHook(() => useContractAuditor());
        await act(async () => { await result.current.auditContract('contract C {}'); });
        expect(result.current.error).toBe('Auditor endpoint error');
        expect(result.current.isLoading).toBe(false);
    });

    it('resets the report', async () => {
        const { result } = renderHook(() => useContractAuditor());
        await act(async () => { await result.current.auditContract('contract C {}'); });
        await waitFor(() => expect(result.current.report).toBe('# Report'));
        act(() => { result.current.reset(); });
        expect(result.current.report).toBe('');
    });
});
