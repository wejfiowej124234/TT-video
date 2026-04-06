-- 220/240 Feature Flag 与 230 Secret 元数据（04 §3.5、14）；仅存元数据，密钥明文不得入库

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_code TEXT NOT NULL UNIQUE,
    description TEXT,
    scope TEXT NOT NULL DEFAULT 'global',
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_percent INT NOT NULL DEFAULT 0,
    region TEXT,
    version BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT feature_flags_rollout_check CHECK (rollout_percent >= 0 AND rollout_percent <= 100)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_code ON feature_flags(flag_code);

CREATE TABLE IF NOT EXISTS secret_key_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_alias TEXT NOT NULL UNIQUE,
    env_scope TEXT NOT NULL DEFAULT 'all',
    last_rotated_at TIMESTAMPTZ,
    next_rotation_due TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_secret_key_metadata_alias ON secret_key_metadata(key_alias);

-- 元数据占位行：不含密钥值；运维在轮换后更新 last_rotated_at / next_rotation_due
INSERT INTO secret_key_metadata (key_alias, env_scope, status, notes) VALUES
  ('EVIDENCE_RECEIPT_HMAC_KEY', 'api', 'active', 'Value only in env/KMS; this row is governance metadata'),
  ('DATABASE_URL', 'api', 'active', 'Presence/classification only; never store connection string in DB'),
  ('CHAIN_RPC_URL', 'api', 'active', 'Endpoint classification; never store secrets in DB')
ON CONFLICT (key_alias) DO NOTHING;
