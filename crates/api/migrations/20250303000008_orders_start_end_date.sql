-- 48 §7.3 / E3、80 §4.15：订单档期 start_date/end_date，供 Schedule Engine 与 80 落地使用
ALTER TABLE orders ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS end_date DATE;
