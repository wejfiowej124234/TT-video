-- 用户安全通知派发状态补强：重试计数与失败原因
ALTER TABLE user_security_notifications
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_error TEXT;

CREATE INDEX IF NOT EXISTS idx_user_security_notifications_status_attempts_time
    ON user_security_notifications (delivery_status, attempts, created_at DESC);

