-- 55-S1：Draft 订单（自定义行程）无向导时 guide_id 可空，便于落库
-- 自定义行程创建时 guide_id = nil，此前 NOT NULL 导致 upsert 外键失败

ALTER TABLE orders ALTER COLUMN guide_id DROP NOT NULL;
