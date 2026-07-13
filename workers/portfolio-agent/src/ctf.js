// 🕹️ CTF verification — proves an on-chain reentrancy "capture" of the ReentrantVault
// (contracts/src/ctf/ReentrantVault.sol, deployed to Base Sepolia). No keys held here:
// we only READ chain state over JSON-RPC and check the vault was genuinely drained.

const isAddr = (s) => typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s);
const isTxHash = (s) => typeof s === 'string' && /^0x[0-9a-fA-F]{64}$/.test(s);
const hexToBig = (h) => (h ? BigInt(h) : 0n);

// Minimal JSON-RPC call against a public Base Sepolia node.
async function rpc(url, method, params) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`RPC ${method} HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`RPC ${method}: ${json.error.message}`);
    return json.result;
}

/**
 * Verify that `txHash` (sent by `address`) drained the ReentrantVault.
 *
 * A capture is real iff:
 *  1. the tx exists, is mined, and its receipt status is success;
 *  2. tx.from === the claimed address (you can only claim txs you signed);
 *  3. the vault's ETH balance was > 0 at block-1 (there was bait to steal) and the
 *     tx emptied it (>= 90% drained) — measuring at block-1 vs block means merely
 *     withdrawing your OWN deposit (which lands inside the same tx) can't qualify.
 *
 * Fail-closed: returns { ok: false, reason } on any check failure or RPC error.
 */
export async function verifyCapture(env, address, txHash) {
    const rpcUrl = env.CTF_RPC_URL || 'https://sepolia.base.org';
    const vault = (env.CTF_VAULT_ADDRESS || '').toLowerCase();
    if (!isAddr(vault)) return { ok: false, reason: 'CTF vault is not configured on the server.' };
    if (!isAddr(address)) return { ok: false, reason: 'Invalid wallet address.' };
    if (!isTxHash(txHash)) return { ok: false, reason: 'Invalid transaction hash.' };

    let tx, receipt;
    try {
        tx = await rpc(rpcUrl, 'eth_getTransactionByHash', [txHash]);
        if (!tx) return { ok: false, reason: 'Transaction not found on Base Sepolia.' };
        if (!tx.blockNumber) return { ok: false, reason: 'Transaction is not mined yet — wait for confirmation.' };
        if ((tx.from || '').toLowerCase() !== address.toLowerCase()) {
            return { ok: false, reason: 'That transaction was not sent by your wallet.' };
        }
        receipt = await rpc(rpcUrl, 'eth_getTransactionReceipt', [txHash]);
        if (!receipt || hexToBig(receipt.status) !== 1n) {
            return { ok: false, reason: 'That transaction reverted — no capture.' };
        }

        const blockNum = hexToBig(tx.blockNumber);
        const prevHex = '0x' + (blockNum - 1n).toString(16);
        const [beforeHex, afterHex] = await Promise.all([
            rpc(rpcUrl, 'eth_getBalance', [vault, prevHex]),
            rpc(rpcUrl, 'eth_getBalance', [vault, tx.blockNumber]),
        ]);
        const before = hexToBig(beforeHex);
        const after = hexToBig(afterHex);

        if (before === 0n) {
            return { ok: false, reason: 'The vault was already empty before your transaction — nothing to drain. Wait for it to be re-seeded.' };
        }
        const drained = before - after;
        if (drained * 10n < before * 9n) {
            return { ok: false, reason: 'Your transaction did not drain the vault. Reentrancy should empty it in one shot.' };
        }
        return { ok: true, blockNumber: Number(blockNum), drained: drained.toString() };
    } catch (err) {
        return { ok: false, reason: `On-chain verification failed: ${err.message}` };
    }
}
