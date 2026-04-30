-- 认证审计事件（登录/登出/会话失效/密码重置链路）
CREATE TABLE IF NOT EXISTS auth_audit_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type      TEXT NOT NULL,
    user_id         UUID,
    request_id      TEXT,
    client_ip       TEXT,
    user_agent      TEXT,
    reason          TEXT,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_events_event_time
    ON auth_audit_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_events_user_time
    ON auth_audit_events (user_id, created_at DESC);
