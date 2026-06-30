#!/usr/bin/env bash
# ① 本地 · GD-L5 向导详情预约链路烟测
#
# 覆盖（与 UI 同源）：
#   重启 API 清空 guide_slot → seed → 释放档期占位
#   tourist@test.com：GET /guides/:id + availability → POST /orders（等同 BookGuideModal → /orders/new?guide_id=）
#   可选 Playwright：/guides/[id] 点击「预约向导」→ 建单
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-guide-detail-booking-local.sh
#
# 可选：
#   RESTART_API=0          不重启 API（已手动重启时）
#   SKIP_PLAYWRIGHT=1      仅 API 链（不跑浏览器）
#   API_BASE=http://127.0.0.1:8080
#   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/release-seed-guide-slot.sh
source "$ROOT/scripts/dev/lib/release-seed-guide-slot.sh"
# shellcheck source=scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh
source "$ROOT/scripts/dev/lib/clear-hangzhou-seed-guide-slots-db.sh"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
RESTART_API="${RESTART_API:-1}"
SKIP_PLAYWRIGHT="${SKIP_PLAYWRIGHT:-0}"
PASSWORD="Test123!"
TOURIST_EMAIL="tourist@test.com"
API_LOG="${TMPDIR:-/tmp}/gd-l5-booking-api-$$.log"
API_PIDFILE="${TMPDIR:-/tmp}/gd-l5-booking-api-$$.pid"

fail() { echo "GD-L5-booking-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "GD-L5-booking-smoke: OK $*"; }

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

kill_api_8080() {
  local pid
  pid="$(netstat -ano 2>/dev/null | grep ':8080' | grep LISTENING | awk '{print $NF}' | head -1 || true)"
  if [[ -n "$pid" ]]; then
    echo "Stopping PID ${pid} on :8080 ..."
    taskkill //F //PID "$pid" 2>/dev/null || true
    sleep 2
  fi
}

wait_api_health() {
  local i
  for i in $(seq 1 90); do
    if curl -sf --max-time 4 "${API_BASE}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 2
  done
  fail "API health timeout (${API_BASE}/health)"
}

start_fresh_api() {
  kill_api_8080
  if [[ -f "$ROOT/.env" ]]; then
    local line
    line="$(grep -E '^DATABASE_URL=' "$ROOT/.env" | head -1 || true)"
    if [[ -n "$line" ]]; then
      export DATABASE_URL="${line#DATABASE_URL=}"
      DATABASE_URL="${DATABASE_URL%$'\r'}"
    fi
  fi
  export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
  export DID_RANK_SEED_MARKET_DEMO="${DID_RANK_SEED_MARKET_DEMO:-1}"
  export PORT=8080
  export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
  export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
  export TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR="${TRAVELTRUST_ALLOW_LOCAL_PROFILE_AVATAR:-1}"
  export TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT="${TRAVELTRUST_ADMIN_CONSOLE_ROLE_DIRECT:-1}"
  echo "Starting traveltrust-api (fresh guide_slot) ..."
  cargo run -p traveltrust-api >"$API_LOG" 2>&1 &
  echo $! >"$API_PIDFILE"
  wait_api_health
  ok "API restarted (pid=$(cat "$API_PIDFILE"), log=$API_LOG)"
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

resolve_bookable_guide_id() {
  local tourist_tok="$1"
  local guide_tok me_resp me_code me_body me_guide_id user_id list_resp list_code list_body
  guide_tok="$(login_token "guide@test.com")"
  [[ -n "$guide_tok" ]] || fail "guide@test.com token empty"
  me_resp="$(curl_json GET "${API_BASE}/api/v1/me" "" "$guide_tok")"
  me_code="${me_resp%%|*}"
  me_body="${me_resp#*|}"
  [[ "$me_code" == "200" ]] || fail "GET /me guide HTTP $me_code"
  me_guide_id="$(json_nested "$me_body" "guide.id")"
  user_id="$(json_nested "$me_body" "user.id")"

  if [[ -n "$me_guide_id" ]]; then
    local probe
    probe="$(curl_json GET "${API_BASE}/api/v1/guides/${me_guide_id}" "" "$tourist_tok")"
    [[ "${probe%%|*}" == "200" ]] && { echo "$me_guide_id"; return 0; }
  fi

  list_resp="$(curl_json GET "${API_BASE}/api/v1/guides?city=%E6%9D%AD%E5%B7%9E&limit=50" "" "$tourist_tok")"
  list_code="${list_resp%%|*}"
  list_body="${list_resp#*|}"
  [[ "$list_code" == "200" ]] || fail "GET /guides list HTTP $list_code"
  local list_tmp
  list_tmp="$(mktemp)"
  printf '%s' "$list_body" > "$list_tmp"
  node -e "
    const items=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')).items||[];
    const uid=process.argv[2];
    const hit=items.find(g=>String(g.user_id||'')===uid);
    if(hit?.id){ process.stdout.write(String(hit.id)); process.exit(0); }
    const active=items.find(g=>String(g.status||'active')==='active');
    if(active?.id){ process.stdout.write(String(active.id)); process.exit(0); }
    process.exit(1);
  " "$list_tmp" "$user_id" || fail "no bookable guide in /guides list"
  rm -f "$list_tmp"
}

cleanup_api() {
  if [[ "${RESTART_API}" != "1" ]]; then
    return 0
  fi
  if [[ -f "$API_PIDFILE" ]]; then
    local pid
    pid="$(cat "$API_PIDFILE" 2>/dev/null || true)"
    if [[ -n "$pid" ]]; then
      taskkill //F //PID "$pid" 2>/dev/null || true
    fi
    rm -f "$API_PIDFILE"
  fi
}
trap cleanup_api EXIT

echo "== GD-L5 guide-detail booking smoke (① only) API=${API_BASE} =="

if [[ "$RESTART_API" == "1" ]]; then
  clear_hangzhou_seed_guide_slots_db
  ok "DB slot clear before API restart"
  start_fresh_api
elif [[ "${CLEAR_SEED_GUIDE_SLOTS_DB:-}" == "1" ]]; then
  clear_hangzhou_seed_guide_slots_db
  ok "DB slot clear (CLEAR_SEED_GUIDE_SLOTS_DB=1; restart API to reload guide_slot)"
else
  health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || true)"
  [[ "$health" == "200" ]] || fail "API /health not 200 (got $health); set RESTART_API=1"
fi

seed="$(curl_json POST "${API_BASE}/auth/seed-test-accounts" "{}")"
seed_code="${seed%%|*}"
[[ "$seed_code" == "200" || "$seed_code" == "201" || "$seed_code" == "409" ]] || fail "seed-test-accounts HTTP $seed_code"

release_seed_guide_slot "$API_BASE"
ok "seed + release guide_slot"

TOURIST_TOKEN="$(login_token "$TOURIST_EMAIL")"
[[ -n "$TOURIST_TOKEN" ]] || fail "tourist token empty"

GUIDE_ID="$(resolve_bookable_guide_id "$TOURIST_TOKEN")"
[[ -n "$GUIDE_ID" ]] || fail "no resolvable bookable guide_id"
ok "guide_id=$GUIDE_ID (GET /guides/:id reachable)"
detail="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}" "" "$TOURIST_TOKEN")"
d_code="${detail%%|*}"
d_body="${detail#*|}"
[[ "$d_code" == "200" ]] || fail "GET /guides/:id HTTP $d_code body=$d_body"
[[ "$(json_nested "$d_body" "guide.id")" == "$GUIDE_ID" ]] || fail "guide detail id mismatch"
ok "GET /guides/:id (detail page data)"

avail="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$TOURIST_TOKEN")"
a_code="${avail%%|*}"
a_body="${avail#*|}"
[[ "$a_code" == "200" ]] || fail "GET availability HTTP $a_code"
ok "GET /guides/:id/availability"

if [[ "$SKIP_PLAYWRIGHT" != "1" ]]; then
  fe_code="$(curl -sS -o /dev/null -w '%{http_code}' "${PLAYWRIGHT_BASE_URL}/" 2>/dev/null || echo "000")"
  if [[ "$fe_code" != "200" && "$fe_code" != "307" && "$fe_code" != "308" ]]; then
    echo "GD-L5-booking-smoke: SKIP Playwright (frontend not on ${PLAYWRIGHT_BASE_URL}, HTTP $fe_code)"
  else
    echo "== GD-L5 Playwright b469 (before API POST /orders · avoid guide slot busy) =="
    cd "$ROOT/frontend"
    PLAYWRIGHT_API_BASE_URL="$API_BASE" \
    PLAYWRIGHT_API_HEALTH_URL="${API_BASE}/health" \
    PLAYWRIGHT_BASE_URL="$PLAYWRIGHT_BASE_URL" \
      npx playwright test e2e/b469-guides-drawer-booking-convergence.spec.ts \
        --project=chromium \
        --grep "/guides/\\[id\\].*预约按钮" \
        --workers=1 || fail "Playwright GD-L5 booking spec"
    ok "Playwright /guides/[id] → BookGuideModal → escrow (GD-L5-P3)"
    cd "$ROOT"
    release_seed_guide_slot "$API_BASE"
  fi
fi

AMOUNT="62.${RANDOM}"
IDEM="$(node -e "process.stdout.write(require('crypto').randomUUID())")"
create_code="$(curl -sS -o /tmp/gd-l5-order.json -w '%{http_code}' -X POST "${API_BASE}/api/v1/orders" \
  -H "Authorization: Bearer ${TOURIST_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${IDEM}" \
  -d "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"${AMOUNT}\",\"currency\":\"USD\"}")"
create_body="$(cat /tmp/gd-l5-order.json)"
rm -f /tmp/gd-l5-order.json
[[ "$create_code" == "200" || "$create_code" == "201" ]] || fail "POST /orders HTTP $create_code body=$create_body"
ORDER_ID="$(json_nested "$create_body" "order.id")"
[[ -n "$ORDER_ID" ]] || ORDER_ID="$(json_field "$create_body" id)"
[[ -n "$ORDER_ID" ]] || fail "order id missing in response"
ok "POST /orders order_id=$ORDER_ID amount=$AMOUNT (BookGuideModal → /orders/new?guide_id= parity)"

echo "  UI deep link: ${PLAYWRIGHT_BASE_URL}/guides/${GUIDE_ID}"
echo "  UI orders/new: ${PLAYWRIGHT_BASE_URL}/orders/new?guide_id=${GUIDE_ID}"

echo ""
echo "TT_GD_L5_BOOKING_SMOKE: OK (① local · tourist@test.com · guide=${GUIDE_ID} · order=${ORDER_ID})"
echo "  phase: ① only (not ② testnet GO)"
exit 0
