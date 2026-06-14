-- 向导退出申请（① 本地 · G-05/G-06 · 81 §5.3）
-- ② Admin 审核 · 冷却期 · 链上 withdraw 另闸

CREATE TABLE IF NOT EXISTS guide_exit_requests (
    id UUID PRIMARY KEY,
    guide_id UUID NOT NULL REFERENCES guides (id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    reason TEXT,
    requested_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT guide_exit_requests_status_chk CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
    )
);

CREATE INDEX IF NOT EXISTS idx_guide_exit_requests_guide_id
    ON guide_exit_requests (guide_id, requested_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_guide_exit_requests_one_pending_per_guide
    ON guide_exit_requests (guide_id)
    WHERE status = 'pending';
