/*
 * jw3b.dev v2 — CTF routes (P2-08 · FR-025 · SDD 03 §5)  ·  backend-specialist
 * `/ctf/verify` confirms a "Capture the Vault" solve ON-CHAIN (Base Sepolia): it reads the
 * ReentrantVault balance + the solver's tx receipt over JSON-RPC, and only if the vault is
 * drained by a succeeded tx does it persist the solve — idempotently (address PK + tx_hash
 * UNIQUE, ON CONFLICT DO NOTHING). `/ctf/leaderboard` returns solves ranked by time, with a
 * KV snapshot fallback so a D1 blip never blanks the board. Chain is authoritative; D1 mirrors.
 *
 * Testnet only (Base Sepolia, no real funds — BR-09/FR-024). All D1 access is parameterized;
 * upstream (RPC/D1) failures degrade to a safe response the client can act on, never a 5xx.
 */
const ADDRESS = /^0x[0-9a-fA-F]{40}$/
const TXHASH = /^0x[0-9a-fA-F]{64}$/

// A drain empties the vault; allow a tiny dust tolerance (wei) for rounding/gas-refund noise.
export const DRAIN_DUST_WEI = 1_000_000_000_000n // 1e-6 ETH

// ── pure: validation ────────────────────────────────────────────────────────────────────
export function validateCtfVerify(b) {
  if (!b || typeof b !== 'object') return { ok: false, error: 'body required' }
  if (!ADDRESS.test(b.address || '')) return { ok: false, error: 'address (40 hex) required' }
  if (!TXHASH.test(b.txHash || '')) return { ok: false, error: 'txHash (64 hex) required' }
  if (b.attacker != null && !ADDRESS.test(b.attacker)) return { ok: false, error: 'attacker must be a 40-hex address' }
  return { ok: true, value: { address: b.address, txHash: b.txHash, attacker: b.attacker ?? null } }
}

// ── pure: JSON-RPC helpers ──────────────────────────────────────────────────────────────
export function buildJsonRpc(method, params, id = 1) {
  return { jsonrpc: '2.0', id, method, params }
}
export const rpcBalanceCall = (vault) => buildJsonRpc('eth_getBalance', [vault, 'latest'])
export const rpcReceiptCall = (txHash) => buildJsonRpc('eth_getTransactionReceipt', [txHash])

/** Parse a hex quantity to BigInt; 0n for anything malformed (never throw into a handler). */
export function hexToBigInt(hex) {
  if (typeof hex !== 'string' || !/^0x[0-9a-fA-F]+$/.test(hex)) return 0n
  return BigInt(hex)
}

/**
 * A solve is valid iff the tx succeeded (receipt status 0x1) AND the vault is now drained to
 * ≤ dust. Both facts come from chain reads — the client cannot assert its own solve.
 */
export function drainConfirmed({ receipt, balanceWei, thresholdWei = DRAIN_DUST_WEI }) {
  if (!receipt || receipt.status !== '0x1' || receipt.blockNumber == null) return false
  return balanceWei <= thresholdWei
}

// ── pure: leaderboard ranking ───────────────────────────────────────────────────────────
/** Rank solves by earliest timestamp (first to capture = rank 1). Returns display entries. */
export function rankSolves(rows) {
  return [...(rows || [])]
    .sort((a, b) => a.ts - b.ts)
    .map((r, i) => ({
      rank: i + 1,
      address: r.address,
      tx_hash: r.tx_hash,
      attacker: r.attacker ?? null,
      block_number: r.block_number,
      ts: r.ts,
    }))
}
export function solverRank(rankedEntries, address) {
  const hit = rankedEntries.find((e) => e.address?.toLowerCase() === address?.toLowerCase())
  return hit ? hit.rank : null
}

// ── impure: RPC fetch ───────────────────────────────────────────────────────────────────
async function rpc(env, call) {
  const res = await fetch(env.CTF_RPC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(call),
  })
  if (!res.ok) throw new Error(`rpc ${res.status}`)
  const json = await res.json()
  return json?.result
}

// ── handlers (return {status, body}) ────────────────────────────────────────────────────
/**
 * POST /ctf/verify {address, txHash, attacker?} → {solved, rank, alreadySolved?, reason?}.
 * Degrades to a safe non-error body when the CTF isn't provisioned or the chain is unreadable.
 */
export async function handleCtfVerify(req, env, ctx, body) {
  const v = validateCtfVerify(body)
  if (!v.ok) return { status: 400, body: { error: v.error } }
  const { address, txHash, attacker } = v.value

  if (!env?.CTF_VAULT_ADDRESS || !env?.CTF_RPC_URL) {
    return { status: 200, body: { solved: false, rank: null, reason: 'CTF is not live yet — Base Sepolia vault not provisioned' } }
  }

  let receipt
  let balanceWei
  try {
    receipt = await rpc(env, rpcReceiptCall(txHash))
    balanceWei = hexToBigInt(await rpc(env, rpcBalanceCall(env.CTF_VAULT_ADDRESS)))
  } catch {
    return { status: 200, body: { solved: false, rank: null, reason: 'could not read the chain right now — try again shortly' } }
  }

  if (!drainConfirmed({ receipt, balanceWei })) {
    return { status: 200, body: { solved: false, rank: null, reason: 'that transaction did not drain the vault' } }
  }

  const blockNumber = Number(hexToBigInt(receipt.blockNumber))
  const ts = Math.floor(Date.now() / 1000)

  if (env.DB) {
    try {
      // Idempotent: address PK + tx_hash UNIQUE — a repeat solve is a no-op, not an error.
      await env.DB.prepare(
        `INSERT INTO ctf_solves (address, tx_hash, attacker, block_number, drained_amount, ts)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6) ON CONFLICT DO NOTHING`,
      )
        .bind(address, txHash, attacker, blockNumber, null, ts)
        .run()
    } catch {
      return { status: 200, body: { solved: true, rank: null, reason: 'solve confirmed on-chain; leaderboard will catch up' } }
    }
  }

  const ranked = await readRanked(env)
  const existing = solverRank(ranked, address)
  return { status: 200, body: { solved: true, rank: existing, alreadySolved: existing != null } }
}

/** GET /ctf/leaderboard → {entries, stale?}. D1 first; KV snapshot fallback; then empty. */
export async function handleCtfLeaderboard(req, env, ctx) {
  try {
    const ranked = await readRanked(env, { throwOnDb: true })
    if (env?.KV) ctx?.waitUntil?.(env.KV.put('ctf:leaderboard', JSON.stringify(ranked), { expirationTtl: 300 }))
    return { status: 200, body: { entries: ranked } }
  } catch {
    if (env?.KV) {
      const snap = await env.KV.get('ctf:leaderboard')
      if (snap) return { status: 200, body: { entries: JSON.parse(snap), stale: true } }
    }
    return { status: 200, body: { entries: [] } }
  }
}

async function readRanked(env, { throwOnDb = false } = {}) {
  if (!env?.DB) {
    if (throwOnDb) throw new Error('no db')
    return []
  }
  const { results } = await env.DB.prepare(
    `SELECT address, tx_hash, attacker, block_number, ts FROM ctf_solves ORDER BY ts ASC`,
  ).all()
  return rankSolves(results)
}
