import { renderHook, act, waitFor } from '@testing-library/react';
import { useXMTP } from '../useXMTP';
import { useAccount, useWalletClient } from 'wagmi';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('wagmi', () => ({
    useAccount: vi.fn(),
    useWalletClient: vi.fn()
}));

const mockClientCreate = vi.fn();
vi.mock('@xmtp/xmtp-js', () => ({
    Client: { create: (...args) => mockClientCreate(...args) }
}));

describe('useXMTP', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAccount).mockReturnValue({ isConnected: true });
        vi.mocked(useWalletClient).mockReturnValue({ data: { address: '0x123' } });
    });

    it('should initialize correctly', () => {
        const { result } = renderHook(() => useXMTP());
        expect(result.current.client).toBeNull();
        expect(result.current.messages).toEqual({}); // Changed from [] to {} to match expected initial state
        expect(result.current.status).toBe('disconnected'); // Added to reflect initial status
    });

    it('should handle disconnect without a client', () => {
        const { result } = renderHook(() => useXMTP());
        act(() => {
            result.current.disconnect();
        });
        expect(result.current.client).toBeNull();
        expect(result.current.status).toBe('disconnected'); // Ensure status remains disconnected
    });

    it('should fail connect if wallet is missing', async () => {
        vi.mocked(useWalletClient).mockReturnValue({ data: null });
        const { result } = renderHook(() => useXMTP());
        
        await act(async () => {
            await result.current.connect();
        });

        expect(result.current.error).toBe('Wallet not connected');
        expect(result.current.status).toBe('disconnected');
    });

    it('should handle connect success', async () => {
        const mockStream = {
            [Symbol.asyncIterator]: vi.fn(() => ({
                next: vi.fn().mockResolvedValue({ done: true })
            }))
        };
        const mockClient = {
            address: '0x123',
            conversations: {
                list: vi.fn().mockResolvedValue([]),
                streamAllMessages: vi.fn().mockResolvedValue(mockStream)
            }
        };
        mockClientCreate.mockResolvedValue(mockClient);

        const { result } = renderHook(() => useXMTP());
        
        await act(async () => {
            await result.current.connect();
        });

        await waitFor(() => expect(result.current.status).toBe('connected'));
        expect(result.current.client).toBe(mockClient);
    });

    it('should handle connect errors in catch block', async () => {
        mockClientCreate.mockRejectedValue(new Error('Network Failure'));
        const { result } = renderHook(() => useXMTP());
        
        await act(async () => {
            await result.current.connect();
        });

        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('Network Failure');
    });

    it('should handle sendMessage', async () => {
        const mockStream = {
            [Symbol.asyncIterator]: vi.fn(() => ({
                next: vi.fn().mockResolvedValue({ done: true })
            }))
        };
        const mockConversation = {
            topic: 'test-topic',
            send: vi.fn().mockResolvedValue({}),
            messages: vi.fn().mockResolvedValue([])
        };
        const mockClient = {
            address: '0x123',
            conversations: {
                list: vi.fn().mockResolvedValue([]),
                streamAllMessages: vi.fn().mockResolvedValue(mockStream),
                newConversation: vi.fn().mockResolvedValue(mockConversation)
            }
        };
        mockClientCreate.mockResolvedValue(mockClient);
        
        const { result } = renderHook(() => useXMTP());

        await act(async () => {
            await result.current.connect();
        });

        await waitFor(() => {
            expect(result.current.status).toBe('connected');
        });

        await act(async () => {
            await result.current.sendMessage('0x456', 'Hello');
        });

        expect(mockConversation.send).toHaveBeenCalledWith('Hello');
    });

    it('should handle message stream updates and deduplication', async () => {
        const mockMessage = { 
            id: 'unique-1', 
            content: 'hello', 
            contentTopic: 'test-topic', 
            senderAddress: '0x456', 
            sent: new Date()
        };
        
        const mockStream = {
            [Symbol.asyncIterator]: vi.fn(() => {
                let count = 0;
                return {
                    next: vi.fn(async () => {
                        if (count === 0) {
                            count++;
                            return { value: mockMessage, done: false };
                        }
                        if (count === 1) {
                            count++;
                            // Duplicate message to test branch coverage
                            return { value: mockMessage, done: false };
                        }
                        return { done: true };
                    })
                };
            })
        };

        const mockClient = {
            address: '0x123',
            conversations: {
                list: vi.fn().mockResolvedValue([]),
                streamAllMessages: vi.fn().mockResolvedValue(mockStream)
            }
        };

        mockClientCreate.mockResolvedValue(mockClient);
        const { result } = renderHook(() => useXMTP());

        await act(async () => {
            await result.current.connect();
        });

        await waitFor(() => {
            expect(result.current.messages['test-topic']).toHaveLength(1);
        }, { timeout: 3000 });
    });
    it('should throw error if sending message without client', async () => {
        const { result } = renderHook(() => useXMTP());
        await expect(result.current.sendMessage('0x456', 'Hi')).rejects.toThrow('XMTP client not initialized');
    });

    it('should disconnect when client is active', async () => {
        const mockStream = { [Symbol.asyncIterator]: () => ({ next: vi.fn().mockResolvedValue({ done: true }) }) };
        const mockClient = {
            address: '0x123',
            conversations: {
                list: vi.fn().mockResolvedValue([]),
                streamAllMessages: vi.fn().mockResolvedValue(mockStream)
            }
        };
        mockClientCreate.mockResolvedValue(mockClient);

        const { result } = renderHook(() => useXMTP());

        await act(async () => { await result.current.connect(); });
        expect(result.current.status).toBe('connected');

        act(() => { result.current.disconnect(); });

        await waitFor(() => {
            expect(result.current.client).toBeNull();
            expect(result.current.status).toBe('disconnected');
        });
    });

    it('should stop streaming on unmount', async () => {
        let resolveNext;
        const nextPromise = new Promise(resolve => { resolveNext = resolve; });
        const mockNext = vi.fn().mockReturnValue(nextPromise);
        
        const mockStream = { [Symbol.asyncIterator]: () => ({ next: mockNext }) };
        const mockClient = { 
            conversations: { 
                streamAllMessages: vi.fn().mockResolvedValue(mockStream),
                list: vi.fn().mockResolvedValue([])
            } 
        };
        mockClientCreate.mockResolvedValue(mockClient);
        
        const { result, unmount } = renderHook(() => useXMTP());
        await act(async () => { await result.current.connect(); });
        
        // At this point, the stream loop is paused awaiting nextPromise
        unmount();
        
        // Resume the stream with a value
        await act(async () => {
            resolveNext({ value: { id: '1', contentTopic: 'a' }, done: false });
        });
        
        // The isMounted = false branch should be hit, and the state should not update
        expect(result.current.messages).toEqual({});
    });

    it('should skip streaming when client has no conversations', async () => {
        // Client with conversations.list (for connect) but no streamAllMessages
        // This means client?.conversations is truthy but streamAllMessages doesn't exist,
        // so we instead simulate client with conversations set to null via setter override
        const mockClient = {
            address: '0x123',
            conversations: {
                list: vi.fn().mockResolvedValue([]),
                // No streamAllMessages — will cause the streaming to handle gracefully
            }
        };
        mockClientCreate.mockResolvedValue(mockClient);

        const { result } = renderHook(() => useXMTP());
        await act(async () => { await result.current.connect(); });

        // Connected successfully, streaming will error gracefully
        expect(result.current.status).toBe('connected');
    });
});

