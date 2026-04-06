-- 治理池与发放记录（04 §3.4、49 G、50-G1）
-- 单行池子；发放记录表供产品定稿后写入

CREATE TABLE IF NOT EXISTS governance_pool (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balance     TEXT,
    currency    TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO governance_pool (id, balance, currency, updated_at)
SELECT gen_random_uuid(), NULL, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM governance_pool LIMIT 1);

CREATE TABLE IF NOT EXISTS governance_reward_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    amount      TEXT NOT NULL,
    currency    TEXT,
    status      TEXT NOT NULL DEFAULT 'completed',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_governance_rewards_user ON governance_reward_records (user_id);
CREATE INDEX IF NOT EXISTS idx_governance_rewards_created ON governance_reward_records (created_at DESC);
