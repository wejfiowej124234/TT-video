-- 业务表：users + sessions（04-附录-DDL草案 §9.1、§9.2）
-- 与 chain_off::UserRow / sessions 对齐，供启动时 hydrate 与注册/登录双写

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT NOT NULL UNIQUE,
    password_hash       TEXT,
    role                TEXT NOT NULL DEFAULT 'tourist',
    kyc_status          TEXT NOT NULL DEFAULT 'none',
    nickname            TEXT,
    avatar_url          TEXT,
    default_wallet_address TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (LOWER(email));

CREATE TABLE IF NOT EXISTS sessions (
    token               TEXT PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
