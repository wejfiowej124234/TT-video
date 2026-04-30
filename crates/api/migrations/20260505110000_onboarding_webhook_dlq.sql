-- 96-18 / 96-09：内网 webhook **`apply_payment_webhook`** 返回 **DB 错误** 时的死信留存（运维可对照重放；**不**替代 PSP 投递重试策略）。
CREATE TABLE IF NOT EXISTS onboarding_webhook_dlq (
    id                  BIGSERIAL PRIMARY KEY,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    idempotency_key     TEXT NOT NULL,
    provider_event_id   TEXT NOT NULL,
    outcome             TEXT NOT NULL,
    raw_body            JSONB NOT NULL,
    error_message       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_onboarding_webhook_dlq_created
    ON onboarding_webhook_dlq (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_webhook_dlq_idem
    ON onboarding_webhook_dlq (idempotency_key);
