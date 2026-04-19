-- P-OBS1：信任增长可观测与人工控制（冻结权重、强制对照、变体权重上限、generation 轨迹）

CREATE TABLE IF NOT EXISTS trust_growth_control (
    environment TEXT PRIMARY KEY,
    weights_frozen BOOLEAN NOT NULL DEFAULT false,
    force_control_only BOOLEAN NOT NULL DEFAULT false,
    -- 各 variant_id 在归一化后的最大占比上限，例如 {"alt_copy": 0.15} 表示该变体权重不超过 15%
    variant_weight_caps JSONB NOT NULL DEFAULT '{}'::jsonb,
    control_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS trust_growth_generation_history (
    id BIGSERIAL PRIMARY KEY,
    environment TEXT NOT NULL,
    autopilot_generation BIGINT NOT NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tg_gen_hist_env_rec
    ON trust_growth_generation_history (environment, recorded_at DESC);
