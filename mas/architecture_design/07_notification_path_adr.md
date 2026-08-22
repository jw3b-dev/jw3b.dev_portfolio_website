# ADR-R2-01 — The lead notification path

**Status:** ACCEPTED (2026-08-21, shipped in rerun W1) · **documented retroactively 2026-08-22**
· solutions-architect
**Extends:** FR-036/037, and is the mechanism behind **FR-062** (EPIC K outcome: *a submitted
engagement reaches John*).
**Numbering:** `ADR-R2-NN` marks decisions taken during the rerun, distinct from `ADR-NN` (core)
and `ADR-P5-NN` (phase 5).

> Written after the fact, which is a defect in itself: W1 shipped a third-party data flow with no
> ADR, and the red-team pass below found a compliance gap that had been live since. The lesson is
> recorded rather than smoothed over — an implemented decision still needs its decision record,
> because the record is where the adversarial questions get asked.

---

## 1. NFRs (measured from the shipped code, not asserted)

| # | Constraint | Where it is enforced |
|---|---|---|
| **N1** | A notification failure must never cost a lead | `engagement.js` persists to D1 **before** `notifyLead` is called; a send failure cannot roll it back |
| **N2** | The 200 must not wait on a third party | `notify.js` dispatches via `ctx.waitUntil`; the response does not await the Telegram round-trip |
| **N3** | `notifyLead` must never throw into the request path | it catches everything and returns `{ alerting }` |
| **N4** | No secret in the repo | `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` via `wrangler secret put`; never in `wrangler.toml`, never logged |
| **N5** | Absent credentials ⇒ capture still works | `telegramConfigured(env)` gates the send; the response reports `alerting:false` honestly |
| **N6** | Alert content must be safe and bounded | `escapeHtml` on every field + a length cap, since lead text is attacker-controllable |
| **N7** | Latency target | the lead reaches John in **≤ 60s** (FR-062) |

**The decisive pair is N1 × N7.** The outcome is *reaching John quickly*, but not at the cost of the
lead itself — so the order is fixed: **persist, then notify, never the reverse.** Every option below
was judged on that ordering first.

## 2. Decision — Telegram Bot API, persist-first, fire-and-forget

| Option | Pros | Cons | NFR fit | Cost |
|---|---|---|---|---|
| **A — Email** (Resend / MailChannels) | universal; archivable | needs a sending domain + DNS + deliverability care; lands in an inbox John may not read for hours | fails **N7** in practice; extra secret + domain surface | ~$0–20/mo |
| **B — Telegram Bot API** ✅ | push to a device John already carries; one HTTPS POST; a single secret pair; no domain setup | a third-party processor now receives lead PII (see §4.5); Telegram outage loses the notification | meets N1–N7 | $0 |
| **C — Webhook → Discord/queue** | fan-out; retries if a queue is used | another service to run; Discord is not where John works | meets N7 only if he watches it | $0 |

**Selected: B, because N7 requires a push channel the owner actually reads within a minute, and
Telegram is the one already on his phone.** A and C both satisfy "a message is sent"; only B
satisfies "John knows".

**Trade-off accepted:** a Telegram outage costs the *notification*, not the lead — D1 remains the
ledger and the confirmation degrades to a truthful "recorded" state rather than claiming delivery.

**Accepted technical debt (named, not hidden):** there is **no retry and no reconciler**. A send
that fails is gone; only the row survives. That is acceptable while volume is low and John can
query the table, and it is the first thing to build if volume rises.

## 3. Red-team — the five challenges

1. **10× load?** Telegram rate-limits the bot. Sends fail, `ctx.waitUntil` swallows it, leads still
   persist. Degradation is correct; the *observability* of it is not — nothing counts failed sends.
   → folds into **P5-02** (funnel counters).
2. **Single point of failure?** Telegram. Bounded by N1: the lead survives.
3. **Weakest security control?** The bot token. It is store-only, never logged, and the message body
   is HTML-escaped and length-capped (N6) so a crafted lead cannot inject markup into the alert.
4. **Vendor down 4 hours?** Four hours of missed pings; zero lost leads; owner queries D1.
5. **Which compliance requirement is only partially addressed?** ⚠️ **This one found a live gap —
   see §4.**

## 4. ⚠️ Finding P1 — the privacy notice does not disclose this processor

**Status: OPEN, remediated in the same commit as this ADR; needs owner review.**

The engagement flow collects a contact (email or handle), an optional wallet address, and the
configurator's answers. Since W1 those fields are transmitted to **Telegram** — a third-party
processor outside the UK/EU — and `src/content/privacy.md` does not name it.

**Stated precisely, because the imprecise version overstates the defect:** the notice is *not*
silent on processors. It has a "Where the data goes" section that already names Cloudflare (Worker
+ D1), Anthropic, Deepgram and WalletConnect, and it is accurate about each. **Telegram is a single
omission created by W1** — a processor added to the data flow without the notice being updated
alongside it. The gap is one line wide, and it is still an Article 13 gap.

Under the regimes this project declares applicable (GDPR/POPIA, `docs/COMPLIANCE.md`), the
recipients of personal data and any transfer outside the jurisdiction are **Article 13 disclosures
at collection time**, not optional detail. The legal basis is fine — contract/legitimate interest
for responding to a business enquiry — so this is a *transparency* defect, not a lawfulness one.

**Why it survived:** W1 was scoped as "make a lead reach John", the gates that ran were tests and
claims/secret scans, and no gate reads the privacy notice against the data flows the code actually
performs. That is root cause 3 in a new costume — the artifact and the running system disagreed and
nothing compared them.

**Remediation:** `privacy.md` gains an explicit processors + transfer section naming Cloudflare
(hosting, D1) and Telegram (lead notification), with the transfer basis. **John should read that
wording before it stands as his notice.**

**Follow-on, not done here:** a gate that fails when a Worker route transmits personal data to a
host the privacy notice does not name. That is the only thing that stops this recurring, and it is
filed rather than hand-waved.
