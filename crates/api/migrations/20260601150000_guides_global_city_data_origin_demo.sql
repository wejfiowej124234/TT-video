-- 任意 city=Global 的向导均标 demo（含 country_code 非 XX 的历史脏行）。
UPDATE guides
SET data_origin = 'demo'
WHERE trim(city) ILIKE 'global'
  AND data_origin = 'production';
