# Web3 correctness review checklist (P2-03 · FR-027 · BR-04/06/09)

Every PR that adds or changes an on-chain surface (a `writeContract`, a wallet/chain UI, a
USDC amount, a CTF interaction) must pass this checklist. The pure logic behind it lives in
`src/lib/web3Guards.js` (unit-tested); this is the human gate on top.

## 1. Simulate-first (FR-027 / BR-04) — the hard rule

- [ ] **No `writeContract` fires without a preceding successful `useSimulateContract`.**
      The write args come from `simulateGate(simulation).request`, and the call is made only
      when `simulateGate(...).ready === true`.
- [ ] The simulate error is surfaced to the user via `revertReason(...)` — never a blank
      "transaction failed".
- [ ] Reads use `useReadContract` (never the legacy `useContractRead`).

Grep gate (should return nothing un-paired):

```bash
# every writeContract call site should sit next to a simulate + the gate
grep -rn "writeContract" src/ --include='*.jsx' --include='*.js' | grep -v '\.test\.'
grep -rn "useSimulateContract\|simulateGate" src/ --include='*.jsx' --include='*.js'
```

A `writeContract` with no `useSimulateContract` / `simulateGate` in the same component is a
**blocking finding**, not a style note.

## 2. USDC precision (BR-06 / DE-03)

- [ ] Human amounts convert through `toUsdcBaseUnits(string)` → BigInt (6-dec). **No
      `Number`, no `parseFloat`, no `* 1e6`** anywhere in a money path.
- [ ] Display uses `formatUsdc(bigint)`.
- [ ] The client never sends or invents a price — the price comes from `retainer.json`
      server-side truth (BR-12). Only the parsed amount crosses the wire.

```bash
# no float math on money — these should not appear near a USDC amount
grep -rnE "parseFloat|Number\(|\* *1e6|toFixed" src/ --include='*.jsx' --include='*.js' | grep -iE "usdc|amount|price"
```

## 3. Testnet honesty (BR-09 / FR-042 / FR-024)

- [ ] Every on-chain surface renders the honest label from `fundsPolicy(chainId)` —
      `MAINNET` (real funds) vs `TESTNET` (no real funds) vs `UNSUPPORTED`. Never hardcoded.
- [ ] The CTF surfaces state "Base Sepolia testnet · no real funds" (FR-024).
- [ ] Wrong-chain is a switch prompt, not a silent failure; a disconnected wallet is a
      connect prompt, not an error.

## 4. Degrade, don't dead-end (BR-03 / BR-11)

- [ ] If the flag is off or the contract address is absent, the surface degrades to the
      **book-a-call floor** — never a broken/disabled button (SC-1/SC-2).

## 5. Boundaries

- [ ] No private keys / seed phrases in client code — public `VITE_*` values only.
- [ ] Contracts are consumed via their exported ABI (`src/config/abis/`), not re-authored.
- [ ] Wallet stack stays pinned (wagmi 2 / viem 2 / RainbowKit 2 — never v3).
