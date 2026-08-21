/*
 * Booking scheduler (P5-01). PUBLIC value — a booking page URL, safe in the client bundle.
 *
 * Provider: Cal.com (chosen 2026-08-21, ADR-P5-02 in mas/PLAN.md) — its free tier covers real
 * calendar sync, timezone handling, reminders and reschedule, which a hand-rolled picker would
 * have to reimplement badly; it is open-source and self-hostable later, and we LINK rather than
 * embed so no third-party script touches the page (no CSP change, no privacy-notice change).
 *
 * Empty until John sets VITE_SCHEDULER_URL (one line in .env.production). While empty the
 * confirmation falls back to the honest floor copy plus a direct mail link — never a dead button.
 */
export const SCHEDULER_URL = import.meta.env.VITE_SCHEDULER_URL || ''

/** Where a visitor can always reach John, scheduler or not. */
export const CONTACT_EMAIL = 'john@agilegypsy.com'
