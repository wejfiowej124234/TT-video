-- 160 §3.3：社区反垃圾/反刷评参数表（单例行，可 SQL 调参；0 表示关闭该项校验）
CREATE TABLE IF NOT EXISTS community_abuse_policy (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    comment_rate_window_sec INT NOT NULL DEFAULT 60,
    comment_max_per_window INT NOT NULL DEFAULT 30,
    comment_min_interval_sec INT NOT NULL DEFAULT 2,
    comment_duplicate_lookback_sec INT NOT NULL DEFAULT 86400,
    post_rate_window_sec INT NOT NULL DEFAULT 600,
    post_max_per_window INT NOT NULL DEFAULT 15,
    post_min_interval_sec INT NOT NULL DEFAULT 5,
    post_duplicate_lookback_sec INT NOT NULL DEFAULT 86400,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_c_rw CHECK (comment_rate_window_sec >= 10 AND comment_rate_window_sec <= 86400),
    CONSTRAINT chk_c_max CHECK (comment_max_per_window >= 1 AND comment_max_per_window <= 2000),
    CONSTRAINT chk_c_minint CHECK (comment_min_interval_sec >= 0 AND comment_min_interval_sec <= 3600),
    CONSTRAINT chk_c_dup CHECK (comment_duplicate_lookback_sec >= 0 AND comment_duplicate_lookback_sec <= 2592000),
    CONSTRAINT chk_p_rw CHECK (post_rate_window_sec >= 60 AND post_rate_window_sec <= 86400),
    CONSTRAINT chk_p_max CHECK (post_max_per_window >= 1 AND post_max_per_window <= 500),
    CONSTRAINT chk_p_minint CHECK (post_min_interval_sec >= 0 AND post_min_interval_sec <= 86400),
    CONSTRAINT chk_p_dup CHECK (post_duplicate_lookback_sec >= 0 AND post_duplicate_lookback_sec <= 2592000)
);

INSERT INTO community_abuse_policy (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_community_comments_user_created ON community_comments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_user_created ON community_posts (user_id, created_at DESC);
