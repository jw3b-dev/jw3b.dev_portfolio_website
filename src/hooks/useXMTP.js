import { useState, useEffect, useCallback } from 'react';
import { useWalletClient } from 'wagmi';

/**
 * useXMTP Hook
 * 
 * Manages XMTP client lifecycle, connection status, 
 * and provides methods for sending/receiving messages.
 */
export const useXMTP = () => {
    const { data: walletClient } = useWalletClient();
    const [client, setClient] = useState(null);
    const [status, setStatus] = useState('disconnected'); // disconnected, connecting, connected, error
    const [error, setError] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState({}); // conversationTopic -> messages[]

    // Connect to XMTP
    const connect = useCallback(async () => {
        if (!walletClient) {
            setError('Wallet not connected');
            return;
        }

        try {
            setStatus('connecting');
            const { Client } = await import('@xmtp/xmtp-js');
            const xmtp = await Client.create(walletClient, { env: "production" });
            setClient(xmtp);
            setStatus('connected');
            
            // Initial load of conversations
            const allConversations = await xmtp.conversations.list();
            setConversations(allConversations);
        } catch (err) {
            console.error('XMTP Connection Error:', err);
            setError(err.message);
            setStatus('error');
        }
    }, [walletClient]);

    // Send a message
    const sendMessage = useCallback(async (peerAddress, message) => {
        if (!client) throw new Error('XMTP client not initialized');
        
        const conversation = await client.conversations.newConversation(peerAddress);
        await conversation.send(message);
        
        // Refresh messages for this conversation (optimistic update would be better in future)
        const updatedMessages = await conversation.messages();
        setMessages(prev => ({
            ...prev,
            [conversation.topic]: updatedMessages
        }));
    }, [client]);

    // Stream messages (simplified)
    useEffect(() => {
        if (!client) return;

        let isMounted = true;
        const streamMessages = async () => {
            if (!client?.conversations?.streamAllMessages) return;
            const stream = await client.conversations.streamAllMessages();
            for await (const message of stream) {
                if (!isMounted) break;
                
                setMessages(prev => {
                    const topic = message.contentTopic;
                    const existing = prev[topic] || [];
                    if (existing.find(m => m.id === message.id)) return prev;
                    return {
                        ...prev,
                        [topic]: [...existing, message]
                    };
                });
            }
        };

        streamMessages();
        return () => { isMounted = false; };
    }, [client]);

    // Disconnect
    const disconnect = useCallback(() => {
        if (!client) {
            console.error("XMTP client not initialized");
            return;
        }
        setClient(null);
        setStatus('disconnected');
        setMessages({});
    }, [client]);

    return {
        client,
        status,
        error,
        connect,
        disconnect,
        sendMessage,
        conversations,
        messages,
        address: client?.address
    };
};
