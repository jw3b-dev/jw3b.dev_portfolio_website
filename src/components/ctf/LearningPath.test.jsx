import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import LearningPath, { HINTS } from './LearningPath.jsx'

describe('LearningPath — brief 06: a learning path, not only a competition', () => {
  it('starts with NO hints revealed — shown all at once they are a solution, in order a lesson', () => {
    render(<LearningPath />)
    expect(screen.queryByText(/Hint 1/)).toBeNull()
    expect(screen.getByRole('button', { name: /show the first hint/i })).toBeInTheDocument()
  })
  it('reveals hints strictly one at a time, in order', () => {
    render(<LearningPath />)
    for (let i = 1; i <= HINTS.length; i++) {
      fireEvent.click(screen.getByRole('button', { name: /show/i }))
      expect(screen.getByText(new RegExp(`Hint ${i} ·`))).toBeInTheDocument()
      if (i < HINTS.length) expect(screen.queryByText(new RegExp(`Hint ${i + 1} ·`))).toBeNull()
    }
    expect(screen.queryByRole('button', { name: /show/i })).toBeNull()
  })
  it('the last hint names the actual fix — checks, effects, interactions', () => {
    expect(HINTS[HINTS.length - 1].body).toMatch(/checks, effects, then interactions/i)
  })
  it('asks for no wallet', () => {
    render(<LearningPath />)
    expect(screen.getByText(/no wallet needed/i)).toBeInTheDocument()
  })
})
