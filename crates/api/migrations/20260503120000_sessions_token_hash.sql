-- Session token at-rest hardening (phase 1): add optional token_hash for dual-read migration.
ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS token_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token_hash_unique
    ON sessions (token_hash)
    WHERE token_hash IS NOT NULL;
