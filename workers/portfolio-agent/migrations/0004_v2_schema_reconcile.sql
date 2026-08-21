-- 0004 — finish making this database the V2 database.
--
-- THE SITUATION, stated plainly. v2 was built against an isolated `portfolio-agent-v2` preview
-- precisely so that deploying would not overwrite the live v1 backend. But the D1 binding was
-- never new: `wrangler.toml` points at `jw3b_analytics`, created 2026-03-15 for v1, with the
-- comment "reused from the prior deployment … v2 migration is idempotent (CREATE TABLE IF NOT
-- EXISTS)". That parenthesis is the bug. `CREATE TABLE IF NOT EXISTS` against a table that already
-- exists is a NO-OP, not an upgrade — so every v1 table kept its v1 shape and the v2 columns were
-- never added. The worker got replaced on every deploy; its database never did.
--
-- Two write paths were failing silently because of it, both swallowed by best-effort catches:
--   · `messages` (fixed in 0003) — five days of chat transcripts lost.
--   · `ctf_solves` (fixed here) — src/routes/ctf.js writes `attacker` and `drained_amount`, and
--     the live table has neither. Every CTF solve write threw. The "0 solves" figure was never
--     evidence that nobody solved it; it was evidence that nobody's solve could be recorded.
--
-- After this migration the live schema matches every v2 migration exactly, verified by
-- `npm run schema:check` (which diffs the LIVE database against these files — the check that
-- would have caught all of this on day one).

-- The CTF proof-of-solve record: who attacked, and for how much.
ALTER TABLE ctf_solves ADD COLUMN attacker TEXT;
ALTER TABLE ctf_solves ADD COLUMN drained_amount TEXT;

-- v1's rate limiter, dead since `rate_limits_v2` replaced it. It was superseded for exactly this
-- reason: the v1 table has no `endpoint` column and `IF NOT EXISTS` no-op'd over it, so the
-- limiter failed open in production until the v2 table was introduced under a new name. Nothing
-- reads or writes it now, and leaving a table that only exists to be misleading is how the next
-- person loses an afternoon.
DROP TABLE IF EXISTS rate_limits;
