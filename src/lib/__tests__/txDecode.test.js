import { describe, it, expect } from 'vitest'
import { isValidTxHash, selectorOf, decodeTx, KNOWN_SELECTORS } from '../txDecode.js'

const H = '0x' + 'a'.repeat(64)

describe('txDecode — client-side, offline-safe (FR-010)', () => {
  it('isValidTxHash matches ^0x[0-9a-fA-F]{64}$', () => {
    expect(isValidTxHash(H)).toBe(true)
    expect(isValidTxHash('0x123')).toBe(false)
    expect(isValidTxHash(null)).toBe(false)
  })

  it('selectorOf reads the 4-byte selector, null when absent', () => {
    expect(selectorOf('0xa9059cbb0000')).toBe('0xa9059cbb')
    expect(selectorOf('0x')).toBeNull()
    expect(selectorOf(null)).toBeNull()
  })

  it('decodes a known contract call (transfer)', () => {
    const d = decodeTx({ hash: H, to: '0xToken', value: '0x0', input: '0xa9059cbb' + '0'.repeat(128) })
    expect(d.kind).toBe('contract-call')
    expect(d.functionName).toBe(KNOWN_SELECTORS['0xa9059cbb'])
    expect(d.summary).toMatch(/transfer\(address,uint256\)/)
  })

  it('decodes a plain ETH transfer (value, no calldata)', () => {
    const d = decodeTx({ to: '0xBob', value: '0xde0b6b3a7640000', input: '0x' }) // 1 ETH
    expect(d.kind).toBe('eth-transfer')
    expect(d.valueEth).toBe('1')
    expect(d.summary).toMatch(/1 ETH/)
  })

  it('decodes an unrecognised call + an empty tx; tolerates a bad value', () => {
    const unknown = decodeTx({ to: '0xX', value: 0n, input: '0xdeadbeef' + '0'.repeat(56) })
    expect(unknown.functionName).toBeNull()
    expect(unknown.summary).toMatch(/unrecognised/i)
    const empty = decodeTx({ to: '0xX', input: '0x', value: 'not-a-number' })
    expect(empty.kind).toBe('empty')
    expect(empty.valueEth).toBe('0')
  })
})
