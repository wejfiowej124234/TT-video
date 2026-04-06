-- 53 阶段：双边确认与评分确认子状态（附录 B、04 登记）
-- sub_status: pending_bilateral | confirmed | rating_pending | rating_confirmed
ALTER TABLE orders ADD COLUMN IF NOT EXISTS sub_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tourist_confirmed BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS guide_confirmed BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_tourist_confirmed BOOLEAN;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rating_guide_confirmed BOOLEAN;
