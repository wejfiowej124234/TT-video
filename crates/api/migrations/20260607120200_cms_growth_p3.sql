-- 101 v1.1.0 · S1 · P3 Growth 表族 + users 扩展

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS referral_code VARCHAR(64),
    ADD COLUMN IF NOT EXISTS referred_by_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS growth_points BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS early_bird_stage INT,
    ADD COLUMN IF NOT EXISTS growth_fraud_status TEXT NOT NULL DEFAULT 'normal'
        CHECK (
            growth_fraud_status IN (
                'normal',
                'points_frozen',
                'airdrop_ineligible',
                'banned'
            )
        );

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code_unique
    ON users (referral_code)
    WHERE referral_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users (referred_by_user_id);

CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(64) NOT NULL UNIQUE,
    code_type TEXT NOT NULL CHECK (
        code_type IN ('user', 'kol', 'guide', 'merchant', 'region_operator')
    ),
    owner_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    official_account_id UUID REFERENCES ops_official_accounts (id) ON DELETE SET NULL,
    region_iso CHAR(2),
    label TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    max_uses INT,
    use_count INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON referral_codes (owner_user_id);

CREATE TABLE IF NOT EXISTS referral_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    referred_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    referral_code_id UUID REFERENCES referral_codes (id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    points_awarded_referrer BIGINT NOT NULL DEFAULT 0,
    points_awarded_referred BIGINT NOT NULL DEFAULT 0,
    idempotency_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_events_referrer
    ON referral_events (referrer_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_events_referred
    ON referral_events (referred_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_point_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    source TEXT NOT NULL,
    points BIGINT NOT NULL,
    base_points BIGINT,
    early_bird_multiplier NUMERIC(4, 2) DEFAULT 1.0,
    early_bird_stage INT,
    related_user_id UUID REFERENCES users (id) ON DELETE SET NULL,
    related_entity_type TEXT,
    related_entity_id UUID,
    idempotency_key TEXT NOT NULL UNIQUE,
    fraud_status TEXT NOT NULL DEFAULT 'cleared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_ledger_user
    ON growth_point_ledger (user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS early_bird_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_number INT NOT NULL UNIQUE,
    user_rank_from INT NOT NULL,
    user_rank_to INT,
    multiplier NUMERIC(4, 2) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO early_bird_stages (stage_number, user_rank_from, user_rank_to, multiplier)
VALUES
    (1, 1, 1000, 3.0),
    (2, 1001, 5000, 2.0),
    (3, 5001, 10000, 1.5)
ON CONFLICT (stage_number) DO NOTHING;

CREATE TABLE IF NOT EXISTS airdrop_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    gov_pool_amount NUMERIC(38, 0) NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (
            status IN (
                'draft',
                'snapshot_locked',
                'calculated',
                'approved',
                'distributed',
                'cancelled'
            )
        ),
    snapshot_at TIMESTAMPTZ,
    network_points_total BIGINT,
    created_by UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS airdrop_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES airdrop_campaigns (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    points_at_snapshot BIGINT NOT NULL,
    UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS airdrop_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES airdrop_campaigns (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    points BIGINT NOT NULL,
    gov_amount NUMERIC(38, 0) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'distributed', 'revoked')),
    tx_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS growth_fraud_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    risk_level TEXT NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_growth_fraud_signals_subject
    ON growth_fraud_signals (subject_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS growth_fraud_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open',
    resolution TEXT,
    reviewer_id UUID REFERENCES users (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
