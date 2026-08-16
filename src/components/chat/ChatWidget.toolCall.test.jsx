import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const navigate = vi.fn()
vi.mock('react-router-dom', async (orig) => ({ ...(await orig()), useNavigate: () => navigate }))
let hook
vi.mock('../../hooks/usePortfolioAgent.js', () => ({ usePortfolioAgent: () => hook }))
const { default: ChatWidget } = await import('./ChatWidget.jsx')

describe('ChatWidget — hire-routing tool-call dispatch (FR-019)', () => {
  it('a valid tool-call navigates to Mission Control and clears itself', () => {
    const clearToolCall = vi.fn()
    hook = { messages: [], streaming: false, send: vi.fn(), toolCall: { action: 'openModal', type: 'pricing' }, clearToolCall }
    render(<MemoryRouter><ChatWidget /></MemoryRouter>)
    expect(navigate).toHaveBeenCalledWith('/hire-me#pricing')
    expect(clearToolCall).toHaveBeenCalled()
  })

  it('an unknown tool-call is ignored (no navigation)', () => {
    navigate.mockClear()
    hook = { messages: [], streaming: false, send: vi.fn(), toolCall: { action: 'evil' }, clearToolCall: vi.fn() }
    render(<MemoryRouter><ChatWidget /></MemoryRouter>)
    expect(navigate).not.toHaveBeenCalled()
  })
})
