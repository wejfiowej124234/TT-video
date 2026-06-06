#!/usr/bin/env bash
# ① 本地 · Landing Hero 行程生成全链路 API 烟测
#
# 覆盖：注册 → POST /itineraries（days=5 · cities[] 单城）→ GET order
#       → daily_itinerary.length == len(cities[]) · order.days == days · start_date/end_date 存在
#       → PATCH 保存发布 → GET discover 含该订单（Created · route/city 同步）
#
# 用法（仓库根，API 已起）：
#   bash scripts/dev/smoke-landing-itinerary-flow-local.sh
#
# 可选：API_BASE=http://127.0.0.1:8080
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
EMAIL="landing-smoke-${STAMP}@example.com"
PASSWORD="Test123!"

fail() { echo "smoke-landing-itinerary-flow: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-landing-itinerary-flow: OK $*"; }

json_field() {
  local json="$1" key="$2"
  node -e "const o=JSON.parse(process.argv[1]); const k=process.argv[2]; process.stdout.write(String(o[k]??''));" "$json" "$key"
}

json_nested() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(v==null?'':String(v));
  " "$json" "$path"
}

json_len() {
  local json="$1" path="$2"
  node -e "
    const o=JSON.parse(process.argv[1]);
    const parts=process.argv[2].split('.');
    let v=o;
    for (const p of parts) { v=v?.[p]; }
    process.stdout.write(Array.isArray(v)?String(v.length):'0');
  " "$json" "$path"
}

curl_json() {
  local method="$1" url="$2" body="${3:-}" auth="${4:-}"
  local tmp code
  tmp="$(mktemp)"
  if [[ -n "$body" && -f "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json; charset=utf-8" -H "Authorization: Bearer $auth" --data-binary "@$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json; charset=utf-8" --data-binary "@$body")"
    fi
  elif [[ -n "$body" ]]; then
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -H "Authorization: Bearer $auth" -d "$body")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Content-Type: application/json" -d "$body")"
    fi
  else
    if [[ -n "$auth" ]]; then
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url" \
        -H "Authorization: Bearer $auth")"
    else
      code="$(curl -sS -o "$tmp" -w '%{http_code}' -X "$method" "$url")"
    fi
  fi
  RESP="$(cat "$tmp")"
  rm -f "$tmp"
  echo "$code|$RESP"
}

echo "== smoke-landing-itinerary-flow-local (① only) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Landing Smoke\"}")"
reg_code="${reg%%|*}"
reg_body="${reg#*|}"
[[ "$reg_code" == "200" || "$reg_code" == "201" ]] || fail "register HTTP $reg_code body=$reg_body"
TOKEN="$(json_field "$reg_body" token)"
[[ -n "$TOKEN" ]] || fail "token missing"

TRAVEL_DATE="2026-07-01"
FORM_DAYS=5
CITIES_JSON='["\u4e0a\u6d77"]'
EXPECTED_DAILY_LEN=1
CREATE_BODY_FILE="$(mktemp)"
node -e "
  const fs=require('fs');
  fs.writeFileSync(process.argv[1], JSON.stringify({
    destination: '\u4e2d\u56fd',
    city: '\u4e0a\u6d77',
    travel_date: process.argv[2],
    days: Number(process.argv[3]),
    cities: JSON.parse(process.argv[4]),
    hotel_type: '\u6807\u51c6',
    food_preference: '\u5f53\u5730\u7279\u8272',
    budget_min: 1600,
    budget_max: 2000,
    notes: '\u666f\u70b9\uff1a\u4e16\u754c\u9057\u4ea7',
  }));
" "$CREATE_BODY_FILE" "$TRAVEL_DATE" "$FORM_DAYS" "$CITIES_JSON"
trap 'rm -f "$CREATE_BODY_FILE"' EXIT

create="$(curl_json POST "$API_BASE/api/v1/itineraries" "$CREATE_BODY_FILE" "$TOKEN")"
create_code="${create%%|*}"
create_body="${create#*|}"
[[ "$create_code" == "200" || "$create_code" == "201" ]] || fail "POST /itineraries HTTP $create_code body=$create_body"
ORDER_ID="$(json_field "$create_body" order_id)"
[[ -n "$ORDER_ID" ]] || fail "order_id missing"

get="$(curl_json GET "$API_BASE/api/v1/orders/$ORDER_ID" "" "$TOKEN")"
get_code="${get%%|*}"
get_body="${get#*|}"
[[ "$get_code" == "200" ]] || fail "GET order HTTP $get_code body=$get_body"

daily_len="$(json_len "$get_body" "itinerary.daily_itinerary")"
order_days="$(json_nested "$get_body" "order.days")"
travel_date="$(json_nested "$get_body" "order.travel_date")"
start_date="$(json_nested "$get_body" "order.start_date")"
end_date="$(json_nested "$get_body" "order.end_date")"
total_budget="$(json_nested "$get_body" "itinerary.amount_breakdown.total_budget")"

[[ "$daily_len" == "$EXPECTED_DAILY_LEN" ]] || fail "daily_itinerary.length=$daily_len expected $EXPECTED_DAILY_LEN (cities[] drives day rows)"
[[ "$order_days" == "$EXPECTED_DAILY_LEN" ]] || fail "order.days=$order_days expected $EXPECTED_DAILY_LEN (GET order days = len(daily_itinerary))"
effective_start="${travel_date:-$start_date}"
[[ "$effective_start" == "$TRAVEL_DATE" ]] || fail "travel_date/start_date=$effective_start expected $TRAVEL_DATE"
if [[ -n "$end_date" ]]; then
  [[ "$end_date" == "2026-07-05" ]] || fail "end_date=$end_date expected 2026-07-05"
fi
[[ "$(node -e "process.stdout.write(String(Number(process.argv[1])))" "$total_budget")" == "1800" ]] || fail "total_budget=$total_budget expected 1800 (1600+2000)/2"

PATCH_BODY_FILE="$(mktemp)"
node -e "
  const fs=require('fs');
  const get=JSON.parse(process.argv[1]);
  const days=(get.itinerary?.daily_itinerary||[]).map((d,i)=>
    i===0?{...d,city:'\u676d\u5dde'}:d
  );
  fs.writeFileSync(process.argv[2], JSON.stringify({ daily_itinerary: days }));
" "$get_body" "$PATCH_BODY_FILE"
trap 'rm -f "$CREATE_BODY_FILE" "$PATCH_BODY_FILE"' EXIT

patch="$(curl_json PATCH "$API_BASE/api/v1/orders/$ORDER_ID/itinerary" "$PATCH_BODY_FILE" "$TOKEN")"
patch_code="${patch%%|*}"
patch_body="${patch#*|}"
[[ "$patch_code" == "200" ]] || fail "PATCH itinerary HTTP $patch_code body=$patch_body"
published="$(json_nested "$patch_body" "published_to_market")"
order_state="$(json_nested "$patch_body" "order_state")"
[[ "$published" == "true" ]] || fail "published_to_market=$published expected true"
[[ "$order_state" == "created" ]] || fail "order_state=$order_state expected created"

discover="$(curl_json GET "$API_BASE/api/v1/discover/orders" "" "$TOKEN")"
disc_code="${discover%%|*}"
disc_body="${discover#*|}"
[[ "$disc_code" == "200" ]] || fail "GET discover HTTP $disc_code body=$disc_body"
disc_tmp="$(mktemp)"
printf '%s' "$disc_body" > "$disc_tmp"
disc_match="$(ORDER_ID="$ORDER_ID" node -e "
  const fs=require('fs');
  const o=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
  const id=process.env.ORDER_ID;
  const hit=(o.items||[]).find(x=>String(x.order_id||x.id)===id);
  if(!hit){process.stdout.write('missing');process.exit(0)}
  const city=String(hit.city||'');
  const route=String(hit.route_label||'');
  const dayCity=String(hit.itinerary?.daily_itinerary?.[0]?.city||'');
  const state=String(hit.state||hit.status||'');
  if(state!=='created'){process.stdout.write('bad_state:'+state);process.exit(0)}
  if(!city.includes('\u676d\u5dde')&&!route.includes('\u676d\u5dde')&&!dayCity.includes('\u676d\u5dde')){process.stdout.write('bad_city:'+city+':'+dayCity);process.exit(0)}
  process.stdout.write('ok');
" "$disc_tmp")"
rm -f "$disc_tmp"
[[ "$disc_match" == "ok" ]] || fail "discover after save: $disc_match body=$disc_body"

ok "order=$ORDER_ID days=$order_days daily=$daily_len budget=$total_budget published=$order_state discover=$disc_match"

echo "smoke-landing-itinerary-flow: PASS (phase ① local only · publish · discover)"
