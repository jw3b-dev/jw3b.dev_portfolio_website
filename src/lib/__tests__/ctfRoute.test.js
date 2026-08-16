import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  validateCtfVerify,
  drainConfirmed,
  hexToBigInt,
  rankSolves,
  solverRank,
  rpcBalanceCall,
  rpcReceiptCall,
  handleCtfVerify,
  handleCtfLeaderboard,
  DRAIN_DUST_WEI,
} from '../../../workers/portfolio-agent/src/routes/ctf.js'

const A = '0x' + 'a'.repeat(40)
const TX = '0x' + 'b'.repeat(64)

describe('validateCtfVerify (FR-025)', () => {
  it('accepts a valid address + txHash (+ optional attacker)', () => {
    expect(validateCtfVerify({ address: A, txHash: TX }).ok).toBe(true)
    expect(validateCtfVerify({ address: A, txHash: TX, attacker: A }).value.attacker).toBe(A)
  })
  it('rejects bad body / address / txHash / attacker', () => {
    expect(validateCtfVerify(null).ok).toBe(false)
    expect(validateCtfVerify({ address: 'x', txHash: TX }).ok).toBe(false)
    expect(validateCtfVerify({ address: A, txHash: 'x' }).ok).toBe(false)
    expect(validateCtfVerify({ address: A, txHash: TX, attacker: 'nope' }).ok).toBe(false)
  })
})

describe('drainConfirmed — chain is authoritative', () => {
  const receipt = { status: '0x1', blockNumber: '0x10' }
  it('true only when tx succeeded AND vault drained to ≤ dust', () => {
    expect(drainConfirmed({ receipt, balanceWei: 0n })).toBe(true)
    expect(drainConfirmed({ receipt, balanceWei: DRAIN_DUST_WEI })).toBe(true)
  })
  it('false on failed tx, missing block, or a still-funded vault', () => {
    expect(drainConfirmed({ receipt: { status: '0x0', blockNumber: '0x10' }, balanceWei: 0n })).toBe(false)
    expect(drainConfirmed({ receipt: { status: '0x1' }, balanceWei: 0n })).toBe(false)
    expect(drainConfirmed({ receipt, balanceWei: 5n * DRAIN_DUST_WEI })).toBe(false)
    expect(drainConfirmed({ receipt: null, balanceWei: 0n })).toBe(false)
  })
})

describe('hexToBigInt + rpc builders', () => {
  it('parses hex, 0n for junk', () => {
    expect(hexToBigInt('0x10')).toBe(16n)
    expect(hexToBigInt('nope')).toBe(0n)
    expect(hexToBigInt(null)).toBe(0n)
  })
  it('builds JSON-RPC calls', () => {
    expect(rpcBalanceCall(A)).toMatchObject({ method: 'eth_getBalance', params: [A, 'latest'] })
    expect(rpcReceiptCall(TX)).toMatchObject({ method: 'eth_getTransactionReceipt', params: [TX] })
  })
})

describe('rankSolves / solverRank — earliest solve is rank 1', () => {
  const rows = [
    { address: '0x2', tx_hash: 't2', block_number: 2, ts: 200 },
    { address: '0x1', tx_hash: 't1', block_number: 1, ts: 100 },
  ]
  it('ranks by ascending ts', () => {
    const r = rankSolves(rows)
    expect(r[0]).toMatchObject({ rank: 1, address: '0x1' })
    expect(r[1]).toMatchObject({ rank: 2, address: '0x2' })
  })
  it('solverRank finds a case-insensitive address, null when absent', () => {
    const r = rankSolves(rows)
    expect(solverRank(r, '0X1')).toBe(1)
    expect(solverRank(r, '0xNope')).toBeNull()
  })
  it('EDGE: empty', () => expect(rankSolves()).toEqual([]))
})

describe('handleCtfVerify — degrade + idempotent persist', () => {
  it('degrades when the vault is not provisioned', async () => {
    const out = await handleCtfVerify({}, {}, {}, { address: A, txHash: TX })
    expect(out.status).toBe(200)
    expect(out.body).toMatchObject({ solved: false, reason: expect.stringMatching(/not live/i) })
  })

  it('400 on invalid input', async () => {
    const out = await handleCtfVerify({}, { CTF_VAULT_ADDRESS: A, CTF_RPC_URL: 'x' }, {}, { address: 'bad', txHash: TX })
    expect(out.status).toBe(400)
  })

  it('degrades gracefully when the RPC is unreadable', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('down'))))
    const out = await handleCtfVerify({}, { CTF_VAULT_ADDRESS: A, CTF_RPC_URL: 'https://rpc' }, {}, { address: A, txHash: TX })
    expect(out.body).toMatchObject({ solved: false, reason: expect.stringMatching(/chain/i) })
  })

  it('confirmed drain → idempotent INSERT + ranked', async () => {
    // fetch: first call = receipt, second = balance 0x0.
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(() => {
        call += 1
        const result = call === 1 ? { status: '0x1', blockNumber: '0x10' } : '0x0'
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ result }) })
      }),
    )
    const run = vi.fn(() => Promise.resolve())
    const bind = vi.fn(() => ({ run }))
    const prepare = vi.fn(() => ({
      bind,
      all: () => Promise.resolve({ results: [{ address: A, tx_hash: TX, block_number: 16, ts: 5 }] }),
    }))
    const env = { CTF_VAULT_ADDRESS: A, CTF_RPC_URL: 'https://rpc', DB: { prepare } }
    const out = await handleCtfVerify({}, env, {}, { address: A, txHash: TX })

    expect(out.body.solved).toBe(true)
    expect(out.body.rank).toBe(1)
    // parameterized insert (ON CONFLICT DO NOTHING) fired
    expect(prepare.mock.calls[0][0]).toMatch(/INSERT INTO ctf_solves/)
    expect(prepare.mock.calls[0][0]).toMatch(/ON CONFLICT DO NOTHING/)
  })

  afterEach(() => vi.unstubAllGlobals())
})

describe('handleCtfLeaderboard — D1 then KV snapshot fallback', () => {
  it('returns ranked entries from D1', async () => {
    const env = {
      DB: { prepare: () => ({ all: () => Promise.resolve({ results: [{ address: A, tx_hash: TX, block_number: 1, ts: 1 }] }) }) },
    }
    const out = await handleCtfLeaderboard({}, env, {})
    expect(out.body.entries[0]).toMatchObject({ rank: 1, address: A })
  })

  it('falls back to the KV snapshot when D1 throws', async () => {
    const env = {
      DB: { prepare: () => ({ all: () => Promise.reject(new Error('d1 down')) }) },
      KV: { get: () => Promise.resolve(JSON.stringify([{ rank: 1, address: A }])) },
    }
    const out = await handleCtfLeaderboard({}, env, {})
    expect(out.body).toMatchObject({ stale: true })
    expect(out.body.entries[0].address).toBe(A)
  })

  it('empty board when neither D1 nor KV has data', async () => {
    const out = await handleCtfLeaderboard({}, {}, {})
    expect(out.body.entries).toEqual([])
  })
})
