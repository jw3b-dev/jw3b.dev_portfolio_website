# Documentation

Operational and compliance documentation for [jw3b.dev](https://jw3b.dev). These are the
working documents the site is actually run from — not brochureware.

| Document | What it covers |
|---|---|
| [RUNBOOK.md](RUNBOOK.md) | Deploying the site and the Worker, seeding recorded runs, recovering from a bad release |
| [OPS.md](OPS.md) | The scheduled health check, the D1 analytics digest queries, and rollback commands |
| [DEFERRED.md](DEFERRED.md) | What is deliberately not built yet, why, and exactly what unblocks each item |
| [COMPLIANCE.md](COMPLIANCE.md) | Privacy/AI-disclosure obligations and how each is enforced in code, plus the DSAR runbook |
| [COMPLIANCE_RESEARCH.md](COMPLIANCE_RESEARCH.md) | The sourced legal research behind those decisions (EU AI Act Art. 50, GDPR/POPIA, wallet-as-PII, VAT on crypto settlement) |
| [WEB3_REVIEW_CHECKLIST.md](WEB3_REVIEW_CHECKLIST.md) | The correctness checklist every on-chain code path is reviewed against |

The engineering record of *how* the site was built — plan, role ledger, and phase gate
audits — lives in [`../mas/`](../mas/).
