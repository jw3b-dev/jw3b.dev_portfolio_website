-- 0003 — restore the two `messages` columns the code has been writing since 2026-08-16.
--
-- WHAT BROKE. `0001_init.sql` declares `messages` WITH `had_audio` and `source`, but it does so
-- with `CREATE TABLE IF NOT EXISTS`, and this database is the ORIGINAL v1 one (created
-- 2026-03-15). The table already existed with the older four-column shape, so 0001 was a silent
-- no-op for it: the columns were never added. Every
--   INSERT INTO messages (conversation_id, role, content, had_audio, source)
-- has therefore failed with "no such column" and been swallowed by the deliberately best-effort
-- catch in appendMessage() — analytics must never break a visitor's chat.
--
-- The visible symptom was 279 of 333 conversation rows with ZERO messages: the conversation
-- INSERT (first, valid) succeeded and the message INSERT (second) threw, leaving a shell. That
-- also inflated the "conversations" figure the P5 funnel scoping was reasoning from, by ~6x.
--
-- This is the SECOND time this exact trap has bitten this database — `rate_limits` needed
-- `rate_limits_v2` for the same reason (a v1 table without the `endpoint` column, and an
-- `IF NOT EXISTS` that no-op'd over it). A parity test now fails CI when the columns a route
-- INSERTs are not the columns the migrations declare, so there will not be a third.
--
-- ALTER TABLE ... ADD COLUMN is additive and non-destructive: existing rows take the DEFAULT.
-- SQLite cannot attach a CHECK constraint via ADD COLUMN, so `source` is validated in the code
-- path (it is only ever passed 'live' or 'cached_replay') rather than by the column.

ALTER TABLE messages ADD COLUMN had_audio INTEGER NOT NULL DEFAULT 0;
ALTER TABLE messages ADD COLUMN source TEXT DEFAULT 'live';
