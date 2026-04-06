-- 70 管理员高危写操作审批基线：admin_approval_requests（角色变更申请/批准）

CREATE TABLE IF NOT EXISTS admin_approval_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action          TEXT NOT NULL,
    resource_type   TEXT NOT NULL,
    resource_id     TEXT NOT NULL,
    requested_by    UUID NOT NULL,
    approved_by     UUID,
    status          TEXT NOT NULL DEFAULT 'pending', -- pending|approved|rejected|cancelled
    reason          TEXT,
    approve_reason  TEXT,
    before_payload  JSONB NOT NULL DEFAULT '{}'::jsonb,
    after_payload   JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    approved_at     TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_status_created
    ON admin_approval_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_resource
    ON admin_approval_requests (resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_approval_requests_requested_by
    ON admin_approval_requests (requested_by, created_at DESC);
