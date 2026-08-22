-- V65 Enterprise Scale Readiness · admin role_applications list index
-- Supports Guide/Provider admin queues filtered by kind + status + time order.
CREATE INDEX IF NOT EXISTS idx_role_applications_kind_status_submitted
    ON role_applications (kind, status, submitted_at DESC NULLS LAST);
