/*
 * jw3b.dev v2 — XMTP channel flow (P3-01 · FR-039)  ·  full-stack-integrator
 *
 * PURE state machine + degrade gate for the `/messages` E2E encrypted channel. No SDK, no
 * wallet, no I/O here — `useXMTP.js` owns the effects (lazy `@xmtp/browser-sdk` + wagmi) and
 * dispatches these events, so every transition, the reachability degrade, and the message-list
 * management are exhaustively unit-tested. The channel is a FLAGGED extra that NEVER gates
 * book-a-call/checkout (BR-11): whenever it can't run it degrades to the floor, honestly.
 *
 * FR-039: the "E2E encrypted channel" claim only renders alongside the working feature — so this
 * lives behind `xmtp` (OFF by default) AND a provisioned recipient; either missing ⇒ the floor.
 */

export const XMTP_ENV = 'production' // MLS network (the hook allows a VITE_XMTP_NETWORK override)

export const XMTP_STATUS = Object.freeze({
  IDLE: 'idle',
  NO_WALLET: 'no-wallet', // no wallet connected → prompt connect
  READY: 'ready', // wallet connected; channel not initialized yet
  INITIALIZING: 'initializing', // Client.create in flight (the wallet-signature step)
  CONNECTED: 'connected', // client + DM ready; history loaded; stream live
  UNREACHABLE: 'unreachable', // recipient (John) not reachable on XMTP → degrade to book-a-call
  ERROR: 'error', // any failure → honest message + book-a-call floor
})

export function initialXmtpState(address = '') {
  const has = isEthAddress(address)
  return {
    status: has ? XMTP_STATUS.READY : XMTP_STATUS.NO_WALLET,
    address: has ? address : '',
    inboxId: '',
    error: '',
    messages: [],
  }
}

/** 0x + 40 hex — a plain EOA address shape check (not a checksum verification). */
export function isEthAddress(value) {
  return typeof value === 'string' && /^0x[0-9a-fA-F]{40}$/.test(value)
}

/**
 * The degrade decision (the floor gate): can the live channel run at all? Returns
 * `{ ok, reason }` with reason ∈ `flag-off | no-recipient | no-wallet | ready`. The page renders
 * the RouteGate floor for anything but `ready` — a half-wired channel is worse than an honest floor.
 */
export function channelGate({ flagEnabled, recipient, walletAddress } = {}) {
  if (!flagEnabled) return { ok: false, reason: 'flag-off' }
  if (!isEthAddress(recipient)) return { ok: false, reason: 'no-recipient' }
  if (!isEthAddress(walletAddress)) return { ok: false, reason: 'no-wallet' }
  return { ok: true, reason: 'ready' }
}

/** Normalize a browser-sdk `DecodedMessage` to the flat shape the UI + reducer use. Pure. */
export function normalizeXmtpMessage(m) {
  const sentAtNs = m && m.sentAtNs != null ? String(m.sentAtNs) : ''
  const senderInboxId = (m && m.senderInboxId) || ''
  const id = m && m.id != null && m.id !== '' ? String(m.id) : `${sentAtNs}:${senderInboxId}`
  return {
    id,
    content: m && typeof m.content === 'string' ? m.content : '',
    senderInboxId,
    sentAtNs,
  }
}

/** De-dupe a message list by id, preserving first-seen order. Non-arrays → []. */
export function dedupeById(messages) {
  const seen = new Set()
  const out = []
  for (const m of Array.isArray(messages) ? messages : []) {
    const id = m && m.id != null ? String(m.id) : ''
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(m)
  }
  return out
}

/** Pure FSM. Unknown/empty events return the state unchanged (safe by construction). */
export function xmtpReducer(state, event) {
  switch (event && event.type) {
    case 'WALLET_CHANGED': {
      const address = isEthAddress(event.address) ? event.address : ''
      if (!address) return { status: XMTP_STATUS.NO_WALLET, address: '', inboxId: '', error: '', messages: [] }
      if (address === state.address && state.status !== XMTP_STATUS.NO_WALLET) return state
      // A new/first wallet resets the channel — any prior session belonged to the old inbox.
      return { status: XMTP_STATUS.READY, address, inboxId: '', error: '', messages: [] }
    }
    case 'INIT_START':
      // Only start from a settled state; ignore double-clicks while initializing/connected.
      if (state.status !== XMTP_STATUS.READY && state.status !== XMTP_STATUS.ERROR && state.status !== XMTP_STATUS.UNREACHABLE)
        return state
      return { ...state, status: XMTP_STATUS.INITIALIZING, error: '', messages: [] }
    case 'INIT_SUCCESS':
      return { ...state, status: XMTP_STATUS.CONNECTED, error: '', inboxId: event.inboxId || state.inboxId || '' }
    case 'INIT_UNREACHABLE':
      return { ...state, status: XMTP_STATUS.UNREACHABLE, error: '' }
    case 'INIT_ERROR':
      return { ...state, status: XMTP_STATUS.ERROR, error: String((event && event.error) || 'unknown error') }
    case 'MESSAGES_LOADED':
      return { ...state, messages: dedupeById(event.messages) }
    case 'MESSAGE_RECEIVED':
      return { ...state, messages: dedupeById([...state.messages, event.message]) }
    case 'RESET':
      return initialXmtpState(state.address)
    default:
      return state
  }
}
