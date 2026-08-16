import { describe, it, expect } from 'vitest'
import {
  XMTP_STATUS,
  initialXmtpState,
  isEthAddress,
  channelGate,
  normalizeXmtpMessage,
  dedupeById,
  xmtpReducer,
} from '../xmtpFlow.js'

const ADDR = '0x1111111111111111111111111111111111111111'
const ADDR2 = '0x2222222222222222222222222222222222222222'

describe('isEthAddress', () => {
  it('accepts a 0x + 40-hex address', () => expect(isEthAddress(ADDR)).toBe(true))
  it('rejects a too-short string', () => expect(isEthAddress('0x1234')).toBe(false))
  it('rejects non-hex characters', () => expect(isEthAddress('0x' + 'z'.repeat(40))).toBe(false))
  it('rejects a missing 0x prefix', () => expect(isEthAddress('1'.repeat(40))).toBe(false))
  it('rejects non-strings', () => {
    expect(isEthAddress(null)).toBe(false)
    expect(isEthAddress(123)).toBe(false)
  })
})

describe('initialXmtpState', () => {
  it('is READY with a valid address', () => {
    expect(initialXmtpState(ADDR)).toMatchObject({ status: XMTP_STATUS.READY, address: ADDR, messages: [] })
  })
  it('is NO_WALLET with no address', () => {
    expect(initialXmtpState('')).toMatchObject({ status: XMTP_STATUS.NO_WALLET, address: '' })
  })
  it('is NO_WALLET (address dropped) with an invalid address', () => {
    expect(initialXmtpState('nope')).toMatchObject({ status: XMTP_STATUS.NO_WALLET, address: '' })
  })
})

describe('channelGate — the degrade decision', () => {
  it('flag-off when disabled (and with no args)', () => {
    expect(channelGate()).toEqual({ ok: false, reason: 'flag-off' })
    expect(channelGate({ flagEnabled: false, recipient: ADDR, walletAddress: ADDR2 })).toEqual({ ok: false, reason: 'flag-off' })
  })
  it('no-recipient when the recipient is unset/invalid', () => {
    expect(channelGate({ flagEnabled: true, recipient: '', walletAddress: ADDR })).toEqual({ ok: false, reason: 'no-recipient' })
  })
  it('no-wallet when the wallet is unset/invalid', () => {
    expect(channelGate({ flagEnabled: true, recipient: ADDR, walletAddress: '' })).toEqual({ ok: false, reason: 'no-wallet' })
  })
  it('ready when flag + recipient + wallet are all present', () => {
    expect(channelGate({ flagEnabled: true, recipient: ADDR, walletAddress: ADDR2 })).toEqual({ ok: true, reason: 'ready' })
  })
})

describe('normalizeXmtpMessage', () => {
  it('maps a full DecodedMessage', () => {
    expect(normalizeXmtpMessage({ id: 'm1', content: 'hi', senderInboxId: 'ib', sentAtNs: 42n })).toEqual({
      id: 'm1',
      content: 'hi',
      senderInboxId: 'ib',
      sentAtNs: '42',
    })
  })
  it('synthesizes an id from sentAtNs:sender when id is missing', () => {
    expect(normalizeXmtpMessage({ content: 'x', senderInboxId: 'ib', sentAtNs: 7 }).id).toBe('7:ib')
  })
  it('coerces non-string content to empty and tolerates null', () => {
    expect(normalizeXmtpMessage({ id: 'm', content: { rich: true } }).content).toBe('')
    expect(normalizeXmtpMessage(null)).toEqual({ id: ':', content: '', senderInboxId: '', sentAtNs: '' })
  })
})

describe('dedupeById', () => {
  it('removes duplicate ids, preserving first-seen order', () => {
    const out = dedupeById([{ id: 'a' }, { id: 'b' }, { id: 'a' }])
    expect(out.map((m) => m.id)).toEqual(['a', 'b'])
  })
  it('skips entries with no id and tolerates a non-array', () => {
    expect(dedupeById([{ id: '' }, { nope: 1 }, { id: 'k' }]).map((m) => m.id)).toEqual(['k'])
    expect(dedupeById(null)).toEqual([])
  })
})

describe('xmtpReducer', () => {
  const connected = { status: XMTP_STATUS.CONNECTED, address: ADDR, inboxId: 'me', error: '', messages: [{ id: 'a' }] }

  it('WALLET_CHANGED to a valid address from NO_WALLET → READY', () => {
    const s = xmtpReducer(initialXmtpState(''), { type: 'WALLET_CHANGED', address: ADDR })
    expect(s).toMatchObject({ status: XMTP_STATUS.READY, address: ADDR })
  })
  it('WALLET_CHANGED to the same address while connected is a no-op', () => {
    expect(xmtpReducer(connected, { type: 'WALLET_CHANGED', address: ADDR })).toBe(connected)
  })
  it('WALLET_CHANGED to a new address resets the channel to READY', () => {
    const s = xmtpReducer(connected, { type: 'WALLET_CHANGED', address: ADDR2 })
    expect(s).toMatchObject({ status: XMTP_STATUS.READY, address: ADDR2, messages: [], inboxId: '' })
  })
  it('WALLET_CHANGED to empty/invalid → NO_WALLET reset', () => {
    expect(xmtpReducer(connected, { type: 'WALLET_CHANGED', address: '' })).toMatchObject({
      status: XMTP_STATUS.NO_WALLET,
      address: '',
      messages: [],
    })
  })

  it('INIT_START from READY/ERROR/UNREACHABLE → INITIALIZING; ignored while connected', () => {
    for (const status of [XMTP_STATUS.READY, XMTP_STATUS.ERROR, XMTP_STATUS.UNREACHABLE]) {
      expect(xmtpReducer({ ...connected, status }, { type: 'INIT_START' }).status).toBe(XMTP_STATUS.INITIALIZING)
    }
    expect(xmtpReducer(connected, { type: 'INIT_START' })).toBe(connected)
  })

  it('INIT_SUCCESS → CONNECTED, carrying the inboxId (or keeping the prior one)', () => {
    const s1 = xmtpReducer({ ...connected, status: XMTP_STATUS.INITIALIZING, inboxId: '' }, { type: 'INIT_SUCCESS', inboxId: 'me' })
    expect(s1).toMatchObject({ status: XMTP_STATUS.CONNECTED, inboxId: 'me' })
    const s2 = xmtpReducer({ ...connected, status: XMTP_STATUS.INITIALIZING, inboxId: 'kept' }, { type: 'INIT_SUCCESS' })
    expect(s2.inboxId).toBe('kept')
  })

  it('INIT_UNREACHABLE → UNREACHABLE', () => {
    expect(xmtpReducer(connected, { type: 'INIT_UNREACHABLE' }).status).toBe(XMTP_STATUS.UNREACHABLE)
  })

  it('INIT_ERROR → ERROR with the message, defaulting to "unknown error"', () => {
    expect(xmtpReducer(connected, { type: 'INIT_ERROR', error: 'boom' })).toMatchObject({ status: XMTP_STATUS.ERROR, error: 'boom' })
    expect(xmtpReducer(connected, { type: 'INIT_ERROR' }).error).toBe('unknown error')
  })

  it('MESSAGES_LOADED replaces (deduped); MESSAGE_RECEIVED appends new / ignores dupes', () => {
    const loaded = xmtpReducer(connected, { type: 'MESSAGES_LOADED', messages: [{ id: 'x' }, { id: 'x' }, { id: 'y' }] })
    expect(loaded.messages.map((m) => m.id)).toEqual(['x', 'y'])
    const appended = xmtpReducer(loaded, { type: 'MESSAGE_RECEIVED', message: { id: 'z' } })
    expect(appended.messages.map((m) => m.id)).toEqual(['x', 'y', 'z'])
    const dup = xmtpReducer(appended, { type: 'MESSAGE_RECEIVED', message: { id: 'z' } })
    expect(dup.messages.map((m) => m.id)).toEqual(['x', 'y', 'z'])
  })

  it('RESET → initial state for the current address; unknown/empty events are no-ops', () => {
    expect(xmtpReducer(connected, { type: 'RESET' })).toMatchObject({ status: XMTP_STATUS.READY, address: ADDR, messages: [] })
    expect(xmtpReducer(connected, { type: 'NOPE' })).toBe(connected)
    expect(xmtpReducer(connected, null)).toBe(connected)
  })
})
