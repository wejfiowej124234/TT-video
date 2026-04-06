-- 250/260 Admin 控制面基线：异步任务队列投影、调度运行记录、配置发布登记（04 §3.5、14）
-- 与真实 NATS/Worker 对接前，表用于审计、手工补跑登记与运维只读。

CREATE TABLE IF NOT EXISTS async_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL DEFAULT 'default',
    job_type TEXT NOT NULL,
    status TEXT NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    max_attempts INT NOT NULL DEFAULT 8,
    last_error TEXT,
    payload_ref TEXT,
    idempotency_key TEXT,
    scheduled_for TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT async_jobs_status_check CHECK (status IN (
        'pending', 'running', 'completed', 'failed', 'dead_letter', 'cancelled'
    ))
);

CREATE INDEX IF NOT EXISTS idx_async_jobs_status_updated ON async_jobs(status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_async_jobs_queue ON async_jobs(queue_name, updated_at DESC);

CREATE TABLE IF NOT EXISTS scheduler_job_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_code TEXT NOT NULL,
    status TEXT NOT NULL,
    trigger_source TEXT NOT NULL DEFAULT 'cron',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT scheduler_job_runs_status_check CHECK (status IN (
        'queued', 'running', 'success', 'failed', 'skipped', 'accepted'
    )),
    CONSTRAINT scheduler_job_runs_trigger_check CHECK (trigger_source IN ('cron', 'manual_rerun', 'system'))
);

CREATE INDEX IF NOT EXISTS idx_scheduler_job_runs_code_created ON scheduler_job_runs(job_code, created_at DESC);

CREATE TABLE IF NOT EXISTS config_releases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    release_key TEXT NOT NULL,
    version_label TEXT NOT NULL,
    status TEXT NOT NULL,
    effective_from TIMESTAMPTZ,
    rolled_back_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT config_releases_status_check CHECK (status IN ('draft', 'published', 'rolled_back'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_config_releases_key_version ON config_releases(release_key, version_label);

INSERT INTO config_releases (release_key, version_label, status, effective_from, notes) VALUES
  ('ssot', 'baseline', 'published', now(), 'seed row for 220 config release ledger; replace in ops workflow')
ON CONFLICT (release_key, version_label) DO NOTHING;
