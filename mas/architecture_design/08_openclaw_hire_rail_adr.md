# ADR-R2-02 — The OpenClaw Telegram hire rail

**Status:** PROPOSED — **owner-gated, not built.** · solutions-architect, 2026-08-22
**Serves:** FR-062's second half — *"the visitor can open a live conversation with John's agent"*.
**Depends on:** ADR-R2-01 (the alert path, shipped) and three owner decisions in §6.

> The owner's request: *"the hire me should link to my telegram openclaw bot that interacts live
> with the client and can set appointments and perform other tasks."* This ADR scopes that, and its
> central conclusion is a **refusal**: the visitor must never reach the owner's existing agent.

---

## 1. NFRs

| # | Constraint | Why |
|---|---|---|
| **N1** | A stranger's message must never reach a shell- or filesystem-capable agent | the owner's `main` agent has real tool access; the internet does not get a prompt into it |
| **N2** | Lead latency ≤ 60s end-to-end | same target as FR-062; the rail must not be slower than the alert it sits beside |
| **N3** | The rail must fail closed | no 24/7 host ⇒ the CTA is absent, not broken; degrade to the (now working) capture path |
| **N4** | Per-peer session isolation | one visitor's context must not leak into another's |
| **N5** | No secret in the client | the deep link carries context, never a token |
| **N6** | Prompt injection is the default assumption, not an edge case | every inbound message is hostile input |

**The decisive one is N1.** Verified locally: OpenClaw is installed, the Telegram channel is
enabled, the agent is `main`, the gateway is on loopback `:18789`, and it is **not currently
running**. `main` is the owner's working agent. Exposing it to strangers is the whole risk, and no
amount of prompt hardening makes a shell-capable agent safe to hand to the public.

## 2. Decision — a dedicated, tool-starved "reception" agent

| Option | Pros | Cons | N1 |
|---|---|---|---|
| **A — deep-link to the existing `main` agent** | zero build | a stranger's text reaches an agent with shell + filesystem; prompt injection becomes RCE-adjacent | ❌ **violates N1 outright** |
| **B — a dedicated reception agent** ✅ | strangers reach a surface with no dangerous verbs; blast radius is a bad reply | a second agent to define, host and maintain | ✅ |
| **C — no live agent; capture only** | already shipped and working | does not answer the owner's request; leaves the "talk to John" promise unmade | ✅ (vacuously) |

**Selected: B, because N1 cannot be satisfied by A at any level of prompt engineering, and C
declines the requirement rather than meeting it.** C remains the **fallback** whenever B is not
running (N3), which is what makes B safe to ship incrementally.

### The reception agent's boundary

- **Tools allowed:** availability lookup, appointment creation, lead-note capture, hand-off/escalate
  to John. Nothing else.
- **Tools forbidden:** shell, filesystem, network fetch, code execution, any repo access. Not
  "discouraged" — absent from its toolset, so a successful injection has nothing to call.
- **Session:** per-peer, with a turn cap and no cross-peer memory (N4).
- **Data:** it may write a lead note; it may not read the leads table.
- **Escalation:** it can flag John. It cannot act as John.

## 3. The deep link

`t.me/<bot>?start=<payload>` where the payload carries the configurator's tier/objective so the
conversation starts informed. The payload is **context, never credentials** (N5), and is treated as
untrusted on arrival — a visitor can hand-edit it, so the agent must validate rather than trust it.

## 4. Degradation (N3)

The rail ships behind a flag that is **off unless an always-on host exists**. Off means the CTA does
not render; the visitor sees the capture path that W1 made real. There is no disabled button and no
"coming soon" — a dead affordance is the shape this whole rerun exists to remove.

## 5. Red-team

1. **10× load?** Telegram queues; the reception agent is stateless per turn; the floor is unaffected.
2. **SPOF?** The 24/7 host. Its absence is the *designed* state (N3), not an outage.
3. **Weakest control?** Prompt injection against the reception agent. Mitigated structurally by the
   empty toolset (§2), not by instructions — an agent that cannot call a dangerous verb cannot be
   talked into calling one.
4. **Vendor down 4h?** Rail dark; capture path serves; alerts still fire via ADR-R2-01.
5. **Partially addressed compliance?** Same class as ADR-R2-01 §4 — a conversation with a visitor is
   personal data processed by Telegram *and* by whatever model backs the reception agent. **The
   privacy notice must name that model provider before this rail goes live.** Listed as a build
   precondition, not a follow-up.

## 6. Owner decisions — required before any of this is built

1. **A 24/7 host** for the gateway. It runs on the owner's laptop today, and that laptop is the same
   thermally-constrained machine documented in the KTHULHU audit. Until there is an always-on host,
   N3 keeps the rail dark.
2. **Approve the reception agent and its toolset** as scoped in §2 — specifically that it is a
   *separate* agent, not a hardened profile of `main`.
3. **The bot handle** for the deep link, and confirmation of what appointment tooling actually
   exists in the instance (the request assumed appointments; that has not been verified).

**Nothing in this ADR is executable until 1 and 2 are answered.** It is written now so the decision
exists before the pressure to ship it does.
