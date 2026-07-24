---
name: frontend-engineer
description: jw3b.dev's marketing UI and component library — the landing sections (Hero, About, Services, Projects, Technologies, Contact), the Navbar, and shared primitives. Use whenever work touches src/components/*, src/constants/*, or the cyber/neon styling. React 19 + Vite + Tailwind 3 + Framer Motion. To SEE a change, run `npm run dev`.
---

You build jw3b.dev's marketing surface. The tokens and data live in the repo; this skill is the
handful of things that trip people up here — a stale mental model, a rule whose violation isn't
obvious, and the traps specific to this stack.

## The facts that catch people

- **This is Vite + React 19, NOT Next.js.** `.jsx`/`.js`, no server components, no `app/` router.
  Routing is React Router 7, lazy-loaded in `App.jsx` behind `<Suspense>`. There is no SSR — don't
  reach for `next/*`, `use client`, or file-based routes. Persona/section content is plain modules
  under `src/constants/`.
- **The brand is CYAN + PURPLE neon**, on near-black glass. `#06b6d4`/`#00f3ff` cyan, `#a855f7`
  purple. Never inline a raw hex — pull from `src/constants/colors.js` (`COLORS[color]`). See
  [brand-architect] for the token policy.
- **Content is data, not JSX.** Copy, personas, services, projects live in `src/constants/index.js`
  (`HATS`, `ROLE_PROFILES`, `SERVICES`, `PROJECTS`). Change the data there; keep components
  presentational. Adding a hat tag or a service means editing the constant, not hardcoding a card.
- **The four hats must all stay visible.** Engineer/Auditor/PM/Founder each own a color
  (cyan/purple/green/orange). Any identity section shows all four at once — no one-at-a-time tab
  selector that hides three of them. Filter/badge by `hats: [...]` on `SERVICES`/`PROJECTS`.

## The stack's real traps

- **Framer Motion `AnimatePresence` + `key`.** Re-mounting on a changing `key` is how the old About
  cross-faded personas. Fine for genuine swaps; don't wrap a static list in it or you get layout
  thrash. For scroll reveals use `whileInView` + `viewport={{ once: true }}` so they fire once.
- **Web3 polyfills are load-bearing.** `main.jsx` imports `buffer`; `vite.config.js` defines
  `global`/`process.env`. Wallet UI (wagmi/RainbowKit) depends on it — don't touch the polyfill
  setup while doing UI work, and don't upgrade wagmi/viem/RainbowKit majors (see CLAUDE.md).
- **Coverage gate is scoped + strict.** `vitest.config.js` has a short include-list at 100%
  lines/functions. Adding a newly-covered file can break the gate; check before assuming green.
- **Tailwind only** (flat `eslint.config.js`). Match existing utility patterns — `glass-panel`,
  `backdrop-blur-xl`, `border-white/10`, `font-mono` labels — rather than adding CSS files.

## Workflow

Edit data in `src/constants/`, keep components dumb, reuse `COLORS`/`HATS`, then `npm run dev` to
see it and `npm run lint && npm run build` before calling it done. Brief from [art-director], tokens
from [brand-architect].
