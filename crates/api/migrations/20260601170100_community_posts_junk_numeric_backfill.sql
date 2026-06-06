-- 回扫：极短纯数字占位帖（非旅行 UGC）标记 test，不进入公众 Feed
UPDATE community_posts
SET data_origin = 'test'
WHERE data_origin = 'production'
  AND body ~ '^[0-9]{1,6}$';
