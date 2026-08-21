# The build record

This directory is the actual engineering record of how [jw3b.dev](https://jw3b.dev) was
built — by a multi-agent pipeline in which each phase was executed by a role-scoped agent
(architect, security, compliance, performance, and so on) and every task was gated before the
next began.

It is kept public deliberately. Anyone assessing this work can check the reasoning, the
trade-offs, and the failures — not just the finished surface.

## Where to start

| File | What it is |
|---|---|
| [PLAN.md](PLAN.md) | The dependency-ordered task list, phase by phase, with the verification each task had to pass |
| [ROLE_LEDGER.md](ROLE_LEDGER.md) | Every task mapped to the role that executed it and the commit that delivered it |
| [REQUIREMENTS.md](REQUIREMENTS.md) | The scored requirements the build was held to |
| [audits/](audits/) | The phase gate reports — the honest ones |

## The gate reports

Each phase ended with an independent review across QA, security, code audit, compliance, and
performance. A phase could not close on a partial pass.

- [P1-GATE](audits/P1-GATE_0_SUMMARY.md) · [P2-GATE](audits/P2-GATE_0_SUMMARY.md) ·
  [P3-08 GA sweep](audits/P3-08_GA_SWEEP.md) · [P4-GATE](audits/P4-GATE.md)

The GA sweep is the one worth reading if you only read one: it caught a rate limiter that was
silently failing open in production — the reused database still had the previous schema, so
every rate-limit write threw and was swallowed by an availability-first fallback. It is
written up with the root cause and the fix rather than quietly patched.

## Supporting phases

`market_validation/`, `business_analysis/`, `project_management/`, and
`architecture_design/` hold the upstream phases — positioning, requirements, delivery plan,
and the solution design with its non-functional targets. `context/` and `facts/` hold the
grounding material every agent worked from.
