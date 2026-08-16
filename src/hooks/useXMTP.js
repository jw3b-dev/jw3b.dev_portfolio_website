/*
 * jw3b.dev v2 — useXMTP (P3-01 · FR-039)  ·  full-stack-integrator
 * The effect side of the /messages E2E channel: wagmi (wallet + signature) + a LAZY
 * `@xmtp/browser-sdk` import (WASM stays off the boot path and out of jsdom/SSR), driving the
 * pure FSM in `../lib/xmtpFlow.js`. Every failure degrades honestly to an FSM state the UI
 * renders as the book-a-call floor — the channel never throws and never gates anything.
 * Entirely client-side; John's inbox is the recipient (config/worker.js), never a secret.
 */
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { XMTP_RECIPIENT } from '../config/worker.js'
import { isEnabled } from '../config/features.js'
import { xmtpReducer, initialXmtpState, channelGate, normalizeXmtpMessage, XMTP_ENV } from '../lib/xmtpFlow.js'

const NETWORK = import.meta.env?.VITE_XMTP_NETWORK || XMTP_ENV

/** Hex signature (0x…) → Uint8Array, as browser-sdk's Signer.signMessage must return bytes. */
function hexToBytes(hex) {
  const clean = String(hex || '').replace(/^0x/, '')
  const out = new Uint8Array(Math.floor(clean.length / 2))
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export function useXMTP() {
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const [state, dispatch] = useReducer(xmtpReducer, undefined, () => initialXmtpState(address || ''))
  const dmRef = useRef(null)
  const streamRef = useRef(null)
  const mountedRef = useRef(true)

  const stopStream = () => {
    const s = streamRef.current
    streamRef.current = null
    try {
      if (s && typeof s.return === 'function') s.return()
      else if (s && typeof s.end === 'function') s.end()
    } catch {
      /* stream already closed */
    }
  }

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      stopStream()
    }
  }, [])

  // Reflect wallet connect/disconnect/switch into the FSM.
  useEffect(() => {
    dispatch({ type: 'WALLET_CHANGED', address: address || '' })
  }, [address])

  const connect = useCallback(async () => {
    const gate = channelGate({ flagEnabled: isEnabled('xmtp'), recipient: XMTP_RECIPIENT, walletAddress: address || '' })
    if (!gate.ok) return
    dispatch({ type: 'INIT_START' })
    try {
      const { Client, IdentifierKind } = await import('@xmtp/browser-sdk')
      const signer = {
        type: 'EOA',
        getIdentifier: () => ({ identifier: address.toLowerCase(), identifierKind: IdentifierKind.Ethereum }),
        signMessage: async (message) => hexToBytes(await signMessageAsync({ message })),
      }
      const client = await Client.create(signer, { env: NETWORK })
      if (!mountedRef.current) return

      // Is John's inbox reachable on XMTP? If not, degrade rather than open a dead DM.
      const identifier = { identifier: XMTP_RECIPIENT.toLowerCase(), identifierKind: IdentifierKind.Ethereum }
      const reach = await client.canMessage([identifier])
      const reachable = reach instanceof Map ? [...reach.values()].some(Boolean) : Object.values(reach || {}).some(Boolean)
      if (!mountedRef.current) return
      if (!reachable) {
        dispatch({ type: 'INIT_UNREACHABLE' })
        return
      }

      const dm = await client.conversations.findOrCreateDmWithIdentity(XMTP_RECIPIENT)
      dmRef.current = dm

      const history = await dm.messages()
      if (!mountedRef.current) return
      dispatch({ type: 'MESSAGES_LOADED', messages: (history || []).map(normalizeXmtpMessage) })
      dispatch({ type: 'INIT_SUCCESS', inboxId: client.inboxId })

      // Live stream for this DM (echoes our own sends too — dedupe-by-id keeps it clean).
      const stream = await dm.stream()
      streamRef.current = stream
      ;(async () => {
        try {
          for await (const msg of stream) {
            if (!mountedRef.current) break
            if (msg) dispatch({ type: 'MESSAGE_RECEIVED', message: normalizeXmtpMessage(msg) })
          }
        } catch {
          /* stream ended / cancelled */
        }
      })()
    } catch (err) {
      if (mountedRef.current) dispatch({ type: 'INIT_ERROR', error: err?.message || 'Could not open the channel' })
    }
  }, [address, signMessageAsync])

  const send = useCallback(async (text) => {
    const body = String(text || '').trim()
    if (!body || !dmRef.current) return false
    try {
      await dmRef.current.send(body)
      return true
    } catch {
      return false
    }
  }, [])

  return { ...state, recipient: XMTP_RECIPIENT, connect, send }
}
