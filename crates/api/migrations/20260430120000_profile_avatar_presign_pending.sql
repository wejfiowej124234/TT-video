-- 头像对象存储预签名审计：便于对账「已签发 URL 但未写入 users.avatar_url」的孤儿对象（运维可按 created_at 清理）。
CREATE TABLE IF NOT EXISTS profile_avatar_presign_pending (
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    avatar_url TEXT NOT NULL,
    object_key TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT profile_avatar_presign_pending_avatar_url_key UNIQUE (avatar_url)
);

CREATE INDEX IF NOT EXISTS idx_profile_avatar_presign_pending_user_created
    ON profile_avatar_presign_pending (user_id, created_at DESC);
