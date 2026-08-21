/*
 * CTF verification — the on-chain proof boundary. A false "solved" would be a claim the site
 * cannot back, which is the one thing this project treats as unforgivable.
 */
import { describe, it, expect, afterEach } from 'vitest'
import { validateCtfVerify, hexToBigInt, drainConfirmed, rankSolves, solverRank, DRAIN_DUST_WEI, buildJsonRpc, handleCtfVerify, handleCtfLeaderboard } from '../routes/ctf.js'

describe('validateCtfVerify', () => {
  const ok = { address: '0x' + 'a'.repeat(40), txHash: '0x' + '1'.repeat(64) }

  it('accepts a well-formed submission', () => {
    expect(validateCtfVerify(ok).ok).toBe(true)
  })
  it('rejects a missing or malformed address', () => {
    for (const bad of [{}, { address: '0x123' }, { address: 'nope' }, { address: null }]) {
      expect(validateCtfVerify(bad).ok).toBe(false)
    }
  })
  it('rejects a malformed optional attacker address but allows it to be absent', () => {
    expect(validateCtfVerify({ ...ok, attacker: '0xshort' }).ok).toBe(false)
    expect(validateCtfVerify({ ...ok, attacker: null }).ok).toBe(true)
  })
  it('never throws on hostile input', () => {
    for (const bad of [null, undefined, 'string', 42, []]) {
      expect(() => validateCtfVerify(bad)).not.toThrow()
    }
  })
})

describe('hexToBigInt', () => {
  it('parses hex quantities and treats missing values as zero', () => {
    expect(hexToBigInt('0x10')).toBe(16n)
    expect(hexToBigInt('0x0')).toBe(0n)
    for (const bad of [null, undefined, '', 'nope']) expect(hexToBigInt(bad)).toBe(0n)
  })
})

describe('drainConfirmed — proof, not assertion', () => {
  // Both facts come from chain reads: the tx must have SUCCEEDED and the vault must now be
  // empty. A client cannot assert its own solve.
  const good = { status: '0x1', blockNumber: '0x10' }

  it('confirms a successful tx that left the vault at or below dust', () => {
    expect(drainConfirmed({ receipt: good, balanceWei: 0n })).toBe(true)
    expect(drainConfirmed({ receipt: good, balanceWei: DRAIN_DUST_WEI })).toBe(true)
  })

  it('does NOT confirm while the vault still holds a real balance', () => {
    expect(drainConfirmed({ receipt: good, balanceWei: DRAIN_DUST_WEI + 1n })).toBe(false)
    expect(drainConfirmed({ receipt: good, balanceWei: 10n ** 15n })).toBe(false)
  })

  it('does NOT confirm on a REVERTED tx, even if the vault happens to be empty', () => {
    expect(drainConfirmed({ receipt: { status: '0x0', blockNumber: '0x10' }, balanceWei: 0n })).toBe(false)
  })

  it('does NOT confirm without a receipt, or before the tx is mined', () => {
    expect(drainConfirmed({ receipt: null, balanceWei: 0n })).toBe(false)
    expect(drainConfirmed({ receipt: { status: '0x1', blockNumber: null }, balanceWei: 0n })).toBe(false)
  })

  it('honours an explicit threshold override', () => {
    expect(drainConfirmed({ receipt: good, balanceWei: 5n, thresholdWei: 4n })).toBe(false)
    expect(drainConfirmed({ receipt: good, balanceWei: 5n, thresholdWei: 5n })).toBe(true)
  })
})

describe('rankSolves / solverRank', () => {
  const rows = [
    { address: '0xAAA', ts: 300 },
    { address: '0xBBB', ts: 100 },
    { address: '0xCCC', ts: 200 },
  ]
  it('ranks earliest solve first', () => {
    expect(rankSolves(rows).map((r) => r.address)).toEqual(['0xBBB', '0xCCC', '0xAAA'])
  })
  it('finds a solver’s rank case-insensitively', () => {
    expect(solverRank(rankSolves(rows), '0xbbb')).toBe(1)
    expect(solverRank(rankSolves(rows), '0xAAA')).toBe(3)
  })
  it('returns null for an address that never solved, and tolerates empty input', () => {
    expect(solverRank(rankSolves(rows), '0xZZZ')).toBeNull()
    expect(rankSolves([])).toEqual([])
    expect(solverRank([], '0xAAA')).toBeNull()
  })
})

describe('buildJsonRpc', () => {
  it('builds a well-formed JSON-RPC payload', () => {
    expect(buildJsonRpc('eth_getBalance', ['0xabc', 'latest'])).toEqual({
      jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: ['0xabc', 'latest'],
    })
  })
  it('allows an explicit request id', () => {
    expect(buildJsonRpc('eth_chainId', [], 7).id).toBe(7)
  })
})

describe('handleCtfVerify — the on-chain proof handler', () => {
  const OK = { address: '0x' + 'a'.repeat(40), txHash: '0x' + '1'.repeat(64) }
  const env = (over = {}) => ({
    CTF_VAULT_ADDRESS: '0x' + 'f'.repeat(40),
    CTF_RPC_URL: 'https://rpc.test',
    ...over,
  })
  // Chain responses come back in call order: receipt, then balance.
  const mockRpc = (...results) => {
    let i = 0
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ result: results[i++] }) })
  }
  const db = (onRun) => ({
    prepare: () => ({ bind: () => ({ run: onRun || (async () => {}) }), all: async () => ({ results: [] }) }),
  })

  afterEach(() => { delete globalThis.fetch })

  it('rejects an invalid body with 400 and never touches the chain', async () => {
    let called = false
    globalThis.fetch = async () => { called = true }
    const r = await handleCtfVerify(null, env(), null, { address: 'bad' })
    expect(r.status).toBe(400)
    expect(called).toBe(false)
  })

  it('degrades honestly when the CTF is not provisioned — 200, not an error', async () => {
    const r = await handleCtfVerify(null, {}, null, OK)
    expect(r.status).toBe(200)
    expect(r.body.solved).toBe(false)
    expect(r.body.reason).toMatch(/not live yet/i)
  })

  it('degrades honestly when the chain is unreadable', async () => {
    globalThis.fetch = async () => { throw new Error('rpc down') }
    const r = await handleCtfVerify(null, env(), null, OK)
    expect(r.status).toBe(200)
    expect(r.body.solved).toBe(false)
    expect(r.body.reason).toMatch(/could not read the chain/i)
  })

  it('REFUSES to confirm a solve when the vault still holds a balance', async () => {
    mockRpc({ status: '0x1', blockNumber: '0x10' }, '0x' + (10n ** 15n).toString(16))
    const r = await handleCtfVerify(null, env(), null, OK)
    expect(r.body.solved).toBe(false)
    expect(r.body.reason).toMatch(/did not drain/i)
  })

  it('REFUSES to confirm a solve on a reverted transaction', async () => {
    mockRpc({ status: '0x0', blockNumber: '0x10' }, '0x0')
    const r = await handleCtfVerify(null, env(), null, OK)
    expect(r.body.solved).toBe(false)
  })

  it('confirms a genuine drain and records it', async () => {
    mockRpc({ status: '0x1', blockNumber: '0x10' }, '0x0')
    let wrote = false
    const r = await handleCtfVerify(null, env({ DB: db(async () => { wrote = true }) }), null, OK)
    expect(r.body.solved).toBe(true)
    expect(wrote).toBe(true)
  })

  it('still reports the confirmed solve when the leaderboard write fails', async () => {
    mockRpc({ status: '0x1', blockNumber: '0x10' }, '0x0')
    const r = await handleCtfVerify(null, env({ DB: db(async () => { throw new Error('d1 down') }) }), null, OK)
    expect(r.body.solved).toBe(true) // the chain is the source of truth, not our database
    expect(r.body.reason).toMatch(/leaderboard will catch up/i)
  })

  it('confirms without a database bound at all', async () => {
    mockRpc({ status: '0x1', blockNumber: '0x10' }, '0x0')
    const r = await handleCtfVerify(null, env(), null, OK)
    expect(r.body.solved).toBe(true)
  })
})

describe('handleCtfLeaderboard', () => {
  afterEach(() => { delete globalThis.fetch })

  it('returns entries from the database', async () => {
    const env = { DB: { prepare: () => ({ all: async () => ({ results: [{ address: '0xA', ts: 1 }] }) }) } }
    const r = await handleCtfLeaderboard(null, env)
    expect(r.status).toBe(200)
    expect(Array.isArray(r.body.entries)).toBe(true)
  })

  it('returns an empty list rather than an error when the database is absent or broken', async () => {
    expect((await handleCtfLeaderboard(null, {})).body.entries).toEqual([])
    const broken = { DB: { prepare: () => { throw new Error('down') } } }
    expect((await handleCtfLeaderboard(null, broken)).body.entries).toEqual([])
  })
})
