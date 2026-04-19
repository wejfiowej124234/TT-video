-- P-SCALE1：信任增长外部化服务 — 多实例共享 Postgres，聚合 + 运行时权重全局一致
-- 环境维度：TRUST_GROWTH_ENV（默认 default），用于 staging/prod 隔离；数仓可按 environment 汇总

CREATE TABLE IF NOT EXISTS trust_growth_variant_metrics (
    id BIGSERIAL PRIMARY KEY,
    environment TEXT NOT NULL DEFAULT 'default',
    moment TEXT NOT NULL,
    variant_id TEXT NOT NULL,
    view_count BIGINT NOT NULL DEFAULT 0,
    trust_hub_click_count BIGINT NOT NULL DEFAULT 0,
    dismiss_count BIGINT NOT NULL DEFAULT 0,
    details_toggle_open_count BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (environment, moment, variant_id)
);

CREATE INDEX IF NOT EXISTS idx_trust_growth_metrics_env_moment
    ON trust_growth_variant_metrics (environment, moment);

CREATE TABLE IF NOT EXISTS trust_growth_runtime_state (
    environment TEXT PRIMARY KEY,
    moments_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    autopilot_generation BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
