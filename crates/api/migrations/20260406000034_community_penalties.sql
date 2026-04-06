-- 160 / 04 §3.4：社区处罚落账（可关联举报工单）

CREATE TABLE IF NOT EXISTS community_penalties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES community_reports (id) ON DELETE SET NULL,
    subject_user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    reason TEXT,
    created_by UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_penalties_action_check CHECK (
        action IN ('warn', 'limit_feed', 'mute', 'ban', 'shadow_ban', 'content_remove', 'other')
    ),
    CONSTRAINT community_penalties_status_check CHECK (status IN ('active', 'lifted', 'superseded'))
);

CREATE INDEX IF NOT EXISTS idx_community_penalties_subject ON community_penalties (subject_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_penalties_report ON community_penalties (report_id);
CREATE INDEX IF NOT EXISTS idx_community_penalties_status ON community_penalties (status, created_at DESC);
