-- 修复种子/烟测向导误标 production，以及同一 user 多条 active 向导重复出现在公众 catalog。
-- 与 chain_off::market_public_surface::{is_dev_guide_bio, dedupe_guides_latest_per_user} 同源。

UPDATE guides
SET data_origin = 'test'
WHERE data_origin = 'production'
  AND (
    coalesce(bio, '') ILIKE '%测试向导%'
    OR coalesce(bio, '') ILIKE '%用于联调%'
  );

UPDATE guides g
SET data_origin = 'test'
FROM (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY user_id
           ORDER BY updated_at DESC, created_at DESC
         ) AS rn
  FROM guides
  WHERE status = 'active'
) ranked
WHERE g.id = ranked.id
  AND ranked.rn > 1
  AND g.data_origin = 'production';
