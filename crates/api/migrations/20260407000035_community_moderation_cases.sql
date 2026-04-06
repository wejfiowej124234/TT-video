-- 160：独立审核工单审计行（与 community_reports 处置联动）

CREATE TABLE IF NOT EXISTS community_moderation_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES community_reports (id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    status_before TEXT NOT NULL,
    status_after TEXT NOT NULL,
    admin_notes_snapshot TEXT,
    disposition_snapshot TEXT,
    penalty_id UUID REFERENCES community_penalties (id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_moderation_cases_report ON community_moderation_cases (report_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_moderation_cases_created ON community_moderation_cases (created_at DESC);
