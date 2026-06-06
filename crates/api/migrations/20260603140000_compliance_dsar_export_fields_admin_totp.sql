-- DSAR ① 预备字段（spec 500）+ Admin TOTP 登记（② 强制策略接线）

ALTER TABLE compliance_data_requests
    ADD COLUMN IF NOT EXISTS export_signature TEXT,
    ADD COLUMN IF NOT EXISTS record_hash_fingerprint TEXT;

CREATE TABLE IF NOT EXISTS admin_totp_enrollments (
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    secret_base32 TEXT NOT NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_totp_enrollments_verified
    ON admin_totp_enrollments (verified_at NULLS LAST);
