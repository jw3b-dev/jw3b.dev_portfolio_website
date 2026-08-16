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
