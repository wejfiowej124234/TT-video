-- 公众 catalog 读面：回填误标 production 的 PD-009 占位向导与 landing mock 北京订单。
-- 与 chain_off::market_public_surface::{is_placeholder_global_guide, is_dev_discover_landing_itinerary} 同源。

UPDATE guides
SET data_origin = 'demo'
WHERE data_origin = 'production'
  AND trim(city) ILIKE 'global'
  AND trim(country_code) ILIKE 'xx';

UPDATE guides
SET data_origin = 'demo'
WHERE data_origin = 'production'
  AND coalesce(bio, '') ILIKE '%pd-009 acquisition fulfillment%';

UPDATE orders o
SET data_origin = 'test'
FROM itineraries i
WHERE i.order_id = o.id
  AND o.data_origin = 'production'
  AND trim(i.destination) = '中国'
  AND trim(i.city) = '北京'
  AND i.days_json::text ILIKE '%当地交通%'
  AND i.days_json::text ILIKE '%当地特色%'
  AND i.days_json::text ILIKE '%天%';
