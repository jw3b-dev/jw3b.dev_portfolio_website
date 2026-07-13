import { useState, useCallback, useEffect } from 'react';
import { useAccount, useBalance, useWalletClient, usePublicClient, useSwitchChain } from 'wagmi';
import { attackerAbi, attackerBytecode } from '../config/abis/attacker';
import { CONTRACTS } from '../config/wagmi';
import { AGENT_CTF_VERIFY_URL, AGENT_CTF_LEADERBOARD_URL } from '../config/worker';

const VAULT = CONTRACTS.ctf.address;
const CHAIN_ID = CONTRACTS.ctf.chainId; // baseSepolia.id

// Minimal ABI for re-arming the vault (deposit is payable, becomes bait).
const vaultAbi = [{ type: 'function', name: 'deposit', stateMutability: 'payable', inputs: [], outputs: [] }];

/**
 * useCtf — drives the "Capture the Vault" reentrancy CTF on Base Sepolia.
 *
 * The headline flow is `runExploit()`: from the connected wallet it deploys the
 * reference Attacker, calls `attack{value}` (which reenters withdraw() until the
 * vault is dry), then submits the winning tx to the Worker's `/ctf/verify` — which
 * independently confirms the drain on-chain before recording the capture.
 */
export function useCtf() {
    const { address, isConnected, chainId } = useAccount();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient({ chainId: CHAIN_ID });
    const { switchChainAsync } = useSwitchChain();

    const { data: vaultBal, refetch: refetchBalance } = useBalance({ address: VAULT, chainId: CHAIN_ID });
    const vaultBalance = vaultBal?.value ?? 0n;
    const onWrongChain = isConnected && chainId !== CHAIN_ID;

    const [leaderboard, setLeaderboard] = useState([]);
    const [status, setStatus] = useState('idle'); // idle|switching|deploying|attacking|verifying|success|error
    const [statusMessage, setStatusMessage] = useState('');
    const [result, setResult] = useState(null); // { rank, drained, alreadySolved }

    const refreshLeaderboard = useCallback(async () => {
        try {
            const res = await fetch(AGENT_CTF_LEADERBOARD_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: '{}',
            });
            const json = await res.json();
            setLeaderboard(Array.isArray(json.solves) ? json.solves : []);
        } catch {
            /* leave the last-known board on transient errors */
        }
    }, []);

    useEffect(() => {
        refreshLeaderboard();
    }, [refreshLeaderboard]);

    // POST a winning tx to the Worker for independent on-chain verification.
    const submitCapture = useCallback(
        async (txHash) => {
            setStatus('verifying');
            setStatusMessage('Verifying the drain on-chain…');
            const res = await fetch(AGENT_CTF_VERIFY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, txHash }),
            });
            const json = await res.json();
            if (!json.ok) {
                setStatus('error');
                setStatusMessage(json.reason || 'Verification failed.');
                return json;
            }
            setResult(json);
            setStatus('success');
            setStatusMessage(json.alreadySolved ? 'Already captured — you keep your spot.' : 'Vault captured!');
            await refreshLeaderboard();
            return json;
        },
        [address, refreshLeaderboard],
    );

    const ensureChain = useCallback(async () => {
        if (chainId === CHAIN_ID) return true;
        setStatus('switching');
        setStatusMessage('Switch your wallet to Base Sepolia…');
        try {
            await switchChainAsync({ chainId: CHAIN_ID });
            return true;
        } catch {
            setStatus('error');
            setStatusMessage('Please switch to Base Sepolia to play.');
            return false;
        }
    }, [chainId, switchChainAsync]);

    // The headline one-click exploit: deploy → attack → verify.
    const runExploit = useCallback(async () => {
        if (!walletClient || !publicClient || !address) {
            setStatus('error');
            setStatusMessage('Connect a wallet first.');
            return;
        }
        if (!(await ensureChain())) return;

        // Re-read live balance; the stolen bait must exist and exceed our own stake.
        const { data: fresh } = await refetchBalance();
        const bait = fresh?.value ?? vaultBalance;
        if (bait === 0n) {
            setStatus('error');
            setStatusMessage('The vault is empty — seed it below to arm the challenge, then attack.');
            return;
        }
        // Stake == current bait → the reentrancy empties the vault in ~2 re-entries.
        const stake = bait;

        try {
            setStatus('deploying');
            setStatusMessage('Deploying your Attacker contract… (confirm in wallet)');
            const deployHash = await walletClient.deployContract({
                abi: attackerAbi,
                bytecode: attackerBytecode,
                args: [VAULT],
            });
            const deployRcpt = await publicClient.waitForTransactionReceipt({ hash: deployHash });
            const attacker = deployRcpt.contractAddress;
            if (!attacker) throw new Error('Attacker deployment did not return an address.');

            setStatus('attacking');
            setStatusMessage('Running the reentrancy attack… (confirm in wallet)');
            const attackHash = await walletClient.writeContract({
                address: attacker,
                abi: attackerAbi,
                functionName: 'attack',
                value: stake,
            });
            await publicClient.waitForTransactionReceipt({ hash: attackHash });

            await submitCapture(attackHash);
            refetchBalance();
        } catch (err) {
            setStatus('error');
            setStatusMessage(err?.shortMessage || err?.message || 'The exploit transaction failed.');
        }
    }, [walletClient, publicClient, address, ensureChain, refetchBalance, vaultBalance, submitCapture]);

    // Deposit ETH to (re-)arm the vault as bait for the next attacker.
    const seedVault = useCallback(
        async (amountWei) => {
            if (!walletClient || !address) {
                setStatus('error');
                setStatusMessage('Connect a wallet first.');
                return;
            }
            if (!(await ensureChain())) return;
            try {
                setStatus('deploying');
                setStatusMessage('Seeding the vault with bait… (confirm in wallet)');
                const hash = await walletClient.writeContract({
                    address: VAULT,
                    abi: vaultAbi,
                    functionName: 'deposit',
                    value: amountWei,
                });
                await publicClient.waitForTransactionReceipt({ hash });
                setStatus('idle');
                setStatusMessage('Vault armed. Now run the exploit.');
                refetchBalance();
            } catch (err) {
                setStatus('error');
                setStatusMessage(err?.shortMessage || err?.message || 'Seeding failed.');
            }
        },
        [walletClient, publicClient, address, ensureChain, refetchBalance],
    );

    // Manual claim for players who ran their own exploit tooling.
    const claim = useCallback(
        async (txHash) => {
            if (!address) {
                setStatus('error');
                setStatusMessage('Connect the wallet that sent the transaction.');
                return;
            }
            try {
                return await submitCapture(txHash.trim());
            } catch (err) {
                setStatus('error');
                setStatusMessage(err?.message || 'Verification failed.');
            }
        },
        [address, submitCapture],
    );

    const busy = ['switching', 'deploying', 'attacking', 'verifying'].includes(status);

    return {
        vaultAddress: VAULT,
        chainId: CHAIN_ID,
        vaultBalance,
        isConnected,
        onWrongChain,
        leaderboard,
        status,
        statusMessage,
        result,
        busy,
        runExploit,
        seedVault,
        claim,
        refreshLeaderboard,
        switchToChain: ensureChain,
    };
}
