-- 270：匿名短期链接兑现访问审计（与 04 §3.4 GET media/access、270 §六 media_access_logs）
CREATE TABLE IF NOT EXISTS media_access_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id        UUID REFERENCES signed_url_tokens(id) ON DELETE SET NULL,
    object_id       TEXT NOT NULL,
    actor_or_ip     TEXT NOT NULL,
    action          TEXT NOT NULL,
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_media_access_logs_occurred ON media_access_logs (occurred_at);
CREATE INDEX IF NOT EXISTS idx_media_access_logs_object_id ON media_access_logs (object_id);
