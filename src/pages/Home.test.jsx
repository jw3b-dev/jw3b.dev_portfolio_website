import { render, screen } from '@testing-library/react'
import { HelmetProvider } from 'react-helmet-async'
import { MemoryRouter } from 'react-router-dom'
import Home from './Home'
import { getClaim } from '../lib/claimsRegister.js'

// Home now renders <Seo> (P1-15, useLocation) and router-linked chrome, so it needs the
// Router + Helmet context the app provides in production.
const renderHome = () =>
  render(
    <HelmetProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </HelmetProvider>,
  )

// Home renders the operable proof-first hero (P1-09). This smoke test asserts the
// three load-bearing pieces of the brief: the position-line heading (LCP element),
// the OPERABLE console (an editable Solidity input — the anti-"static résumé" proof),
// and a verified <Claim> in the rail. The Hero pulls no wagmi/RainbowKit, so it mounts
// cleanly in jsdom without the provider tree.
test('Home renders the operable hero: position line + editable auditor + a claim', () => {
  renderHome()

  // 1. position line is the H1 (LCP)
  expect(
    screen.getByRole('heading', { name: /multi-agent systems that survive production/i }),
  ).toBeInTheDocument()

  // 2. the console is operable before any scroll — an editable contract, pre-loaded
  const editor = screen.getByLabelText(/editable solidity contract/i)
  expect(editor).toBeInTheDocument()
  expect(editor.value).toMatch(/contract Vault/)

  // 3. a cleared claim renders from the register (CodeHawks valid submissions). Since P1-14 added
  // a dedicated CodeHawks card below the hero, this figure legitimately appears on more than one
  // section of Home — assert it renders at all, not that it's unique.
  //
  // ✎ Read the value FROM the register rather than typing it. This was hardcoded as "17 findings"
  // and broke when the wording was tightened to match CodeHawks' own label — a test that restates
  // a register value is a second copy of it, and the register is supposed to be the only one.
  const submissions = getClaim('codehawks-valid-submissions').value
  expect(screen.getAllByText(submissions, { exact: false }).length).toBeGreaterThan(0)
})
