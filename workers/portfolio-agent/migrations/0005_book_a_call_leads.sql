-- 0005 — persist the book-a-call floor.
--
-- `/book-a-call` is FR-036's "guaranteed terminal action" and the floor every other rail degrades
-- to. It validated the visitor's contact and then THREW IT AWAY, returning 200 with a scheduler
-- URL that has never been provisioned. The audit found it because the UI says "John will follow
-- up" on a path where nothing was kept and nobody was told.
--
-- A bare book-a-call has no objective, engagement, tier, or price, so it cannot go in
-- `engagement_requests` — that table's CHECK constraints require all four, and faking them would
-- corrupt the conversion funnel it exists to measure. Its own table keeps both records honest.
--
-- NOTE for the next person: this is a NEW table, so CREATE TABLE IF NOT EXISTS is correct here.
-- Adding a COLUMN to an existing table is the case that silently no-ops — see 0004 and
-- `npm run schema:check`.

CREATE TABLE IF NOT EXISTS book_a_call_leads (
  id         TEXT PRIMARY KEY,
  contact    TEXT NOT NULL,
  wallet     TEXT DEFAULT NULL,
  source     TEXT DEFAULT NULL,               -- which surface sent it (mission-control, concierge, …)
  notified   INTEGER NOT NULL DEFAULT 0,      -- was an alert channel configured when it landed
  status     TEXT CHECK(status IN ('submitted','contacted','closed')) NOT NULL DEFAULT 'submitted',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_book_a_call_leads_created ON book_a_call_leads(created_at DESC);
