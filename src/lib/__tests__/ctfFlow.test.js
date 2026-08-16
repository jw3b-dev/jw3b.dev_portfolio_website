import { describe, it, expect } from 'vitest'
import { resolveCtfPhase, ctfVerifyBody, recordedSolve, CTF_LABEL } from '../ctfFlow.js'

const base = { provisioned: true, connected: true, correctChain: true, vaultFunded: true }

describe('resolveCtfPhase — CTF state machine (FR-023)', () => {
  it('gates on provisioning, wallet, chain first', () => {
    expect(resolveCtfPhase({ ...base, provisioned: false }).phase).toBe('unprovisioned')
    expect(resolveCtfPhase({ ...base, connected: false }).phase).toBe('disconnected')
    expect(resolveCtfPhase({ ...base, correctChain: false }).phase).toBe('wrong-chain')
  })
  it('vault-empty when there is no bounty to drain', () => {
    expect(resolveCtfPhase({ ...base, vaultFunded: false }).phase).toBe('vault-empty')
  })
  it('walks deploy → attack → verify', () => {
    expect(resolveCtfPhase({ ...base, deploy: { pending: true } }).phase).toBe('deploying')
    expect(resolveCtfPhase({ ...base, attack: { pending: true } }).phase).toBe('attacking')
    expect(resolveCtfPhase({ ...base, verify: { loading: true } }).phase).toBe('verifying')
    expect(resolveCtfPhase(base).phase).toBe('ready')
  })
  it('terminal solve states', () => {
    expect(resolveCtfPhase({ ...base, verify: { solved: true } }).phase).toBe('solved')
    expect(resolveCtfPhase({ ...base, verify: { solved: true, alreadySolved: true } }).phase).toBe('already-solved')
  })
  it('degrades: worker-down → recorded solve; a verify/attack/deploy error → error+reason', () => {
    expect(resolveCtfPhase({ ...base, verify: { recorded: true } })).toMatchObject({ phase: 'recorded', degrade: true })
    expect(resolveCtfPhase({ ...base, verify: { error: { shortMessage: 'nope' } } })).toMatchObject({ phase: 'error', reason: 'nope', degrade: true })
    expect(resolveCtfPhase({ ...base, attack: { error: { message: 'user rejected' } } }).reason).toBe('user rejected')
    expect(resolveCtfPhase({ ...base, deploy: { error: { message: 'gas' } } }).phase).toBe('error')
  })
  it('EDGE: no args → unprovisioned', () => expect(resolveCtfPhase().phase).toBe('unprovisioned'))
})

describe('helpers', () => {
  it('CTF_LABEL is the honest testnet banner (FR-024)', () => {
    expect(CTF_LABEL).toMatch(/base sepolia/i)
    expect(CTF_LABEL).toMatch(/no real funds/i)
  })
  it('ctfVerifyBody shapes the /ctf/verify payload', () => {
    expect(ctfVerifyBody({ address: '0xa', txHash: '0xb' })).toEqual({ address: '0xa', txHash: '0xb', attacker: null })
    expect(ctfVerifyBody({ address: '0xa', txHash: '0xb', attacker: '0xc' }).attacker).toBe('0xc')
  })
  it('recordedSolve is explicitly labelled recorded (FR-026)', () => {
    expect(recordedSolve()).toMatchObject({ recorded: true, label: 'Recorded solve' })
  })
})
