-- 270：短期签名访问令牌（04 §3.4 POST /api/v1/media/signed-urls）
CREATE TABLE IF NOT EXISTS signed_url_tokens (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    object_id           TEXT NOT NULL,
    url_scope           TEXT NOT NULL CHECK (url_scope IN ('read', 'download')),
    expires_at          TIMESTAMPTZ NOT NULL,
    issued_to           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_signed_url_tokens_expires ON signed_url_tokens (expires_at);
CREATE INDEX IF NOT EXISTS idx_signed_url_tokens_issued_to ON signed_url_tokens (issued_to);
