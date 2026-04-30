-- 用户安全通知事件队列（登录提醒/密码变更提醒等）
CREATE TABLE IF NOT EXISTS user_security_notifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL,
    event_type      TEXT NOT NULL,
    template_key    TEXT NOT NULL,
    payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
    delivery_status TEXT NOT NULL DEFAULT 'pending',
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_security_notifications_user_time
    ON user_security_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_security_notifications_status_time
    ON user_security_notifications (delivery_status, created_at DESC);

