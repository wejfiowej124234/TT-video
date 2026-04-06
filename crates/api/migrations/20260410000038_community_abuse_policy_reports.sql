-- 160 §3.3：举报频率与「同目标重复举报」阈值（并入 community_abuse_policy 单行）

ALTER TABLE community_abuse_policy
    ADD COLUMN IF NOT EXISTS report_rate_window_sec INT NOT NULL DEFAULT 3600,
    ADD COLUMN IF NOT EXISTS report_max_per_window INT NOT NULL DEFAULT 30,
    ADD COLUMN IF NOT EXISTS report_min_interval_sec INT NOT NULL DEFAULT 15,
    ADD COLUMN IF NOT EXISTS report_duplicate_target_lookback_sec INT NOT NULL DEFAULT 604800;

ALTER TABLE community_abuse_policy DROP CONSTRAINT IF EXISTS chk_report_rw;
ALTER TABLE community_abuse_policy ADD CONSTRAINT chk_report_rw
    CHECK (report_rate_window_sec >= 60 AND report_rate_window_sec <= 2592000);

ALTER TABLE community_abuse_policy DROP CONSTRAINT IF EXISTS chk_report_max;
ALTER TABLE community_abuse_policy ADD CONSTRAINT chk_report_max
    CHECK (report_max_per_window >= 1 AND report_max_per_window <= 500);

ALTER TABLE community_abuse_policy DROP CONSTRAINT IF EXISTS chk_report_minint;
ALTER TABLE community_abuse_policy ADD CONSTRAINT chk_report_minint
    CHECK (report_min_interval_sec >= 0 AND report_min_interval_sec <= 86400);

ALTER TABLE community_abuse_policy DROP CONSTRAINT IF EXISTS chk_report_dup_tgt;
ALTER TABLE community_abuse_policy ADD CONSTRAINT chk_report_dup_tgt
    CHECK (report_duplicate_target_lookback_sec >= 0 AND report_duplicate_target_lookback_sec <= 7776000);

CREATE INDEX IF NOT EXISTS idx_community_reports_reporter_target_created
    ON community_reports (reporter_id, target_type, target_id, created_at DESC);
