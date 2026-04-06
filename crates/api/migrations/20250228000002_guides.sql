-- 业务表：guides（04-附录-DDL草案 §9.3）；P0 企业级检查报告 G1
-- 与 chain_off::GuideRow 对齐，启动 hydrate + 向导注册双写

CREATE TABLE IF NOT EXISTS guides (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    city                TEXT NOT NULL,
    country_code        TEXT NOT NULL DEFAULT '',
    languages           JSONB NOT NULL DEFAULT '[]',
    service_types       JSONB NOT NULL DEFAULT '[]',
    bio                 TEXT,
    wallet_address      TEXT,
    real_name           TEXT,
    passport_number_hash TEXT,
    id_photo_url        TEXT,
    language_cert_url   TEXT,
    stake_amount        TEXT NOT NULL DEFAULT '0',
    status              TEXT NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_guides_user ON guides (user_id);
CREATE INDEX IF NOT EXISTS idx_guides_status ON guides (status);
