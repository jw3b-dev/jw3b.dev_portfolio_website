-- jw3b.dev v2 — D1 init (DE-01…08)  ·  backend-specialist (MAS P0-05)
-- Realizes architecture_design/03 §4. USDC amounts are TEXT (exact 6-dec BigInt, BR-06).
-- The claims register (DE-07) is AUTHORITATIVE as a repo file (ADR-09); claim_records here
-- is an OPTIONAL analytics/KB mirror and NEVER authorizes rendering.

-- Concierge analytics (DE-05)
CREATE TABLE IF NOT EXISTS conversations (
  id             TEXT PRIMARY KEY,
  wallet_address TEXT DEFAULT NULL,
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id TEXT NOT NULL,
  role            TEXT CHECK(role IN ('user','assistant','system')) NOT NULL,
  content         TEXT NOT NULL,                 -- TAGS STRIPPED before insert
  had_audio       INTEGER NOT NULL DEFAULT 0,
  source          TEXT CHECK(source IN ('live','cached_replay')) DEFAULT 'live',
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);

-- Audit analytics (DE-06) — no raw source retained long-term
CREATE TABLE IF NOT EXISTS audit_runs (
  id          TEXT PRIMARY KEY,
  tool        TEXT CHECK(tool IN ('auditor','fuzz','tx_explainer')) NOT NULL,
  input_hash  TEXT,
  duration_ms INTEGER,
  source      TEXT CHECK(source IN ('live','cached_replay')) DEFAULT 'live',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CTF leaderboard (DE-04)
CREATE TABLE IF NOT EXISTS ctf_solves (
  address        TEXT PRIMARY KEY,
  tx_hash        TEXT NOT NULL UNIQUE,
  attacker       TEXT,
  block_number   INTEGER NOT NULL,
  drained_amount TEXT,
  ts             INTEGER NOT NULL
);

-- Engagement capture (DE-01) — the conversion record; book-a-call floor writes here
CREATE TABLE IF NOT EXISTS engagement_requests (
  id               TEXT PRIMARY KEY,
  objective        TEXT CHECK(objective IN ('security','engineering','pm')) NOT NULL,
  assessment_json  TEXT,
  engagement       TEXT CHECK(engagement IN ('project','retainer')) NOT NULL,
  tier             TEXT NOT NULL,
  indicative_price TEXT NOT NULL,                -- copied from retainer.json (BR-12)
  route            TEXT CHECK(route IN ('book_a_call','escrow','unlock')) NOT NULL,
  wallet           TEXT DEFAULT NULL,
  contact          TEXT NOT NULL,
  tx_hash          TEXT DEFAULT NULL,
  status           TEXT CHECK(status IN ('submitted','contacted','escrow_funded','paid','closed'))
                     NOT NULL DEFAULT 'submitted',
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_engagement_status ON engagement_requests(status);
CREATE INDEX IF NOT EXISTS idx_engagement_created ON engagement_requests(created_at);

-- Escrow index (DE-03) — off-chain mirror of on-chain truth
CREATE TABLE IF NOT EXISTS escrow_agreements (
  id               TEXT PRIMARY KEY,
  request_id       TEXT,
  client_wallet    TEXT,
  provider_wallet  TEXT,
  amount_usdc      TEXT,                          -- 6-dec BigInt as TEXT (BR-06)
  milestone        TEXT,
  state            TEXT CHECK(state IN ('funded','released','refunded')),
  contract_address TEXT,
  chain            TEXT CHECK(chain IN ('base','base_sepolia')),
  is_testnet       INTEGER NOT NULL DEFAULT 1,
  tx_hash          TEXT,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Claims register MIRROR (DE-07) — OPTIONAL analytics/KB only; repo file is authoritative (ADR-09)
CREATE TABLE IF NOT EXISTS claim_records (
  claim_id         TEXT PRIMARY KEY,
  text             TEXT NOT NULL,
  value            TEXT,
  evidence_source  TEXT CHECK(evidence_source IN ('portfolio_reference','cv_source','credential_url','owner_attested','none')),
  evidence_pointer TEXT,
  provenance_note  TEXT DEFAULT NULL,
  status           TEXT CHECK(status IN ('cleared','requires_resolution','forbidden')) NOT NULL,
  surfaces_json    TEXT,
  updated_at       DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Rate limiting (per-IP, per-endpoint window) — ADR-04
CREATE TABLE IF NOT EXISTS rate_limits (
  ip           TEXT NOT NULL,
  endpoint     TEXT NOT NULL DEFAULT 'chat',
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip, endpoint, window_start)
);
