-- 160 §5：风险信号投影 + 策略变更审计（最小可运行）

CREATE TABLE IF NOT EXISTS community_risk_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL,
    rule_id TEXT NOT NULL DEFAULT 'community_abuse',
    severity TEXT NOT NULL DEFAULT 'low',
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_risk_signals_severity_check CHECK (severity IN ('info', 'low', 'medium', 'high'))
);

CREATE INDEX IF NOT EXISTS idx_community_risk_signals_subject_created
    ON community_risk_signals (subject_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_risk_signals_type_created
    ON community_risk_signals (signal_type, created_at DESC);

CREATE TABLE IF NOT EXISTS community_policy_change_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES users (id) ON DELETE SET NULL,
    scope TEXT NOT NULL DEFAULT 'community_abuse_policy',
    summary TEXT NOT NULL,
    before_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    source TEXT NOT NULL DEFAULT 'admin_api',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_policy_change_logs_source_check CHECK (source IN ('migration', 'sql', 'admin_api', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_community_policy_change_logs_created
    ON community_policy_change_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_policy_change_logs_scope_created
    ON community_policy_change_logs (scope, created_at DESC);
