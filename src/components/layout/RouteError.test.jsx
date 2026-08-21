/*
 * The developer error screen must never reach a visitor (owner-reported on /work, /audit,
 * /messages). A stale-chunk failure is self-healing and must say so; anything else still
 * keeps the guaranteed routes one click away (SC-1: no dead ends).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

let thrown
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useRouteError: () => thrown }
})

const { default: RouteError, isStaleChunkError } = await import('./RouteError.jsx')

const show = () => render(<MemoryRouter><RouteError /></MemoryRouter>)

describe('isStaleChunkError', () => {
  it('recognises the failed-dynamic-import forms browsers actually emit', () => {
    expect(isStaleChunkError(new TypeError('Failed to fetch dynamically imported module: /assets/Work-x.js'))).toBe(true)
    expect(isStaleChunkError(new Error('Importing a module script failed.'))).toBe(true) // Safari
    expect(isStaleChunkError(new Error('error loading dynamically imported module'))).toBe(true)
  })
  it('does not misclassify unrelated errors, null or undefined', () => {
    expect(isStaleChunkError(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(isStaleChunkError(null)).toBe(false)
    expect(isStaleChunkError(undefined)).toBe(false)
  })
})

describe('RouteError', () => {
  it('frames a stale chunk as a new version, not a fault, and offers a reload', () => {
    thrown = new TypeError('Failed to fetch dynamically imported module: /assets/Audit-x.js')
    show()
    expect(screen.getByText(/new version available/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/updated while you had it open/i)
    expect(screen.getByRole('button', { name: /reload the page/i })).toBeInTheDocument()
  })

  it('shows an honest error for anything else', () => {
    thrown = new Error('boom')
    show()
    expect(screen.getByText(/something broke/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/failed to load/i)
  })

  it('never dead-ends: home and the hire floor stay reachable, and it is announced', () => {
    thrown = new Error('boom')
    show()
    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to the console/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /hire john/i })).toHaveAttribute('href', '/hire-me')
  })
})
