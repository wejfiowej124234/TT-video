-- 160 / 04 §3.4：举报工单、申诉、推荐快照审计（最小可运行基线）

CREATE TABLE IF NOT EXISTS community_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    target_type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reason_code TEXT NOT NULL,
    details TEXT,
    evidence_ref TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    version INT NOT NULL DEFAULT 1,
    admin_notes TEXT,
    disposition TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_reports_target_type_check CHECK (target_type IN ('post', 'user', 'comment', 'message', 'other')),
    CONSTRAINT community_reports_status_check CHECK (status IN ('open', 'in_review', 'resolved', 'dismissed')),
    CONSTRAINT community_reports_reason_check CHECK (
        reason_code IN ('spam', 'harassment', 'scam', 'illegal', 'hate', 'other')
    )
);

CREATE INDEX IF NOT EXISTS idx_community_reports_reporter ON community_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports (status, created_at DESC);

CREATE TABLE IF NOT EXISTS community_report_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID NOT NULL REFERENCES community_reports (id) ON DELETE CASCADE,
    appellant_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_note TEXT,
    version INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT community_report_appeals_status_check CHECK (status IN ('pending', 'accepted', 'rejected'))
);

CREATE INDEX IF NOT EXISTS idx_community_report_appeals_report ON community_report_appeals (report_id);
CREATE INDEX IF NOT EXISTS idx_community_report_appeals_status ON community_report_appeals (status, created_at DESC);

CREATE TABLE IF NOT EXISTS community_ranking_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_mode TEXT NOT NULL,
    item_count INT NOT NULL DEFAULT 0,
    top_post_ids UUID[] NOT NULL DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT community_ranking_snapshots_mode_check CHECK (feed_mode IN ('hot', 'recommend', 'latest'))
);

CREATE INDEX IF NOT EXISTS idx_community_ranking_snapshots_created ON community_ranking_snapshots (created_at DESC);
