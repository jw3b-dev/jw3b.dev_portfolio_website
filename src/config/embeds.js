/*
 * Flagship-embed origin gate.
 *
 * The live flagship products (kthulhu.co, kointel.co.za) opt jw3b.dev in to framing via CSP
 * `frame-ancestors https://jw3b.dev`. When the framing origin ISN'T on that allow-list the
 * browser blocks the frame AND fires the iframe's `load` event for its own error page — so a
 * client-side load/timeout check cannot tell "blocked" from "loaded" and the grey "refused to
 * connect" box sticks. The only reliable defence is to attempt the frame ONLY from the origin
 * the products actually allow — the deployed jw3b.dev. Everywhere else (localhost, a preview
 * host, a staging domain) we never render the iframe and degrade to the card/walkthrough, so
 * the broken frame can't appear even if the embed flag is mistakenly on.
 */
import { SITE } from '../constants/index.js'

// True only when the current page origin is the one the flagship products allow-list.
export function framingOriginAllowed(win = typeof window !== 'undefined' ? window : undefined) {
  return win?.location?.origin === SITE.domain
}

/*
 * True only when the page origin is one the Worker's CORS allowlist accepts.
 *
 * The Worker locks `Access-Control-Allow-Origin` to an allowlist (NFR-04) and the dev origin
 * arrives only via the `DEV_ORIGIN` secret, which is absent in production. So a browser on
 * localhost or a preview host gets a CORS failure — and the browser logs that failure itself,
 * before any try/catch in our code can see it. A component that probes ON MOUNT therefore prints
 * a console error on every local build forever, which is precisely what the console-error budget
 * (FR-067) exists to stop. It caught this.
 *
 * Same shape as `framingOriginAllowed` above, and the same reason: some checks can only honestly
 * be made from the deployed origin, so don't attempt them anywhere else.
 */
export function workerOriginAllowed(win = typeof window !== 'undefined' ? window : undefined) {
  return win?.location?.origin === SITE.domain
}
