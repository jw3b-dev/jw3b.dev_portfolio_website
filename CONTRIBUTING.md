# Contributing

This is one person's portfolio, so it isn't looking for feature contributions the way a
library would. That said, a few kinds of input are genuinely welcome:

- **Security reports** — see [SECURITY.md](SECURITY.md). These get read properly.
- **Bug reports** — something broken, mislabelled, or inaccessible on
  [jw3b.dev](https://jw3b.dev). Please include the browser, the URL, and what you expected.
- **Factual corrections** — if a claim on the site looks wrong or unsupported, say so. Every
  presented number is supposed to trace to an evidence pointer; a claim that doesn't is a bug
  by this project's own rules.

## If you do open a pull request

Keep it small and explain the reasoning. The full gate must be green:

```bash
npm run lint && npm test && npm run build && npm run claims-gate && npm run secret-scan
```

A few house rules that the gate enforces:

- **No raw hex colours** — styling uses semantic design tokens only.
- **No unsourced claims** — any number or credential rendered on a page must route through the
  claims register with a real evidence pointer.
- **No secrets in the client** — everything sensitive lives in Worker secret storage.
- **Simulate before writing on-chain** — every `writeContract` path is preceded by a simulation.
- **Every surface degrades** — a new live feature needs an honest fallback for when its
  backend, wallet, or chain is unavailable.

The conventions behind those rules are documented in [`docs/`](docs/), and the build's own
engineering record lives in [`mas/`](mas/).
