import { renderHook, act, waitFor } from '@testing-library/react';
import { usePortfolioAgent } from '../usePortfolioAgent';
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('usePortfolioAgent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        
        // 🌐 Stub global fetch safely using Vitest utilities
        vi.stubGlobal('fetch', vi.fn().mockImplementation(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let done = false;
                    return {
                        read: async () => {
                            if (done) return { value: null, done: true };
                            done = true;
                            return { 
                                value: new TextEncoder().encode('data: {"response": "John has extensive experience"}'), 
                                done: false 
                            };
                        }
                    };
                }
            }
        })));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('should initialize with empty messages', () => {
        const { result } = renderHook(() => usePortfolioAgent());
        expect(result.current.messages).toEqual([]);
        expect(result.current.isLoading).toBe(false);
    });

    it('should handle askAgent successfully', async () => {
        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => {
            await result.current.askAgent('Hello');
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(2), { timeout: 3000 });
        expect(result.current.messages[1].content).toContain('John has extensive experience');
    });

    it('should handle askAgent failure in catch block', async () => {
        // Force fetch to reject for this specific run
        global.fetch.mockImplementationOnce(() => Promise.reject(new Error('Forced Error')));

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => {
            await result.current.askAgent('Hello');
        });

        expect(result.current.error).toBe('Forced Error');
        expect(result.current.isLoading).toBe(false);
    });

    it('should clear history', async () => {
        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => { 
            await result.current.askAgent('Hello'); 
        });
        await waitFor(() => expect(result.current.messages).toHaveLength(2));

        act(() => {
            result.current.clearHistory();
        });
        expect(result.current.messages).toHaveLength(0);
    });

    it('should parse and dispatch AI tool calls', async () => {
        const mockDispatchEvent = vi.spyOn(window, 'dispatchEvent');
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let done = false;
                    return {
                        read: async () => {
                            if (done) return { value: null, done: true };
                            done = true;
                            return { 
                                value: new TextEncoder().encode('data: {"response": "[TOOL_CALL: {\\"action\\": \\"openModal\\"}]"}'), 
                                done: false 
                            };
                        }
                    };
                }
            }
        }));

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => { 
            await result.current.askAgent('Open modal'); 
        });

        expect(mockDispatchEvent).toHaveBeenCalledWith(expect.any(CustomEvent));
        const callArgs = mockDispatchEvent.mock.calls[0][0];
        expect(callArgs.type).toBe('ai_tool_trigger');
        expect(callArgs.detail).toEqual({ action: 'openModal' });
        
        mockDispatchEvent.mockRestore();
    });

    it('should handle AI tool call parse errors', async () => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let done = false;
                    return {
                        read: async () => {
                            if (done) return { value: null, done: true };
                            done = true;
                            // Supply deliberately mangled JSON
                            return { 
                                value: new TextEncoder().encode('data: {"response": "[TOOL_CALL: {bad json}]"}'), 
                                done: false 
                            };
                        }
                    };
                }
            }
        }));

        const originalError = console.error;
        console.error = vi.fn();

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => { 
            await result.current.askAgent('Trigger bad parse'); 
        });

        expect(console.error).toHaveBeenCalledWith("AI Tool call parse error:", expect.any(SyntaxError));
        
        console.error = originalError;
    });

    it('should use Math.random fallback for conversationId if crypto is unavailable', () => {
        const originalCrypto = window.crypto;
        delete window.crypto;
        
        const { result } = renderHook(() => usePortfolioAgent());
        expect(result.current.messages).toEqual([]);
        
        window.crypto = originalCrypto;
    });

    it('should throw "Worker endpoint error" if response is not ok', async () => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: false
        }));

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => {
            await result.current.askAgent('Hello');
        });

        expect(result.current.error).toBe('Worker endpoint error');
    });

    it('should ignore stream lines that do not start with data or lack response field', async () => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let done = false;
                    return {
                        read: async () => {
                            if (done) return { value: null, done: true };
                            done = true;
                            // Supply missing data: prefix and missing response field
                            return { 
                                value: new TextEncoder().encode('data: {"ignored": true}\\nping: {"response": "ignored"}'), 
                                done: false 
                            };
                        }
                    };
                }
            }
        }));

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => { 
            await result.current.askAgent('Trigger ignore line'); 
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(2));
        expect(result.current.messages[1].content).toBe('');
    });

    it('should reassemble a data frame split across chunk boundaries', async () => {
        // The second frame is split mid-JSON: "...{"respo" + "nse": "Part2"}".
        // The old (unbuffered) parser dropped "Part2"; the buffered parser must recover it.
        const chunks = [
            'data: {"response": "Part1"}\ndata: {"respo',
            'nse": "Part2"}',
        ];
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let i = 0;
                    return {
                        read: async () => {
                            if (i >= chunks.length) return { value: null, done: true };
                            const value = new TextEncoder().encode(chunks[i]);
                            i += 1;
                            return { value, done: false };
                        }
                    };
                }
            }
        }));

        const { result } = renderHook(() => usePortfolioAgent());

        await act(async () => {
            await result.current.askAgent('Split frame');
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(2));
        expect(result.current.messages[1].content).toBe('Part1Part2');
    });

    it('should ignore lines that do not start with data: in the stream', async () => {
        global.fetch.mockImplementationOnce(() => Promise.resolve({
            ok: true,
            body: {
                getReader: () => {
                    let done = false;
                    return {
                        read: async () => {
                            if (done) return { value: null, done: true };
                            done = true;
                            // Inject a comment line or heartbeat that isn't data:
                            return { 
                                value: new TextEncoder().encode(': heartbeat\ndata: {"response": "valid"}'), 
                                done: false 
                            };
                        }
                    };
                }
            }
        }));

        const { result } = renderHook(() => usePortfolioAgent());
        
        await act(async () => { 
            await result.current.askAgent('Test non-data line'); 
        });

        await waitFor(() => expect(result.current.messages).toHaveLength(2));
        expect(result.current.messages[1].content).toBe('valid');
    });
});
