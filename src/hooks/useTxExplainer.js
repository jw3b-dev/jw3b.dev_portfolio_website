import { useState, useCallback } from 'react';
import { createPublicClient, http, parseEventLogs, erc20Abi, formatEther, isHash } from 'viem';
import { base } from 'viem/chains';
import { AGENT_TX_URL } from '../config/worker';
import { useAgentStream } from './useAgentStream';

const publicClient = createPublicClient({ chain: base, transport: http() });

// Fetch a Base transaction + receipt and decode it into a compact summary the AI can narrate.
async function decodeTx(hash) {
    const [tx, receipt] = await Promise.all([
        publicClient.getTransaction({ hash }),
        publicClient.getTransactionReceipt({ hash }),
    ]);

    const erc20Events = parseEventLogs({ abi: erc20Abi, logs: receipt.logs });
    const transfers = erc20Events
        .filter((e) => e.eventName === 'Transfer')
        .map((e) => ({ token: e.address, from: e.args.from, to: e.args.to, value: e.args.value?.toString() }));
    const approvals = erc20Events
        .filter((e) => e.eventName === 'Approval')
        .map((e) => ({ token: e.address, owner: e.args.owner, spender: e.args.spender, value: e.args.value?.toString() }));

    return {
        hash,
        from: tx.from,
        to: tx.to,
        contractCreation: tx.to === null,
        valueEth: formatEther(tx.value),
        methodSelector: tx.input && tx.input !== '0x' ? tx.input.slice(0, 10) : null,
        status: receipt.status,
        gasUsed: receipt.gasUsed?.toString(),
        transferCount: transfers.length,
        transfers: transfers.slice(0, 20),
        approvals: approvals.slice(0, 10),
    };
}

/**
 * useTxExplainer — decodes a Base tx client-side (viem), then streams a plain-English
 * AI narration from the Worker `/tx-explain` route.
 */
export const useTxExplainer = () => {
    const { output, run, isLoading: aiLoading, error: aiError, reset } = useAgentStream(AGENT_TX_URL);
    const [decoding, setDecoding] = useState(false);
    const [error, setError] = useState(null);

    const explainTx = useCallback(
        async (hash) => {
            const trimmed = (hash || '').trim();
            if (!isHash(trimmed)) {
                setError('Enter a valid 0x transaction hash (66 characters).');
                return;
            }
            setError(null);
            setDecoding(true);
            let decoded;
            try {
                decoded = await decodeTx(trimmed);
            } catch (err) {
                console.error('Tx decode error:', err);
                setError('Could not fetch or decode that transaction on Base.');
                return;
            } finally {
                setDecoding(false);
            }
            return run({ decoded });
        },
        [run],
    );

    return { report: output, explainTx, isLoading: decoding || aiLoading, error: error || aiError, reset };
};
