-- 社区帖子 enterprise data_origin 分离（与 orders/guides/market_listings 同源）
-- 公众 Feed / 他人主页仅展示 production；E2E/PI-1 自动化帖标记 test。

ALTER TABLE community_posts
    ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'production'
    CHECK (data_origin IN ('production', 'test', 'demo'));

CREATE INDEX IF NOT EXISTS idx_community_posts_public_production_feed
    ON community_posts (created_at DESC)
    WHERE visibility_status = 'public' AND data_origin = 'production';

-- 历史自动化 / 烟测残留
UPDATE community_posts
SET data_origin = 'test'
WHERE data_origin = 'production'
  AND (
    body ~ '^(e2e-|pi1-fe-|browser-minio-)'
    OR user_id IN (
        SELECT id FROM users
        WHERE email IN (
            'tourist@test.com',
            'guide@test.com',
            'provider-did-rank-demo@test.com',
            'steward-did-rank-demo@test.com'
        )
        OR email LIKE '%@traveltrust.test'
    )
  );
