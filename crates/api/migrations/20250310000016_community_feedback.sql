-- 55-S10 / 54-S19：社区反馈/建议（用户与官方沟通）
-- GET|POST /api/v1/community/feedback

CREATE TABLE IF NOT EXISTS community_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category        TEXT NOT NULL DEFAULT 'other',
    content         TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'open',
    official_reply  TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_community_feedback_user ON community_feedback (user_id);
CREATE INDEX IF NOT EXISTS idx_community_feedback_created ON community_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_feedback_status ON community_feedback (status);
