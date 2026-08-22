/*
 * Which work sits under which hat  ·  solutions-architect  (brief 03, next-needs 1 and 2)
 *
 * Selecting a hat dimmed the cards and did nothing else: the hats COLOURED the page, they did not
 * navigate it. A visitor who clicked "Auditor" learned that some cards were less relevant and was
 * given no way to reach the ones that were.
 *
 * This is the missing edge — hat → the work that evidences it — as data, so the mapping is stated
 * once and can be checked. Two rules keep it honest:
 *
 *   1. Every hat MUST have at least one entry. A hat that surfaces nothing is a claim about
 *      identity with no work behind it, which is the exact shape this site refuses elsewhere. A
 *      test enforces it, so adding a fifth hat without evidence fails rather than rendering empty.
 *   2. Entries point at surfaces that EXIST on the page they link to. They are `aria-labelledby`
 *      ids already rendered by the flagship cards and the delivery anchor — not new anchors
 *      invented for a nav, which would rot the moment a section was renamed.
 *
 * The PM hat is why this file resolves brief 03's second next-need too. FR-060 deliberately keeps
 * the delivery record separate from the flagships — right, because it is a different kind of
 * evidence — but that left it floating free of the hat it exists to evidence. Here it is the PM
 * hat's work, without moving it into the flagship set.
 */
import { HATS } from '../constants/index.js'

/** @typedef {{label:string, detail:string, href:string}} HatWorkItem */

const WORK = Object.freeze({
  engineer: [
    { label: 'The on-site AI', detail: 'The concierge, /audit and the CTF as one system you are already operating.', href: '/work#ai-flagship-title' },
    { label: 'Overmind', detail: 'The governed agent engine — step its lifecycle and break a principle to watch the gate refuse.', href: '/work#overmind-title' },
    { label: 'Kointel', detail: 'A compliance gate that fails the build — run the rule yourself.', href: '/work#kointel-title' },
  ],
  auditor: [
    { label: 'KTHULHU', detail: 'The autonomous auditor — its corpus searchable here, and its two-lane pipeline steppable.', href: '/work#kthulhu-title' },
    { label: 'The audit console', detail: 'Screen a contract, apply a rule-derived fix, watch it re-screen.', href: '/audit' },
    { label: 'Capture the Vault', detail: 'A reentrant vault on Base Sepolia, readable before any wallet.', href: '/ctf' },
  ],
  pm: [
    // FR-060's anchor, tied to the hat it evidences rather than left floating beside the flagships.
    { label: 'The delivery record', detail: 'Plants and countries delivered against, with the AgilePM credential behind it.', href: '/#delivery-anchor-title' },
    { label: 'How the work is run', detail: 'The failures surface — what went wrong, and what changed because of it.', href: '/#failures-title' },
  ],
  founder: [
    { label: 'KTHULHU', detail: 'A shipped product with paying users, not a side project.', href: '/work#kthulhu-title' },
    { label: 'Kointel', detail: 'A second shipped product, compliance-first by construction.', href: '/work#kointel-title' },
    { label: 'What is claimed, and why', detail: 'Every figure on this site with its evidence — and the claims it refuses to make.', href: '/evidence' },
  ],
})

/** PURE — the work under a hat. Unknown or absent key yields an empty list, never a throw. */
export function workForHat(hatKey) {
  return WORK[hatKey] ?? []
}

/** Every hat key this module knows about — derived, so it cannot drift from the data. */
export const HAT_WORK_KEYS = Object.freeze(Object.keys(WORK))

/** The canonical hat keys, for the test that pins rule 1. */
export const CANONICAL_HAT_KEYS = Object.freeze(HATS.map((h) => h.key))
