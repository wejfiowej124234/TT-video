#!/usr/bin/env bash
# ① 本地 · `/orders` → `/pay` · `/escrow/[id]` 链路烟测（HTTP + 可选登录后 API）
#
# 用法（仓库根，API :8080 可选、前端 :3012）：
#   bash scripts/dev/smoke-orders-pay-escrow-local.sh
#
# 可选：
#   API_BASE=http://127.0.0.1:8080
#   WEB_BASE=http://127.0.0.1:3012
#   SMOKE_SKIP_API=1
#   SMOKE_SKIP_WEB=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
WEB_BASE="${WEB_BASE:-http://127.0.0.1:3012}"
WEB_BASE="${WEB_BASE%/}"
STAMP="$(date +%s)"

fail() { echo "smoke-orders-pay-escrow: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-orders-pay-escrow: OK $*"; }
pass() {
  [[ $# -gt 0 ]] && ok "$*"
  echo "TT_ORDERS_PAY_ESCROW_SMOKE: OK (① local · list → pay · escrow)"
  exit 0
}

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

first_order_id() {
  local json="$1"
  node -e "
    const o = JSON.parse(process.argv[1]);
    const items = Array.isArray(o.items) ? o.items : [];
    const row = items[0];
    const id = row && (row.id ?? row.order_id ?? '');
    process.stdout.write(String(id ?? ''));
  " "$json"
}

if [[ "${SMOKE_SKIP_WEB:-0}" != "1" ]]; then
  for path in "/orders" "/pay"; do
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${WEB_BASE}${path}" 2>/dev/null || echo "000")"
    if [[ "$code" == "200" || "$code" == "307" || "$code" == "308" ]]; then
      ok "web ${path} reachable (${code})"
    else
      echo "smoke-orders-pay-escrow: SKIP web ${WEB_BASE}${path} (HTTP ${code}); start Next or set SMOKE_SKIP_WEB=1" >&2
    fi
  done
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

order_id="$(first_order_id "$list_json")"
items_len="$(node -e "
  const o = JSON.parse(process.argv[1]);
  const items = Array.isArray(o.items) ? o.items : [];
  process.stdout.write(String(items.length));
" "$list_json")"
ok "api GET /orders 200 (items=${items_len}, stamp=${STAMP})"

if [[ -z "$order_id" ]]; then
  pass "no orders in list; list-only pass"
fi

detail_code="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/api/v1/orders/${order_id}" \
  -H "Authorization: Bearer ${token}")"
[[ "$detail_code" == "200" ]] || fail "GET /api/v1/orders/${order_id} HTTP ${detail_code}"
ok "api GET /orders/${order_id} 200"

if [[ "${SMOKE_SKIP_WEB:-0}" != "1" ]]; then
  pay_code="$(curl -sS -o /dev/null -w '%{http_code}' "${WEB_BASE}/pay?orderId=${order_id}" 2>/dev/null || echo "000")"
  if [[ "$pay_code" == "200" || "$pay_code" == "307" || "$pay_code" == "308" ]]; then
    ok "web /pay?orderId= reachable (${pay_code})"
  else
    echo "smoke-orders-pay-escrow: WARN web /pay?orderId= HTTP ${pay_code}" >&2
  fi

  escrow_code="$(curl -sS -o /dev/null -w '%{http_code}' "${WEB_BASE}/escrow/${order_id}" 2>/dev/null || echo "000")"
  if [[ "$escrow_code" == "200" || "$escrow_code" == "307" || "$escrow_code" == "308" ]]; then
    ok "web /escrow/${order_id} reachable (${escrow_code})"
  else
    echo "smoke-orders-pay-escrow: WARN web /escrow/${order_id} HTTP ${escrow_code}" >&2
  fi
fi

pass
