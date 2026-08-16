import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SpeakerToggle, MicButton } from '../VoiceControls.jsx'

describe('SpeakerToggle (P3-05 · FR-016)', () => {
  it('reflects voiceOn in aria and calls onToggle', () => {
    const onToggle = vi.fn()
    const { rerender } = render(<SpeakerToggle voiceOn={false} onToggle={onToggle} />)
    const btn = screen.getByRole('button', { name: 'Turn spoken replies on' })
    expect(btn.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(btn)
    expect(onToggle).toHaveBeenCalledTimes(1)
    rerender(<SpeakerToggle voiceOn onToggle={onToggle} />)
    expect(screen.getByRole('button', { name: 'Turn spoken replies off' }).getAttribute('aria-pressed')).toBe('true')
  })
})

describe('MicButton (P3-05 · FR-016)', () => {
  it('renders nothing when the browser cannot record (degrades to silence)', () => {
    const { container } = render(<MicButton canRecord={false} recording={false} onStart={() => {}} onStop={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('starts when idle, stops when recording, and reflects aria-pressed', () => {
    const onStart = vi.fn()
    const onStop = vi.fn()
    const { rerender } = render(<MicButton canRecord recording={false} disabled={false} onStart={onStart} onStop={onStop} />)
    fireEvent.click(screen.getByRole('button', { name: 'Record a voice message' }))
    expect(onStart).toHaveBeenCalledTimes(1)
    rerender(<MicButton canRecord recording disabled={false} onStart={onStart} onStop={onStop} />)
    const stop = screen.getByRole('button', { name: 'Stop recording' })
    expect(stop.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(stop)
    expect(onStop).toHaveBeenCalledTimes(1)
  })

  it('is disabled while the agent is streaming', () => {
    render(<MicButton canRecord recording={false} disabled onStart={() => {}} onStop={() => {}} />)
    expect(screen.getByRole('button', { name: 'Record a voice message' }).disabled).toBe(true)
  })
})
