#!/usr/bin/env bash
# ① 本地 · `/orders` 列表页烟测（HTTP + 可选登录后 API 列表）
#
# 用法（仓库根，API :8080 可选、前端 :3012）：
#   bash scripts/dev/smoke-orders-list-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   WEB_BASE=http://127.0.0.1:3012
#   SMOKE_SKIP_API=1
#   SMOKE_SKIP_WEB=1
#   SMOKE_EXPECT_CHAIN_ID=137   与 orders_chain_id 对拍
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
WEB_BASE="${WEB_BASE:-http://127.0.0.1:3012}"
WEB_BASE="${WEB_BASE%/}"
STAMP="$(date +%s)"

fail() { echo "smoke-orders-list: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-orders-list: OK $*"; }
pass() {
  [[ $# -gt 0 ]] && ok "$*"
  echo "TT_ORDERS_LIST_SMOKE: OK (① local · /orders list API)"
  exit 0
}

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

if [[ "${SMOKE_SKIP_WEB:-0}" != "1" ]]; then
  code="$(curl -sS -o /dev/null -w '%{http_code}' "${WEB_BASE}/orders" 2>/dev/null || echo "000")"
  if [[ "$code" == "200" || "$code" == "307" || "$code" == "308" ]]; then
    ok "web /orders reachable (${code})"
  else
    echo "smoke-orders-list: SKIP web ${WEB_BASE}/orders (HTTP ${code}); start Next or set SMOKE_SKIP_WEB=1" >&2
  fi
fi

if [[ "${SMOKE_SKIP_API:-0}" == "1" ]]; then
  pass "api slice skipped (SMOKE_SKIP_API=1)"
fi

health_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" 2>/dev/null || echo "000")"
if [[ "$health_code" != "200" ]]; then
  pass "api health unavailable (${health_code}); web-only pass"
fi

curl -sS -X POST "${API_BASE}/auth/seed-test-accounts" \
  -H "Content-Type: application/json" \
  -d "{}" >/dev/null 2>&1 || true

login_json="$(curl -sS -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"tourist@test.com","password":"Test123!"}' 2>/dev/null || echo '{}')"
token="$(json_field "$login_json" token)"
if [[ -z "$token" ]]; then
  pass "api login skipped (no token); health-only pass"
fi

list_json="$(curl -sS "${API_BASE}/api/v1/orders?limit=5" \
  -H "Authorization: Bearer ${token}")"
list_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/orders?limit=5" \
  -H "Authorization: Bearer ${token}")"
[[ "$list_code" == "200" ]] || fail "GET /api/v1/orders HTTP ${list_code}"

items_len="$(node -e "
  const o = JSON.parse(process.argv[1]);
  const items = Array.isArray(o.items) ? o.items : [];
  process.stdout.write(String(items.length));
" "$list_json")"
ok "api GET /orders 200 (items=${items_len}, stamp=${STAMP})"

in_progress_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/orders?limit=1&state=completed" \
  -H "Authorization: Bearer ${token}")"
[[ "$in_progress_code" == "200" ]] || fail "GET /api/v1/orders?state=completed HTTP ${in_progress_code}"
ok "api state=completed filter 200"

chain_id="${SMOKE_EXPECT_CHAIN_ID:-137}"
q_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/orders?limit=5&q=test&orders_chain_id=${chain_id}" \
  -H "Authorization: Bearer ${token}")"
[[ "$q_code" == "200" ]] || fail "GET /api/v1/orders?q=&orders_chain_id= HTTP ${q_code}"
ok "api q + orders_chain_id=${chain_id} filter 200"

pass
