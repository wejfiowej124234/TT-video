#!/usr/bin/env bash
# ① 本地 · itinerary-date-as-source：忙档向导不可接新单（API + 档期矩阵）
#
# 用法（仓库根，API 已起）：
#   bash scripts/dev/smoke-itinerary-date-as-source-busy-guide-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/release-seed-guide-slot.sh
source "$ROOT/scripts/dev/lib/release-seed-guide-slot.sh"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
PASSWORD="Test123!"
GUIDE_EMAIL="${GUIDE_EMAIL:-tg_guide_main@trustgate-e2e.local}"
GUIDE_ID="${GUIDE_ID:-f0e0b101-0001-4001-8001-000000000001}"

fail() { echo "smoke-itinerary-date-busy: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-itinerary-date-busy: OK $*"; }

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
}

json_nested() {
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$1" "$2"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" ]]; then
    if [[ -f "$body" ]]; then
      if [[ -n "$auth" ]]; then
        code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
          -H "Content-Type: application/json; charset=utf-8" -H "Authorization: Bearer $auth" --data-binary "@$body")"
      else
        code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
          -H "Content-Type: application/json; charset=utf-8" --data-binary "@$body")"
      fi
    elif [[ -n "$auth" ]]; then
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

future_trip() {
  node -e "
    const d=new Date();
    d.setDate(d.getDate()+21);
    const y=d.getFullYear();
    const m=String(d.getMonth()+1).padStart(2,'0');
    const day=String(d.getDate()).padStart(2,'0');
    const start=\`\${y}-\${m}-\${day}\`;
    d.setDate(d.getDate()+3);
    const y2=d.getFullYear();
    const m2=String(d.getMonth()+1).padStart(2,'0');
    const day2=String(d.getDate()).padStart(2,'0');
    const end=\`\${y2}-\${m2}-\${day2}\`;
    process.stdout.write(start+'|'+end);
  "
}

login_token() {
  local email="$1"
  local resp code body
  resp="$(curl_json POST "${API_BASE}/auth/login" "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || fail "login ${email} HTTP $code"
  json_field "$body" token
}

echo "== smoke-itinerary-date-as-source-busy-guide (①) API=${API_BASE} =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

curl_json POST "${API_BASE}/auth/seed-test-accounts" "{}" >/dev/null || true
release_seed_guide_slot "$API_BASE"

STAMP="$(date +%s)"
TOURIST1_EMAIL="ids-busy-t1-${STAMP}@example.com"
TOURIST2_EMAIL="ids-busy-t2-${STAMP}@example.com"

reg1="$(curl_json POST "${API_BASE}/auth/register" "{\"email\":\"${TOURIST1_EMAIL}\",\"password\":\"${PASSWORD}\",\"nickname\":\"IDS Busy 1\"}")"
[[ "${reg1%%|*}" == "200" || "${reg1%%|*}" == "201" ]] || fail "register t1"
T1="$(json_field "${reg1#*|}" token)"

reg2="$(curl_json POST "${API_BASE}/auth/register" "{\"email\":\"${TOURIST2_EMAIL}\",\"password\":\"${PASSWORD}\",\"nickname\":\"IDS Busy 2\"}")"
[[ "${reg2%%|*}" == "200" || "${reg2%%|*}" == "201" ]] || fail "register t2"
T2="$(json_field "${reg2#*|}" token)"

GUIDE_TOKEN="$(login_token "$GUIDE_EMAIL")"
[[ -n "$GUIDE_TOKEN" ]] || fail "guide token empty"

TRIP="$(future_trip)"
START="${TRIP%%|*}"
END="${TRIP#*|}"

# 占用向导档期：订单1 accept
IDEM="$(node -e "process.stdout.write(require('crypto').randomUUID())")"
occupy="$(curl_json POST "${API_BASE}/api/v1/orders" \
  "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"90.01\",\"currency\":\"USD\",\"start_date\":\"${START}\",\"end_date\":\"${END}\"}" \
  "$T1")"
[[ "${occupy%%|*}" == "200" || "${occupy%%|*}" == "201" ]] || fail "POST occupy order ${occupy#*|}"
ORDER_BUSY="$(json_nested "${occupy#*|}" "order.id")"
[[ -n "$ORDER_BUSY" ]] || fail "occupy order id missing"

accept="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_BUSY}/accept" "{}" "$GUIDE_TOKEN")"
[[ "${accept%%|*}" == "200" ]] || fail "accept occupy ${accept#*|}"

avail="$(curl_json GET "${API_BASE}/api/v1/guides/${GUIDE_ID}/availability" "" "$T1")"
[[ "${avail%%|*}" == "200" ]] || fail "GET availability"
node -e "
  const ranges=JSON.parse(process.argv[1]).occupied_ranges||[];
  if(!Array.isArray(ranges)||ranges.length<1) process.exit(1);
" "${avail#*|}" || fail "occupied_ranges empty after accept"

# 旅客2：行程优先订单（travel_date + days）→ PATCH guide 应 409
ITIN_BODY_FILE="$(mktemp)"
node -e "
  const fs=require('fs');
  fs.writeFileSync(process.argv[1], JSON.stringify({
    destination: '\u4e2d\u56fd',
    city: '\u676d\u5dde',
    travel_date: process.argv[2],
    days: 4,
    cities: ['\u676d\u5dde'],
    hotel_type: '\u6807\u51c6',
    food_preference: '\u5f53\u5730\u7279\u8272',
    budget_min: 1600,
    budget_max: 2000,
    notes: '\u666f\u70b9\uff1a\u4e16\u754c\u9057\u4ea7',
  }));
" "$ITIN_BODY_FILE" "$START"
itin="$(curl_json POST "${API_BASE}/api/v1/itineraries" "$ITIN_BODY_FILE" "$T2")"
rm -f "$ITIN_BODY_FILE"
itin_code="${itin%%|*}"
itin_body="${itin#*|}"
[[ "$itin_code" == "200" || "$itin_code" == "201" ]] || fail "POST itineraries t2 HTTP $itin_code body=$itin_body"
ORDER2="$(json_field "${itin#*|}" order_id)"
[[ -n "$ORDER2" ]] || fail "order2 id missing"

pub="$(curl_json PATCH "${API_BASE}/api/v1/orders/${ORDER2}/itinerary" "{}" "$T2")"
[[ "${pub%%|*}" == "200" ]] || fail "publish order2"

bind="$(curl_json PATCH "${API_BASE}/api/v1/orders/${ORDER2}/guide" "{\"guide_id\":\"${GUIDE_ID}\"}" "$T2")"
bind_code="${bind%%|*}"
[[ "$bind_code" == "409" ]] || fail "expected 409 guide_has_active_order got HTTP $bind_code body=${bind#*|}"

ok "guide=${GUIDE_ID} occupied · second bind HTTP 409 (itinerary-date-as-source busy gate)"
echo "TT_ITINERARY_DATE_AS_SOURCE_BUSY_GUIDE_SMOKE: OK (① local · occupied_ranges + PATCH 409)"
exit 0
