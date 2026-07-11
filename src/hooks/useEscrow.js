import { useCallback } from 'react';
import { useConfig, useReadContract, useWriteContract } from 'wagmi';
import { simulateContract } from 'wagmi/actions';
import { escrowAbi } from '../config/abis/escrow';
import { CONTRACTS } from '../config/wagmi';

/**
 * useEscrow — reads MilestoneEscrow state and exposes its actions via the
 * repo-mandated **Simulate → Write → Wait** pattern (CLAUDE.md → Web3 standards).
 *
 * `send()` simulates first (which reverts early with the contract's custom error
 * if the call would fail), then writes; the caller waits on the returned tx hash
 * with `useWaitForTransactionReceipt`. Reads are disabled until the escrow address
 * is set in `src/config/wagmi.js` after deployment (see DEFERRED.md).
 */
export function useEscrow() {
    const config = useConfig();
    const address = CONTRACTS.escrow.address; // null until deployed
    const enabled = Boolean(address);
    const readOpts = (functionName) => ({ address, abi: escrowAbi, functionName, query: { enabled } });

    const { data: totalAmount } = useReadContract(readOpts('totalAmount'));
    const { data: outstanding } = useReadContract(readOpts('outstanding'));
    const { data: funded } = useReadContract(readOpts('funded'));
    const { data: milestoneCount } = useReadContract(readOpts('milestoneCount'));
    const { data: client } = useReadContract(readOpts('client'));
    const { data: provider } = useReadContract(readOpts('provider'));

    const { writeContractAsync, isPending } = useWriteContract();

    // Simulate → Write. Returns the tx hash; caller Waits for the receipt.
    const send = useCallback(
        async (functionName, args = []) => {
            if (!address) throw new Error('Escrow address is not configured yet.');
            const { request } = await simulateContract(config, { address, abi: escrowAbi, functionName, args });
            return writeContractAsync(request);
        },
        [config, address, writeContractAsync],
    );

    return {
        address,
        totalAmount,
        outstanding,
        funded,
        milestoneCount,
        client,
        provider,
        isPending,
        fund: () => send('fund'),
        approveMilestone: (id) => send('approve', [id]),
        releaseMilestone: (id) => send('release', [id]),
        refundMilestone: (id) => send('refund', [id]),
    };
}
