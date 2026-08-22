# Brief 06 — Live On-Chain CTF, "Capture the Vault" (`/ctf`)

**Route:** `/ctf` · **Hats:** Auditor+Engineer · **Phase:** P2
Implements `design/design-story.md`. A **real** reentrancy challenge on Base Sepolia — deploy an
attacker, drain the vault, get verified on-chain, land on the leaderboard. The most literal
"proof-as-interface": the visitor performs a real exploit.

**Mood:** a live firing range, clearly marked as a range. Serious, hands-on, and scrupulously honest
that it's testnet — no real funds, no theater.

**Composition & Hierarchy:** a **procedure** down the center with the vault state readout beside it:
1. connect wallet + switch to **Base Sepolia** (wrong-chain guarded),
2. **deploy Attacker** (simulate → write),
3. **`attack{value}`** → the reentrant withdraw loop drains the vault,
4. Worker **verifies** the drain on-chain → leaderboard.
A live **vault-balance readout** (mono) shows the drain happen. A persistent **leaderboard** (ranked
solves, D1-persisted) sits alongside. The full CTF state machine is visible in the procedure (idle /
not-connected / wrong-chain / deploying / attacking / verifying / success / vault-empty / armed /
already-solved / error) — each state an honest readout, never a dead-end.

**Key Moment:** the **vault balance dropping to zero** as the reentrancy loop executes, then the
verdict resolving to `DRAIN CONFIRMED · rank #N` in cyan — a real exploit, really verified on chain,
in front of the visitor. This is the Auditor hat, operable.

**Palette Accents:** graphite; **amber TESTNET placard** pinned and unmissable on every CTF surface;
cyan for the live vault readout, the verify verdict, and the active step; the reserved failure color
for revert reasons / genuine errors; the drain itself reads in cyan (success) not red (it's the
*intended* exploit).

**Animation Strategy:** the vault-balance readout updates from **real chain reads** (not a scripted
animation); step advance ≤200ms; verify verdict resolves once then still. Recorded-solve fallback is
a labelled replay. No decorative explosion/particle FX on the drain — the number going to zero IS the
drama.

**Spatial Layout:** procedure column center (~520px), vault readout + leaderboard flanking on desktop;
stacked on mobile with the TESTNET placard staying pinned top.

**3D Elements:** none. **Glass Effects:** none.

**Typography:** step titles mono-numbered 15px w600; all balances/addresses/hashes mono tabular;
TESTNET placard 11px uppercase amber; leaderboard rows mono tabular.

**References:** aviation checklist cards (gated procedure); Etherscan readouts (chain state); a
CTF/wargame leaderboard for the ranked-solve grammar.

**Key Constraint:** **simulate before every on-chain write** (deploy + attack), surfacing revert
reasons (FR-027, BR-04); **label Base Sepolia / no real funds on every CTF surface** (FR-024, BR-09).
Chain/Worker down → **labelled recorded solve** (Tier-1/2), never a broken flow (FR-026, BR-03).

**HARD survival constraints:**
1. **No `writeContract` without a preceding successful `useSimulateContract`** (BR-04) — deploy and
   attack both gated.
2. **Testnet honesty is unmissable** — the "Base Sepolia · no real funds" placard is pinned on every
   state, never hidden or dimmed (FR-024, BR-09).
3. **No state dead-ends** — wrong-chain, vault-empty, already-solved, revert each render an honest
   readout with a next action (state machine per architecture §10/§11).
4. Degrades to a **labelled recorded solve** when chain/Worker is down (BR-03) — a live demo that
   falls over would prove the opposite of the thesis.
5. **No decorative FX** on the drain — the real balance hitting zero is the moment; no explosions,
   coins, or casino iconography.
6. Every leaderboard number is real (D1-persisted, chain-verified) — no seeded/fake ranks.

---

## Product owner

**The job the visitor finishes:** A visitor reads a challenge worth attempting, attempts it on testnet, and sees their solve verified on-chain and ranked.

**Next needs:**

- **The vault is v1-era.** Owner-gated on keystore + gas for a redeploy (finding 25). Until then the challenge is readable and not fully attemptable, and the copy must keep saying so.
- ~~A learning path, not only a competition.~~ **✎ DONE 2026-08-22** — three progressive hints, revealed one at a time, each pointing at a line of the vault above rather than explaining reentrancy in the abstract. Revealed in order on purpose: all three at once is a solution, in sequence it is a lesson. No wallet required, like the rest of the brief.
- ~~Show what a solve looks like.~~ **✎ DONE 2026-08-22** — the shipped `vault-drain.json` walkthrough now renders on the pre-wallet brief, labelled as a dated recording, with its fallback preamble deliberately dropped.
