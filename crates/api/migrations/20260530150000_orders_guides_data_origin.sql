-- 企业级测试/演示/生产数据分离：orders · guides（与 market_listings.data_origin 同源）
ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'production'
    CHECK (data_origin IN ('production', 'test', 'demo'));

ALTER TABLE guides
    ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'production'
    CHECK (data_origin IN ('production', 'test', 'demo'));

CREATE INDEX IF NOT EXISTS orders_public_discover_idx
    ON orders (status, data_origin, updated_at DESC);

CREATE INDEX IF NOT EXISTS guides_public_catalog_idx
    ON guides (status, data_origin, updated_at DESC);

-- 烟测 / IT 账号订单
UPDATE orders o
SET data_origin = 'test'
FROM users u
WHERE o.tourist_id = u.id
  AND (
    lower(trim(u.email)) LIKE '%@traveltrust.test'
    OR lower(trim(u.email)) IN (
        'tourist@test.com',
        'guide@test.com',
        'provider-did-rank-demo@test.com',
        'steward-did-rank-demo@test.com'
    )
  );

-- 烟测 / IT 账号向导
UPDATE guides g
SET data_origin = 'test'
FROM users u
WHERE g.user_id = u.id
  AND (
    lower(trim(u.email)) LIKE '%@traveltrust.test'
    OR lower(trim(u.email)) IN (
        'tourist@test.com',
        'guide@test.com',
        'provider-did-rank-demo@test.com',
        'steward-did-rank-demo@test.com'
    )
  );

-- PD-009 履约专用向导 bio（与 chain_off::is_internal_guide_for_travel_booking 同源）
UPDATE guides
SET data_origin = 'demo'
WHERE data_origin = 'production'
  AND (
    coalesce(bio, '') ILIKE '%pd-009 acquisition fulfillment%'
    OR coalesce(bio, '') ILIKE '%auto-provisioned%'
  );
