-- 96-18 / 96-04 R3：env 子串拒服（ONBOARDING_COMPLIANCE_EMAIL_DENYLIST）best-effort 落库；不含 email PII。

CREATE TABLE IF NOT EXISTS onboarding_compliance_audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    user_id         UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    request_id      TEXT,
    route           TEXT NOT NULL,
    decision        TEXT NOT NULL DEFAULT 'email_denylist_hit',
    screening_tier  TEXT NOT NULL DEFAULT 'env_substring_only',
    api_error       TEXT NOT NULL DEFAULT 'onboarding_forbidden_sanctions'
);

CREATE INDEX IF NOT EXISTS idx_onboarding_compliance_audit_created
    ON onboarding_compliance_audit_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_onboarding_compliance_audit_user_created
    ON onboarding_compliance_audit_events (user_id, created_at DESC);
