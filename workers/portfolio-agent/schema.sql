-- 🗄️ Cloudflare D1 Database Schema
-- For Analytics and Chat History Persistence (Phase 3 Big & Fancy)

DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- 1. Conversations Index
CREATE TABLE conversations (
    id TEXT PRIMARY KEY,               -- UUID or custom ID
    wallet_address TEXT DEFAULT NULL,   -- Connected wallet (if any)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Message History Blocks
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id TEXT NOT NULL,
    role TEXT CHECK(role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- Indexing for speedups
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_conversations_wallet ON conversations(wallet_address);

-- 3. Rate limiting (fixed-window counters per client IP).
-- IF NOT EXISTS so this can be applied without dropping analytics data.
-- Old windows can be pruned periodically: DELETE FROM rate_limits WHERE window_start < <cutoff>;
CREATE TABLE IF NOT EXISTS rate_limits (
    ip TEXT NOT NULL,
    window_start INTEGER NOT NULL,     -- epoch-ms of the window start
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (ip, window_start)
);

-- 4. CTF leaderboard — one row per wallet that has drained the ReentrantVault.
-- IF NOT EXISTS so it can be applied without dropping analytics data.
CREATE TABLE IF NOT EXISTS ctf_solves (
    address TEXT PRIMARY KEY,          -- solver EOA (lowercased)
    tx_hash TEXT NOT NULL UNIQUE,      -- the winning drain transaction
    block_number INTEGER NOT NULL,
    ts INTEGER NOT NULL                -- epoch seconds of the capture
);
