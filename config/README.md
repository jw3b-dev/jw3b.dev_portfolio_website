# Build configuration

The build tooling lives here rather than in the repository root, so the root shows what the
project *is* (README, licence, security policy, the app entry, the deploy config) instead of
what builds it.

| File | Role |
|---|---|
| `vite.config.js` | Production build: hero-shell prerender, vendor chunk splitting, preload trimming |
| `vitest.config.js` | Unit/component tests and the scoped coverage thresholds |
| `eslint.config.js` | Lint rules for the app, the Workers, and this config directory |
| `tailwind.config.js` | Reads the design tokens defined in `src/styles/tokens.css` |
| `postcss.config.js` | Tailwind + autoprefixer pipeline |

Every one of these is invoked through an npm script with an explicit `--config` flag, so the
usual commands work unchanged from the project root:

```bash
npm run dev      npm test      npm run build      npm run lint
```

Three path details matter if you edit these files: Vite is told where to find the PostCSS
config (it would otherwise search from the project root), PostCSS is told where
`tailwind.config.js` moved to (otherwise Tailwind silently emits unstyled CSS), and Vitest
pins `root` to the project root so its include globs and coverage list resolve as before.
Relocating the configs was verified by rebuilding and diffing the output — 151 files,
byte-identical.
