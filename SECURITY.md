# Security Policy

This repository belongs to a working smart-contract security auditor, so reports are read
carefully and answered like a real disclosure — not filed away.

## Reporting a vulnerability

Email **john@agilegypsy.com** with `SECURITY` in the subject. Please include:

- what the issue is, and the impact you believe it has
- the steps or request/response pair needed to reproduce it
- the affected URL, endpoint, contract address, or file

Encrypted or wallet-signed reports are welcome. Please **don't** open a public GitHub issue for
an undisclosed vulnerability.

**What to expect:** acknowledgement within 3 working days, an assessment with a severity call
within 10, and credit in the fix commit unless you'd rather stay anonymous. If a report turns
out to be a duplicate or out of scope, you'll be told why rather than ignored.

## Scope

**In scope**

- The live site `jw3b.dev` and its Cloudflare Workers (`jw3b-dev-site`, `portfolio-agent`)
- Application code in `src/`, `workers/`, and `worker.js`
- `contracts/src/MilestoneEscrow.sol` — the escrow is meant to be sound
- Anything that leaks a secret, bypasses the per-IP rate limits, defeats CORS or the CSP, or
  gets the AI to emit an unsourced factual claim about John's record

**Out of scope**

- **`contracts/src/ReentrantVault.sol` is intentionally vulnerable.** It is the Capture-the-Vault
  challenge — draining it is the *point*, and it holds only Base Sepolia testnet ETH. The
  matching `Attacker.sol` is the intended solution.
- Findings that only apply on testnet where the surface is labelled as such
- Missing hardening headers on third-party domains not controlled here
- Automated-scanner output with no demonstrated impact
- Social engineering, physical access, or denial of service via traffic volume

## Testing courtesy

Please test against your own wallets and testnet funds, keep request rates reasonable (the API
rate-limits per IP by design — probing that boundary is fine, sustained flooding is not), and
avoid anything that would degrade the service for other visitors. Never access, modify, or
exfiltrate data that isn't yours.

Good-faith research that follows this policy is welcome, and no legal action will be pursued
over it.

## What's already deliberate

Before reporting, note these are known and intentional:

- The CTF vault is exploitable (above).
- The AI concierge is labelled as AI-generated on every surface and is grounded to a
  claims register; it can still be wrong about non-factual questions.
- `.env.production` is committed on purpose — it holds only public client values (a
  WalletConnect project id and feature flags). All real secrets live in Worker secret storage.
  If you find an actual server secret in the repo or the client bundle, that's a valid report —
  CI runs a secret scan on every build precisely to prevent it.
