#!/usr/bin/env bash
# P0-04 · ① 本地 · Chain B 争议+裁决 API 切片（C2/C3 矩阵账号）
#
#   bash scripts/dev/smoke-order-escrow-dispute-p0-local.sh
#
# 可选：
#   RESTART_API=1          重启 API 并注入 P3_SEED_ARBITRATOR_EMAIL（默认 1）
#   OED_ARBITRATOR_EMAIL=…  裁决员邮箱（须与 API P3_SEED_ARBITRATOR_EMAIL 一致）
#   RESTART_API=0           API 已带正确 P3_SEED_ARBITRATOR_EMAIL 时跳过重启
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/release-seed-guide-slot.sh
source "$ROOT/scripts/dev/lib/release-seed-guide-slot.sh"
# shellcheck source=scripts/dev/lib/local-smoke-preflight.sh
source "$ROOT/scripts/dev/lib/local-smoke-preflight.sh"
local_smoke_load_repo_env

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
RESTART_API="${RESTART_API:-1}"
PASSWORD="Test123!"
TOURIST_EMAIL="${OED_TOURIST_EMAIL:-tourist@test.com}"
GUIDE_EMAIL="${OED_GUIDE_EMAIL:-guide@test.com}"
ARB_EMAIL="${OED_ARBITRATOR_EMAIL:-oed-p0-arbitrator@traveltrust.test}"

fail() { echo "oed-p0-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "oed-p0-smoke: OK $*"; }

# Windows: large JSON bodies must not be passed as node argv (ARG_MAX / "Argument list too long").
json_field() {
  local body="$1" field="$2" tmp
  tmp="$(mktemp)"
  printf '%s' "$body" > "$tmp"
  node -e "const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); process.stdout.write(String(o[process.argv[2]]??''));" "$tmp" "$field"
  rm -f "$tmp"
}

json_nested() {
  local body="$1" path="$2" tmp
  tmp="$(mktemp)"
  printf '%s' "$body" > "$tmp"
  node -e "
    const o=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$tmp" "$path"
  rm -f "$tmp"
}

json_dispute_id_for_order() {
  local body="$1" order_id="$2" tmp
  tmp="$(mktemp)"
  printf '%s' "$body" > "$tmp"
  node -e "
    const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8'));
    const items=Array.isArray(j.items)?j.items:(Array.isArray(j.disputes)?j.disputes:[]);
    const oid=process.argv[2];
    const hit=items.find(d=>(d.order_id||d.orderId||'')===oid) || items[0];
    process.stdout.write(hit?(hit.id||''):'');
  " "$tmp" "$order_id"
  rm -f "$tmp"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

idem_key() {
  node -e "process.stdout.write(require('crypto').randomUUID())"
}

login_or_register_arbitrator() {
  local email="$1" resp code body tok role
  resp="$(curl_json POST "${API_BASE}/auth/register" \
    "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\",\"nickname\":\"oed-p0-arb\"}")"
  code="${resp%%|*}"
  body="${resp#*|}"
  if [[ "$code" == "200" || "$code" == "201" ]]; then
    role="$(json_field "$body" role)"
    tok="$(json_field "$body" token)"
  elif [[ "$code" == "409" ]] || echo "$body" | grep -q 'email_already_registered'; then
    resp="$(curl_json POST "${API_BASE}/auth/login" "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"
    code="${resp%%|*}"
    body="${resp#*|}"
    [[ "$code" == "200" ]] || fail "arb login HTTP $code body=$body"
    role="$(json_field "$body" role)"
    tok="$(json_field "$body" token)"
  else
    fail "arb register HTTP $code body=$body"
  fi
  [[ "$role" == "arbitrator" ]] || fail "expected arbitrator role got $role — restart API with P3_SEED_ARBITRATOR_EMAIL=${email}"
  [[ -n "$tok" ]] || fail "arbitrator token empty"
  echo "$tok"
}

login_token() {
  local email="$1"
  local resp code body
  resp="$(curl_json POST "${API_BASE}/auth/login" "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || fail "login ${email} HTTP $code body=$body"
  json_field "$body" token
}

if [[ "$RESTART_API" == "1" ]]; then
  netstat -ano 2>/dev/null | grep ":8080" | grep LISTENING | awk '{print $5}' | head -1 | xargs -I{} taskkill //F //PID {} 2>/dev/null || true
  sleep 2
  set -a
  [[ -f .env ]] && source .env
  set +a
  export P3_CHAIN_OFF=1
  export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
  export P3_SEED_ARBITRATOR_EMAIL="$ARB_EMAIL"
  nohup bash scripts/dev/start-api-for-playwright.sh > /tmp/oed-p0-api.log 2>&1 &
  for _ in $(seq 1 90); do
    health="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 "${API_BASE}/health" 2>/dev/null || echo 000)"
    [[ "$health" == "200" ]] && break
    sleep 3
  done
fi

echo "== smoke-order-escrow-dispute-p0-local (① · P0-04 API slice) =="
echo "API=${API_BASE} arb=${ARB_EMAIL}"

health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

local_smoke_require_mock_pay_api "$API_BASE"

seed="$(curl_json POST "${API_BASE}/auth/seed-test-accounts" "{}")"
seed_code="${seed%%|*}"
[[ "$seed_code" == "200" || "$seed_code" == "201" || "$seed_code" == "409" ]] || fail "seed HTTP $seed_code"
release_seed_guide_slot "$API_BASE"
ok "seed + release guide slot"

TOURIST_TOKEN="$(login_token "$TOURIST_EMAIL")"
GUIDE_TOKEN="$(login_token "$GUIDE_EMAIL")"
ARB_TOKEN="$(login_or_register_arbitrator "$ARB_EMAIL")"
ok "tokens tourist+guide+arbitrator"

me_resp="$(curl_json GET "${API_BASE}/api/v1/me" "" "$GUIDE_TOKEN")"
[[ "${me_resp%%|*}" == "200" ]] || fail "GET /me guide HTTP ${me_resp%%|*}"
GUIDE_ID="$(json_nested "${me_resp#*|}" "guide.id")"
[[ -n "$GUIDE_ID" ]] || fail "guide.id missing for ${GUIDE_EMAIL}"

AMOUNT="77.${RANDOM}"
CREATE_IDEM="$(idem_key)"
create_resp="$(curl_json POST "${API_BASE}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"${AMOUNT}\",\"currency\":\"USD\"}" "$TOURIST_TOKEN")"
create_code="${create_resp%%|*}"
create_body="${create_resp#*|}"
[[ "$create_code" == "200" || "$create_code" == "201" ]] || fail "POST /orders HTTP $create_code body=$create_body"
ORDER_ID="$(json_nested "$create_body" "order.id")"
[[ -z "$ORDER_ID" ]] && ORDER_ID="$(json_field "$create_body" id)"
[[ -n "$ORDER_ID" ]] || fail "order id missing"
ok "order_id=${ORDER_ID}"

accept_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/accept" "{}" "$GUIDE_TOKEN")"
[[ "${accept_resp%%|*}" == "200" ]] || fail "accept HTTP ${accept_resp%%|*}"

pay_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOURIST_TOKEN")"
pay_code="${pay_resp%%|*}"
pay_body="${pay_resp#*|}"
[[ "$pay_code" == "200" ]] || fail "mock-pay HTTP $pay_code body=$pay_body"
[[ "$(json_nested "$pay_body" "order.status")" == "escrowed" ]] || fail "expected escrowed"
ok "mock-pay → escrowed"

disp_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/dispute" \
  "{\"reason\":\"p0-oed-smoke-$(date +%Y%m%d)\"}" "$TOURIST_TOKEN")"
disp_code="${disp_resp%%|*}"
disp_body="${disp_resp#*|}"
if [[ "$disp_code" == "409" ]] && echo "$disp_body" | grep -q 'dispute_already_open'; then
  ok "dispute already open — reuse"
else
  [[ "$disp_code" == "200" || "$disp_code" == "201" ]] || fail "POST dispute HTTP $disp_code body=$disp_body"
  ok "dispute opened"
fi

list_resp="$(curl_json GET "${API_BASE}/api/v1/disputes" "" "$TOURIST_TOKEN")"
[[ "${list_resp%%|*}" == "200" ]] || fail "GET /disputes HTTP ${list_resp%%|*}"
DISPUTE_ID="$(json_dispute_id_for_order "${list_resp#*|}" "$ORDER_ID")"
[[ -n "$DISPUTE_ID" ]] || fail "dispute_id not found for order ${ORDER_ID}"

resolve_resp="$(curl_json POST "${API_BASE}/api/v1/disputes/${DISPUTE_ID}/resolve" \
  "{\"refund_ratio\":1.0,\"slash_guide\":false}" "$ARB_TOKEN")"
resolve_code="${resolve_resp%%|*}"
resolve_body="${resolve_resp#*|}"
[[ "$resolve_code" == "200" ]] || fail "POST resolve HTTP $resolve_code body=$resolve_body"
[[ "$(json_nested "$resolve_body" "dispute.status")" == "resolved" ]] || fail "expected dispute resolved"
ok "arbitrator resolve → resolved"

detail_resp="$(curl_json GET "${API_BASE}/api/v1/disputes/${DISPUTE_ID}" "" "$TOURIST_TOKEN")"
[[ "${detail_resp%%|*}" == "200" ]] || fail "GET dispute detail HTTP ${detail_resp%%|*}"
[[ "$(json_nested "${detail_resp#*|}" "dispute.status")" == "resolved" ]] || fail "traveler readback not resolved"

echo ""
echo "TT_OED_P0_SMOKE: OK (① local · order=${ORDER_ID} · dispute=${DISPUTE_ID} · arb=${ARB_EMAIL})"
echo "  phase: ① only (mock-pay + chain_off resolve · not ②③ GO)"
exit 0
