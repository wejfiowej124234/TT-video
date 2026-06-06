-- 94 自由市场：企业级测试/演示/生产数据分离（公众 catalog 读面 SSOT）
ALTER TABLE market_listings
    ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'production'
    CHECK (data_origin IN ('production', 'test', 'demo'));

CREATE INDEX IF NOT EXISTS market_listings_public_catalog_idx
    ON market_listings (variant, status, data_origin, updated_at DESC);

-- 烟测 / IT 账号（仍留 DB，公众读面过滤）
UPDATE market_listings ml
SET data_origin = 'test'
FROM users u
WHERE ml.owner_user_id = u.id
  AND (
    lower(trim(u.email)) LIKE '%@traveltrust.test'
    OR lower(trim(u.email)) IN (
        'tourist@test.com',
        'guide@test.com',
        'provider-did-rank-demo@test.com',
        'steward-did-rank-demo@test.com'
    )
  );

-- DID rank demo / smoke 标题（与 chain_off::is_dev_market_listing_payload 同源）
UPDATE market_listings
SET data_origin = 'demo'
WHERE lower(coalesce(payload->>'title', '')) LIKE '%did rank demo%'
   OR lower(coalesce(payload->>'title', '')) LIKE 'demo %'
   OR lower(coalesce(payload->>'title', '')) LIKE '% smoke%'
   OR lower(coalesce(payload->>'title', '')) LIKE '%演示%'
   OR lower(coalesce(payload->>'title', '')) LIKE '%联调%';
