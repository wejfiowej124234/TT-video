-- ①.5 Phase A：identity 统一模型（PD-006/008）— 新表 + 双写；读路径仍走 guides / onboarding_*。
-- SSOT: docs/spec/artifacts/identity-unified-model.v1.md

CREATE TABLE IF NOT EXISTS wallets (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address         TEXT NOT NULL,
    label           TEXT,
    is_primary      BOOLEAN NOT NULL DEFAULT false,
    verified_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT wallets_address_nonempty CHECK (btrim(address) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_address_lower
    ON wallets (user_id, lower(btrim(address)));

CREATE UNIQUE INDEX IF NOT EXISTS idx_wallets_user_primary
    ON wallets (user_id)
    WHERE is_primary = true;

CREATE TABLE IF NOT EXISTS role_applications (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind                TEXT NOT NULL CHECK (kind IN ('guide', 'provider_onboarding', 'region_steward_onboarding')),
    status              TEXT NOT NULL CHECK (status IN (
        'draft', 'submitted', 'reviewing', 'approved', 'rejected', 'suspended'
    )),
    legacy_ref          JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at        TIMESTAMPTZ,
    decided_at          TIMESTAMPTZ,
    rejection_codes     JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_message   TEXT,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_applications_user_kind
    ON role_applications (user_id, kind);

CREATE INDEX IF NOT EXISTS idx_role_applications_legacy_guides_id
    ON role_applications ((legacy_ref->>'guides_id'))
    WHERE legacy_ref ? 'guides_id';

CREATE INDEX IF NOT EXISTS idx_role_applications_legacy_entitlement_id
    ON role_applications ((legacy_ref->>'entitlement_id'))
    WHERE legacy_ref ? 'entitlement_id';

CREATE TABLE IF NOT EXISTS role_documents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES role_applications(id) ON DELETE CASCADE,
    doc_type        TEXT NOT NULL,
    storage_url     TEXT,
    content_hash    TEXT,
    legacy_column   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_role_documents_application
    ON role_documents (application_id, doc_type);

CREATE TABLE IF NOT EXISTS staking_positions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES role_applications(id) ON DELETE CASCADE,
    kind            TEXT NOT NULL CHECK (kind IN (
        'identity_pool_guide', 'identity_pool_provider', 'onboarding_fee'
    )),
    wallet_id       UUID REFERENCES wallets(id) ON DELETE SET NULL,
    amount          TEXT NOT NULL DEFAULT '0',
    currency        TEXT NOT NULL DEFAULT 'USDT',
    chain_id        BIGINT,
    tx_hash         TEXT,
    status          TEXT NOT NULL CHECK (status IN (
        'pending', 'locked', 'released', 'slashed'
    )),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_staking_positions_application_kind
    ON staking_positions (application_id, kind);
