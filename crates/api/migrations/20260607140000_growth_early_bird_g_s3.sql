-- G-S3 · Early Bird 注册序号 + 原子计数器

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS growth_registration_rank BIGINT;

CREATE INDEX IF NOT EXISTS idx_users_growth_registration_rank
    ON users (growth_registration_rank)
    WHERE growth_registration_rank IS NOT NULL;

CREATE TABLE IF NOT EXISTS growth_registration_seq (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    next_rank BIGINT NOT NULL DEFAULT 1
);

INSERT INTO growth_registration_seq (id, next_rank)
VALUES (1, 1)
ON CONFLICT (id) DO NOTHING;

-- 与既有用户数量对齐，避免新序号与历史注册冲突
UPDATE growth_registration_seq
SET next_rank = GREATEST(
    next_rank,
    COALESCE((SELECT MAX(growth_registration_rank) FROM users), 0) + 1,
    (SELECT COUNT(*)::bigint FROM users) + 1
)
WHERE id = 1;
