-- 认证审计查询性能补强：按 client_ip + 时间窗口检索
-- 用于同 IP 高频 forgot/reset 检测与取证导出
CREATE INDEX IF NOT EXISTS idx_auth_audit_events_client_ip_time
    ON auth_audit_events (client_ip, created_at DESC)
    WHERE client_ip IS NOT NULL;

