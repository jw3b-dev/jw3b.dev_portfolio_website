/*
 * RecordedSolve — brief 06, next-need 1.
 *
 * The risk this component carries is not that it fails to render; it is that a walkthrough of a
 * successful drain gets mistaken for a live result or for the visitor's own solve. So the tests
 * are weighted toward the LABELLING (BR-03/BR-09), and toward the content coming from the shipped
 * artifact rather than being retyped into the component.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecordedSolve from './RecordedSolve.jsx'
import artifact from '../../data/recorded-runs/ctf/vault-drain.json'

// Mirrors the component: frame 0 is the fallback preamble and is deliberately not rendered here.
const norm = (x) => x.replace(/\s+/g, ' ').trim()
const FRAMES = artifact.frames.slice(1).map((f) => norm(f.response)).filter(Boolean)

describe('RecordedSolve — honesty first', () => {
  it('says RECORDED, on the heading line, before any step is visible', () => {
    render(<RecordedSolve />)
    expect(screen.getByText(new RegExp(`Recorded · ${artifact.capturedAt}`))).toBeInTheDocument()
  })

  it('is dated from the artifact, not from today', () => {
    render(<RecordedSolve />)
    expect(screen.getByText(new RegExp(artifact.capturedAt))).toBeInTheDocument()
  })

  it('states it is testnet and NOT the visitor’s solve', () => {
    render(<RecordedSolve />)
    const blurb = screen.getByText(/previously-captured drain/i)
    expect(blurb).toHaveTextContent(/Base Sepolia/i)
    expect(blurb).toHaveTextContent(/not a live result/i)
    expect(blurb).toHaveTextContent(/not your solve/i)
  })
})

describe('RecordedSolve — the walkthrough', () => {
  it('is collapsed by default — it informs, it does not shout over the challenge', () => {
    render(<RecordedSolve />)
    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByRole('button', { name: /show the walkthrough/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens to every frame from the shipped artifact, in order', () => {
    render(<RecordedSolve />)
    fireEvent.click(screen.getByRole('button', { name: /show the walkthrough/i }))
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(FRAMES.length)
    items.forEach((li, i) => expect(norm(li.textContent)).toContain(FRAMES[i].slice(0, 40)))
  })

  it('toggles closed again', () => {
    render(<RecordedSolve />)
    const btn = screen.getByRole('button', { name: /show the walkthrough/i })
    fireEvent.click(btn)
    fireEvent.click(screen.getByRole('button', { name: /hide the walkthrough/i }))
    expect(screen.queryByRole('list')).toBeNull()
  })

  it('writes no step of its own — every line traces to the artifact', () => {
    render(<RecordedSolve />)
    fireEvent.click(screen.getByRole('button', { name: /show the walkthrough/i }))
    for (const li of screen.getAllByRole('listitem')) {
      // The index badge fuses with the frame's own "1)" in textContent, so match by containment
      // rather than trying to strip a leading digit that belongs to two different things.
      const body = norm(li.textContent)
      expect(FRAMES.some((f) => body.includes(f.slice(0, 30))), `untraceable step: ${body.slice(0, 40)}`).toBe(true)
    }
  })
})
