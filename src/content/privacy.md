# Privacy notice

This site is run by John Wellard (AgileGypsy), a blockchain engineer and smart-contract security auditor. This notice explains, in plain terms, what the site collects, why, where it goes, and the choices you have. It reflects what the code actually does — not an aspiration.

## What this site collects

### Analytics

To operate and improve the site, its backend records a small amount of usage data:

- Concierge chat: the text of your messages and a conversation id, so the assistant can reply and so its answers can be reviewed and improved.
- Security console: when you run the AI audit tool, a one-way hash of the contract you paste — never the source itself — plus which tool ran and how long it took.
- Abuse prevention: your IP address and which endpoint you called, kept briefly, to rate-limit and stop abuse.

### Connected-wallet data

Connecting a wallet is always optional and never required to contact John. If you do connect one, or add its address to an engagement request, that public wallet address is stored with the request. A wallet address is a public on-chain identifier.

### Engagement requests

When you send an engagement request or book a call from Mission Control, the site stores:

- your contact — the email or handle you enter, so John can reach you;
- your configurator answers — the objective, the assessment answers, the engagement shape, and the tier you landed on;
- an optional wallet address, only if you provide one;
- the indicative price, copied from the site's public pricing catalog — the price is never taken from your browser.

This is kept in order to respond to your enquiry. Providing it is your choice; without a way to reach you, John cannot follow up.

## Where the data goes

- The backend is a Cloudflare Worker with a Cloudflare D1 database. AI features use Cloudflare Workers AI and, for some analysis, Anthropic's API — called only from the Worker, never from your browser. Voice features use Deepgram.
- Wallet connections are handled by your own wallet provider and WalletConnect, not by this site.
- Your browser keeps a small queue in local storage so a book-a-call request can complete even if you are offline, and send when you reconnect. Once the request is delivered, that queued copy is removed.

## What this site does not do

- It does not sell your data or share it for advertising.
- It does not store the raw source of contracts you analyse — only a one-way hash.
- AI output is labelled as AI-assisted and is not a substitute for a full manual audit.

## Retention

Engagement requests are kept while your enquiry is active and for a reasonable period afterwards, then removed. Analytics are retained to operate the service. Rate-limiting records (which include your IP address) are purged automatically after roughly ten minutes.

## Which law applies

This site is operated from South Africa, so POPIA governs how your information is handled; for visitors in the EU or UK, the GDPR / UK GDPR applies to you as well. Where the regimes differ, the stricter rule is followed.

## Your choices and rights

- You can ask for a copy of the data tied to your request, ask to correct it, or ask for it to be deleted. Email john@agilegypsy.com and it will be actioned within 30 days (one month), as POPIA and the GDPR require.
- You can browse and use the site without connecting a wallet and without sending an engagement request — booking a call needs only a way to reach you.
- Wallet addresses are treated as personal data. Nothing that directly identifies you is ever written on-chain.

## Contact

John Wellard — john@agilegypsy.com

Last updated: 18 August 2026
