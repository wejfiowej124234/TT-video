-- 96-18 / 04-附录-DDL §10.7：准入资格 + Webhook 事件只写日志（幂等可审计）
-- 与 docs 下 spec/04-附录-DDL草案.md 表体一致；另加 **(entitlement_id, payload_ref)** 唯一约束供 Webhook 幂等。

CREATE TABLE IF NOT EXISTS onboarding_entitlements (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_target             TEXT NOT NULL CHECK (role_target IN ('provider', 'region_steward')),
    sku                     TEXT NOT NULL,
    fee_schedule_version    TEXT NOT NULL,
    status                  TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'revoked', 'expired')),
    idempotency_key         TEXT UNIQUE,
    provider_payment_ref    TEXT,
    chain_tx_hash           TEXT,
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at                 TIMESTAMPTZ,
    expires_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_entitlements_user_status ON onboarding_entitlements (user_id, status);

CREATE TABLE IF NOT EXISTS onboarding_payment_events (
    id                  BIGSERIAL PRIMARY KEY,
    entitlement_id      UUID NOT NULL REFERENCES onboarding_entitlements(id) ON DELETE CASCADE,
    event_type          TEXT NOT NULL,
    payload_ref         TEXT,
    received_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_payment_events_entitlement ON onboarding_payment_events (entitlement_id, received_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_onboarding_payment_events_entitlement_payload_uq
    ON onboarding_payment_events (entitlement_id, payload_ref);
