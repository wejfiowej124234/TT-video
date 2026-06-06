#!/usr/bin/env bash
# 本地 Phase ② parity / smoke-ab-core-chain：确保 GET /api/v1/guides?city=杭州 至少 1 条 active 向导。
# 与 staging 公众 catalog 一致（production data_origin · 非 @test.com 邮箱）。
#
#   bash scripts/dev/ensure-local-smoke-public-guides.sh
#   API_BASE_URL=http://127.0.0.1:3012 bash scripts/dev/ensure-local-smoke-public-guides.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
API="${API_BASE_URL:-http://127.0.0.1:8080}"
API="${API%/}"
DB="${DATABASE_URL:-postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust}"

city_q="$(python -c "import urllib.parse; print(urllib.parse.quote('杭州'))")"
count="$(curl -sS --max-time 15 "${API}/api/v1/guides?city=${city_q}" | python -c "import json,sys; print(len(json.load(sys.stdin).get('items') or []))" 2>/dev/null || echo 0)"

if [[ "${count:-0}" -ge 1 ]]; then
  echo "ensure-local-smoke-public-guides: OK already ${count} Hangzhou guide(s) on ${API}"
  exit 0
fi

echo "ensure-local-smoke-public-guides: no public Hangzhou guides — inserting production fixture …"

docker exec -i traveltrust-postgres psql -U traveltrust -d traveltrust -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO users (id, email, password_hash, role, kyc_status, nickname, created_at, updated_at)
VALUES (
  'a1111111-1111-4111-8111-111111110001'::uuid,
  'hangzhou.catalog@example.com',
  '$2b$12$placeholderhashforlocalcatalogonly000000000000000000000',
  'guide',
  'none',
  '杭州公众 catalog 夹具',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO guides (
  id, user_id, city, country_code, languages, service_types, bio,
  stake_amount, status, data_origin, created_at, updated_at
)
VALUES (
  'b2222222-2222-4222-8222-222222220001'::uuid,
  'a1111111-1111-4111-8111-111111110001'::uuid,
  '杭州',
  'CN',
  '["zh","en"]'::jsonb,
  '["walking","culture"]'::jsonb,
  '西湖、灵隐与龙井茶乡深度讲解，持证双语向导。',
  '800',
  'active',
  'production',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  city = EXCLUDED.city,
  status = 'active',
  data_origin = 'production',
  bio = EXCLUDED.bio,
  stake_amount = EXCLUDED.stake_amount,
  updated_at = NOW();
SQL

count2="$(curl -sS --max-time 15 "${API}/api/v1/guides?city=${city_q}" | python -c "import json,sys; print(len(json.load(sys.stdin).get('items') or []))" 2>/dev/null || echo 0)"
if [[ "${count2:-0}" -ge 1 ]]; then
  echo "ensure-local-smoke-public-guides: OK ${count2} Hangzhou guide(s) visible on ${API}"
  exit 0
fi

echo "ensure-local-smoke-public-guides: PG row inserted — restarting local API to hydrate memory …"
if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -Command "Get-Process -Name traveltrust-api -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue" || true
  sleep 2
  port="${PORT:-8080}"
  if [[ "$API" == *":3012"* ]]; then port=3012; fi
  (
    cd "$ROOT"
    export DATABASE_URL="$DB" PORT="$port" SEED_TEST_ACCOUNTS=1
    nohup cargo run -p traveltrust-api >>"$ROOT/evidence/.local-api-restart.log" 2>&1 &
  )
  for _ in $(seq 1 90); do
    hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 3 "${API}/health" 2>/dev/null || echo 000)"
    [[ "$hc" == "200" ]] && break
    sleep 2
  done
fi

count3="$(curl -sS --max-time 15 "${API}/api/v1/guides?city=${city_q}" | python -c "import json,sys; print(len(json.load(sys.stdin).get('items') or []))" 2>/dev/null || echo 0)"
if [[ "${count3:-0}" -ge 1 ]]; then
  echo "ensure-local-smoke-public-guides: OK ${count3} Hangzhou guide(s) after API restart on ${API}"
  exit 0
fi

echo "ensure-local-smoke-public-guides: FAIL still no Hangzhou guides (check API PG pool + TRAVELTRUST_PUBLIC_CATALOG_SURFACE)" >&2
exit 2
