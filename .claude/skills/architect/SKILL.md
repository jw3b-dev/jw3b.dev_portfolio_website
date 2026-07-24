---
name: architect
description: Design and sequencing for jw3b.dev — turning a change that spans more than one subsystem (React frontend + portfolio-agent Worker + on-chain contracts) into an executable plan, in the right order. Use BEFORE writing code for anything touching multiple subsystems, the AI tag-protocol contract, the provider tree, or a deploy that changes a binding. Returns a decision and an order, not a survey.
---

You turn a multi-subsystem change into a plan that won't ship broken. A capable engineer already weighs
trade-offs — so this skill is the specific jw3b.dev landmines, not a lecture on planning.

## The three subsystems and the seams between them

jw3b.dev is a React 19 + Vite frontend, a `portfolio-agent` Cloudflare Worker, and on-chain contracts
(Foundry, Base Sepolia demos). Its real risk is not bugs inside one of these — it's the **seams**,
where two individually-correct parts are wired together wrongly and nobody executes the join.

- **The AI tag protocol is the canonical seam.** Worker responses embed `[AUDIO: "…"]`,
  `[TOOL_CALL: {…}]`, `[RENDER_CARD: "…"]`. Three files must agree on that grammar: `knowledge.js`
  (emits), `usePortfolioAgent.js` (parses + strips), `ChatWidget.jsx` (renders). Change the tag shape
  in one and the other two silently break — the chat still "works", it just leaks raw tags or drops
  cards. Any plan touching the protocol names all three files and a round-trip test ([test-engineer]).
- **Config is centralized on purpose.** Worker URL + XMTP recipient live in `src/config/worker.js`
  (env-overridable); contract addresses in `src/config/contracts.js`. A plan that re-hardcodes these
  in a component is reintroducing a seam. When a real contract address lands, the plan replaces the
  `0x…` placeholder in `contracts.js` **and** `src/data/retainer.json` — both, or they drift.

## Ordering is the deliverable

- **Provider order in `App.jsx` is load-bearing:** Wagmi → React Query → RainbowKit → Helmet → Router.
  Wallet hooks fail outside the Wagmi/RainbowKit boundary; a plan that moves a wallet-touching
  component above its provider breaks at runtime, not at build. Routes are lazy behind `<Suspense>` —
  state a new route's suspense/fallback, don't assume it.
- **Simulate → Write → Wait** for any on-chain write, and the simulate is a *precondition*, not a
  nicety ([web3-blockchain]).
- **Branch/deploy coupling:** a push to `main` or `v2-upgrade` deploys the Worker via CI. A plan that
  changes the Worker and "just merges" is a deploy — sequence the secret/binding steps first
  ([devops-engineer]).

## The dependency floors that reshape plans

Two upgrades look routine and are traps (CLAUDE.md): **wagmi 3** (no RainbowKit support; breaks the
wallet UI and the `buffer` polyfill) and **`@xmtp/xmtp-js` majors** (13.x deprecated; the real path is
a `@xmtp/browser-sdk` migration, a project not a bump). Treat either as a migration with its own plan,
never a line-item in an unrelated change.

## How to deliver

Lead with the decision. Then the ordered steps, each with what breaks if it runs out of order and how
it's verified. Then the seams, each with who executes the join. Then the one open question, if any.
Believe the code over the docs — `DEFERRED.md` / PROVISIONING describe intent, not always what runs.
