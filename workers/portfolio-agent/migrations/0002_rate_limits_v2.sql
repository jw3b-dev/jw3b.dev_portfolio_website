-- 0002 — rate_limits_v2 (P3-08 GA-sweep finding · backend-specialist)
--
-- WHY A NEW TABLE: this D1 database is REUSED from the v1 deployment, which already owns a
-- `rate_limits` table with v1's shape — PK (ip, window_start), no `endpoint` column. The v2
-- limiter UPSERTs (ip, endpoint, window_start), so against v1's table every call throws and
-- the limiter fails OPEN (availability-first catch) — i.e. silently NO rate limiting. The
-- 0001 `CREATE TABLE IF NOT EXISTS rate_limits` no-op'd over the v1 table, which is how the
-- drift shipped. v2 therefore gets its own table; v1 production keeps its table + limiter
-- untouched until promotion, when v1's table can be dropped.
CREATE TABLE IF NOT EXISTS rate_limits_v2 (
  ip           TEXT NOT NULL,
  endpoint     TEXT NOT NULL DEFAULT 'chat',
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, endpoint, window_start)
);
