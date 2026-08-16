import { describe, it, expect, vi } from 'vitest'
import { handleFuzz } from '../../../workers/portfolio-agent/src/routes/fuzz.js'

async function readSse(res) {
  const text = await new Response(res.body).text()
  return text
}

describe('handleFuzz — deterministic harness first, graceful fallback', () => {
  it('emits the harness even with no AI/KV (offline-safe), then a graceful note', async () => {
    const res = handleFuzz({}, {}, {}, { source: 'contract Vault { function withdraw(uint256 a) external {} }' })
    const body = await readSse(res)
    expect(body).toContain('VaultFuzzTest')
    expect(body).toContain('testFuzz_withdraw')
    expect(body).toMatch(/briefly unavailable|Suggested edge cases/i)
    expect(res.headers.get('X-Console')).toBe('fuzz')
  })

  it('streams Llama tips when available', async () => {
    const enc = new TextEncoder()
    const AI = {
      run: vi.fn(() =>
        Promise.resolve(
          new ReadableStream({
            start(c) {
              c.enqueue(enc.encode('data: {"response":"try boundary values"}\n'))
              c.close()
            },
          }),
        ),
      ),
    }
    const res = handleFuzz({}, { AI }, {}, { source: 'contract V { function f(uint256 x) external {} }' })
    const body = await readSse(res)
    expect(body).toContain('Suggested edge cases')
  })
})
