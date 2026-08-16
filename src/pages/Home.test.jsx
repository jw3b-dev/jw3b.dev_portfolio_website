import { render, screen } from '@testing-library/react'
import Home from './Home'

// Scaffold smoke test (P0-01) — proves the Vitest + Testing Library + jsdom
// toolchain renders a route placeholder. The full provider-tree mount is verified
// via the dev server + production build; wagmi/RainbowKit need mocks in jsdom, so
// they are deliberately out of this trivial test.
test('Home route placeholder renders', () => {
  render(<Home />)
  expect(screen.getByRole('heading', { name: /home/i })).toBeInTheDocument()
})
