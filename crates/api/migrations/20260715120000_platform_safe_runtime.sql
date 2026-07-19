-- Platform Safe runtime (RC2 Step 2 · PFG V1.0)
-- SSOT: docs/spec/artifacts/platform-safe-runtime.v1.md
-- Platform commercial revenue receiver only — NOT DAO treasury / stake pools.

CREATE TABLE IF NOT EXISTS platform_safe_current (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    network TEXT NOT NULL,
    chain_id BIGINT NOT NULL,
    safe_address TEXT NOT NULL,
    status TEXT NOT NULL,
    version INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT platform_safe_current_status_chk
        CHECK (status IN ('active', 'inactive')),
    CONSTRAINT platform_safe_current_address_chk
        CHECK (char_length(trim(safe_address)) > 0),
    CONSTRAINT platform_safe_current_network_chk
        CHECK (char_length(trim(network)) > 0),
    CONSTRAINT platform_safe_current_version_chk
        CHECK (version >= 1)
);

-- At most one active current row
CREATE UNIQUE INDEX IF NOT EXISTS uq_platform_safe_current_one_active
    ON platform_safe_current ((status))
    WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_platform_safe_current_updated
    ON platform_safe_current (updated_at DESC);

CREATE TABLE IF NOT EXISTS platform_safe_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version INTEGER NOT NULL,
    network TEXT NOT NULL,
    chain_id BIGINT NOT NULL,
    safe_address TEXT NOT NULL,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    retired_at TIMESTAMPTZ NULL,
    CONSTRAINT platform_safe_version_history_version_uq UNIQUE (version),
    CONSTRAINT platform_safe_version_history_address_chk
        CHECK (char_length(trim(safe_address)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_platform_safe_version_history_effective
    ON platform_safe_version_history (effective_at DESC);

CREATE TABLE IF NOT EXISTS platform_safe_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_address TEXT NULL,
    new_address TEXT NOT NULL,
    reason TEXT NOT NULL,
    network TEXT NOT NULL,
    chain_id BIGINT NOT NULL,
    version INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT platform_safe_audit_log_action_chk
        CHECK (action IN ('update_platform_safe')),
    CONSTRAINT platform_safe_audit_log_reason_chk
        CHECK (char_length(trim(reason)) > 0),
    CONSTRAINT platform_safe_audit_log_new_address_chk
        CHECK (char_length(trim(new_address)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_platform_safe_audit_log_created
    ON platform_safe_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_safe_audit_log_operator
    ON platform_safe_audit_log (operator_id, created_at DESC);

COMMENT ON TABLE platform_safe_current IS 'PFG: singleton active Platform Safe (commercial revenue)';
COMMENT ON TABLE platform_safe_version_history IS 'PFG: Platform Safe address version history';
COMMENT ON TABLE platform_safe_audit_log IS 'PFG: append-only audit; application MUST NOT UPDATE/DELETE';
