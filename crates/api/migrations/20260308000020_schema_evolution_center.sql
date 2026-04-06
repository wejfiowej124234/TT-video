-- 330 Schema Evolution Center: minimal persistence entities
-- Adds schema version ledger, migration history, rollback ledger,
-- backfill jobs, and dual-write check records.

CREATE TABLE IF NOT EXISTS schema_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version_no TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    migration_id TEXT NOT NULL UNIQUE,
    from_version TEXT,
    to_version TEXT,
    executed_by UUID,
    result TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS migration_rollbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rollback_id TEXT NOT NULL UNIQUE,
    target_version TEXT NOT NULL,
    trigger_reason TEXT,
    result TEXT NOT NULL,
    executed_by UUID,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS backfill_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT NOT NULL UNIQUE,
    scope TEXT NOT NULL,
    progress DOUBLE PRECISION NOT NULL DEFAULT 0,
    error_count BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dual_write_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    check_id TEXT NOT NULL UNIQUE,
    old_digest TEXT,
    new_digest TEXT,
    diff_count BIGINT NOT NULL DEFAULT 0,
    status TEXT NOT NULL,
    checked_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_schema_versions_status ON schema_versions(status);
CREATE INDEX IF NOT EXISTS idx_migration_histories_created_at ON migration_histories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_rollbacks_created_at ON migration_rollbacks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_backfill_jobs_status ON backfill_jobs(status);
CREATE INDEX IF NOT EXISTS idx_dual_write_checks_checked_at ON dual_write_checks(checked_at DESC);
