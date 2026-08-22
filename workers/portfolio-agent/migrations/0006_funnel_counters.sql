-- 0006 — cookieless funnel counters (P5-02, implements ADR-P5-01).
--
-- WHY THIS SHAPE, AND WHY IT IS THE ONLY SHAPE ALLOWED HERE.
-- docs/COMPLIANCE_RESEARCH.md Q2 establishes that jw3b.dev needs no consent banner ONLY because
-- it sets no cookie and no tracking storage. ADR-P5-01 chose server-side AGGREGATE counters over
-- third-party analytics and over per-session tracking, precisely to keep that true: adding a
-- consent banner to measure a funnel would add friction to the exact funnel being measured.
--
-- The constraint is therefore structural, not a policy someone must remember:
--   * the primary key is (day, surface, event) — there is NOWHERE to put a visitor identifier;
--   * no IP, no user agent, no session id, no timestamp finer than a day;
--   * `count` is the only fact stored.
-- A row cannot single out a person, so this is not personal data and the cookieless posture and
-- the existing ~10-minute IP purge in rate_limits_v2 both stay untouched.
--
-- `day` is UTC 'YYYY-MM-DD'. Day granularity is deliberate: hourly buckets plus a small audience
-- start to become singling-out, which is the line ADR-P5-01 refuses to cross.
--
-- NOTE for the next person: this is a NEW table, so CREATE TABLE IF NOT EXISTS is correct here.
-- Adding a COLUMN to an existing table is the case that silently no-ops — see 0004 and
-- `npm run schema:check`.

CREATE TABLE IF NOT EXISTS funnel_counters (
  day     TEXT NOT NULL,                    -- UTC date, 'YYYY-MM-DD'
  surface TEXT NOT NULL,                    -- which surface ('home', 'audit', 'hire-me', …)
  event   TEXT NOT NULL,                    -- one of the four allowed events (see funnel.js)
  count   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, surface, event)
);

-- The digest query in docs/OPS.md reads by day; this keeps that scan cheap as days accumulate.
CREATE INDEX IF NOT EXISTS idx_funnel_counters_day ON funnel_counters (day);
