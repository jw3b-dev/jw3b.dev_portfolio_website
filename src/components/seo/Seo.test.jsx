import { describe, it, expect } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import Seo from './Seo.jsx'
import { SITE } from '../../constants/index.js'

const renderSeo = (props, path = '/') =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Seo {...props} />
      </MemoryRouter>
    </HelmetProvider>,
  )

const meta = (sel) => document.head.querySelector(sel)?.getAttribute('content')

describe('Seo — branded per-route head (FR-053 / NFR-06)', () => {
  it('uses the full brand title on the home route (branded-search targeting)', async () => {
    renderSeo({}, '/')
    await waitFor(() => expect(document.title).toBe(SITE.brandTitle))
    expect(SITE.brandTitle).toMatch(/John Wellard/)
    expect(SITE.brandTitle).toMatch(/AgileGypsy/)
  })

  it('composes inner-route titles as "<page> — JW3B"', async () => {
    renderSeo({ title: 'AI Security Console' }, '/audit')
    await waitFor(() => expect(document.title).toBe('AI Security Console — JW3B'))
  })

  it('derives an absolute canonical + og:url from the live route', async () => {
    renderSeo({ title: 'Hire' }, '/hire-me')
    await waitFor(() => expect(meta('meta[property="og:url"]')).toBe(`${SITE.domain}/hire-me`))
    expect(document.head.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(
      `${SITE.domain}/hire-me`,
    )
  })

  it('emits a complete OpenGraph block and author', async () => {
    renderSeo({ title: 'X', description: 'A description.' }, '/x')
    await waitFor(() => expect(meta('meta[property="og:title"]')).toBe('X — JW3B'))
    expect(meta('meta[property="og:description"]')).toBe('A description.')
    expect(meta('meta[property="og:type"]')).toBe('website')
    expect(meta('meta[property="og:site_name"]')).toBe(SITE.name)
    expect(meta('meta[name="author"]')).toBe(SITE.author)
  })

  it('stays a valid text unfurl when no OG image is provisioned (summary card, no og:image)', async () => {
    renderSeo({ title: 'X' }, '/x')
    await waitFor(() => expect(meta('meta[name="twitter:card"]')).toBe('summary'))
    expect(document.head.querySelector('meta[property="og:image"]')).toBeNull()
  })

  it('emits a large-image card once an image is supplied', async () => {
    renderSeo({ title: 'X', image: 'https://jw3b.dev/og.png' }, '/x')
    await waitFor(() => expect(meta('meta[property="og:image"]')).toBe('https://jw3b.dev/og.png'))
    expect(meta('meta[name="twitter:card"]')).toBe('summary_large_image')
  })
})
