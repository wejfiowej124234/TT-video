#!/usr/bin/env bash
# ① 本地 · Escrow 草稿：创建无向导 → 保存发布 → PATCH 绑定向导 → 更换向导（reassign）
#
# 用法（仓库根，API 已起且 P3_CHAIN_OFF=1 或 chain_off 可用）：
#   bash scripts/dev/smoke-escrow-draft-guide-bind-local.sh
#
# 可选：API_BASE=http://127.0.0.1:8080
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
# shellcheck source=scripts/dev/lib/tt-patch-order-assignable-guide.sh
source "$ROOT/scripts/dev/lib/tt-patch-order-assignable-guide.sh"
# shellcheck source=scripts/dev/lib/tt-order-guide-id.sh
source "$ROOT/scripts/dev/lib/tt-order-guide-id.sh"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
TOURIST_EMAIL="escrow-bind-smoke-${STAMP}@example.com"
PASSWORD="Test123!"

fail() { echo "smoke-escrow-draft-guide-bind: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-escrow-draft-guide-bind: OK $*"; }

json_field() {
  node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o[process.argv[2]]??''));" "$1" "$2"
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

echo "== smoke-escrow-draft-guide-bind-local (① only) API=$API_BASE =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "$API_BASE/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health)"

reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$TOURIST_EMAIL\",\"password\":\"$PASSWORD\",\"nickname\":\"Escrow Bind\"}")"
reg_code="${reg%%|*}"
reg_body="${reg#*|}"
[[ "$reg_code" == "200" || "$reg_code" == "201" ]] || fail "register HTTP $reg_code"
TOKEN="$(json_field "$reg_body" token)"
[[ -n "$TOKEN" ]] || fail "token missing"

itin="$(curl_json POST "$API_BASE/api/v1/itineraries" "{\"destination\":\"\u4e2d\u56fd\",\"city\":\"\u4e0a\u6d77\",\"travel_date\":\"2026-09-01\",\"days\":1,\"cities\":[\"\u4e0a\u6d77\"],\"budget_min\":500}" "$TOKEN")"
itin_code="${itin%%|*}"
itin_body="${itin#*|}"
[[ "$itin_code" == "200" ]] || fail "POST itineraries HTTP $itin_code"
ORDER_ID="$(json_field "$itin_body" order_id)"
[[ -n "$ORDER_ID" ]] || fail "order_id missing"

get_after_create="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$TOKEN")"
gac_code="${get_after_create%%|*}"
gac_body="${get_after_create#*|}"
[[ "$gac_code" == "200" ]] || fail "GET order after create HTTP $gac_code"
tt_assert_order_has_no_guide "$gac_body" "after POST /itineraries" || fail "create must not assign guide_id"

save_patch="$(curl_json PATCH "$API_BASE/api/v1/orders/${ORDER_ID}/itinerary" "{\"daily_itinerary\":[{\"day_index\":1,\"city\":\"\u4e0a\u6d77\",\"description\":\"Kyoto cultural walking tour day\"}]}" "$TOKEN")"
sp_code="${save_patch%%|*}"
sp_body="${save_patch#*|}"
[[ "$sp_code" == "200" ]] || fail "PATCH itinerary save HTTP $sp_code body=$sp_body"
[[ "$(json_nested "$sp_body" "published_to_market")" == "true" ]] || fail "published_to_market not true after save"

get_after_save="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$TOKEN")"
gas_code="${get_after_save%%|*}"
gas_body="${get_after_save#*|}"
[[ "$gas_code" == "200" ]] || fail "GET order after save HTTP $gas_code"
tt_assert_order_has_no_guide "$gas_body" "after PATCH save/publish" || fail "save/publish must not assign guide_id"
order_state="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o.order?.state||o.order?.status||''));" "$gas_body")"
[[ "$order_state" == "created" ]] || fail "order state after save=$order_state expected created"

discover="$(curl_json GET "$API_BASE/api/v1/discover/orders" "" "$TOKEN")"
d_code="${discover%%|*}"
d_body="${discover#*|}"
[[ "$d_code" == "200" ]] || fail "GET discover HTTP $d_code"
disc_tmp="$(mktemp)"
printf '%s' "$d_body" > "$disc_tmp"
ORDER_ID="$ORDER_ID" node -e "
  const fs=require('fs');
  const o=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
  const id=process.env.ORDER_ID;
  const items=o.items||[];
  if(!items.some(x=>String(x.id||x.order_id)===id)) process.exit(1);
" "$disc_tmp" || fail "discover missing order after save"
rm -f "$disc_tmp"

guide_reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"escrow-bind-guide-${STAMP}@example.com\",\"password\":\"$PASSWORD\",\"nickname\":\"Escrow Bind Guide\"}")"
gr_code="${guide_reg%%|*}"
gr_body="${guide_reg#*|}"
[[ "$gr_code" == "200" || "$gr_code" == "201" ]] || fail "guide register HTTP $gr_code"
GUIDE_TOKEN="$(json_field "$gr_body" token)"
[[ -n "$GUIDE_TOKEN" ]] || fail "guide token missing"

tt_patch_order_assignable_guide "$API_BASE" "$TOKEN" "$ORDER_ID" "$GUIDE_TOKEN" || fail "PATCH guide — no assignable guide"
GUIDE_ID="$TT_PATCHED_GUIDE_ID"
[[ -n "$GUIDE_ID" ]] || fail "PATCH guide — guide id empty"

get="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$TOKEN")"
get_code="${get%%|*}"
get_body="${get#*|}"
[[ "$get_code" == "200" ]] || fail "GET order HTTP $get_code"
tt_assert_order_has_guide "$get_body" "$GUIDE_ID" "after first PATCH guide" || fail "first bind guide_id mismatch"

guide_reg2="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"escrow-bind-guide2-${STAMP}@example.com\",\"password\":\"$PASSWORD\",\"nickname\":\"Escrow Bind Guide 2\"}")"
gr2_code="${guide_reg2%%|*}"
gr2_body="${guide_reg2#*|}"
[[ "$gr2_code" == "200" || "$gr2_code" == "201" ]] || fail "guide2 register HTTP $gr2_code"
GUIDE2_TOKEN="$(json_field "$gr2_body" token)"
[[ -n "$GUIDE2_TOKEN" ]] || fail "guide2 token missing"

create_g2="$(curl_json POST "$API_BASE/api/v1/guides" "{\"display_name\":\"Escrow Reassign Guide $STAMP\",\"city\":\"Shanghai\",\"country_code\":\"CN\"}" "$GUIDE2_TOKEN")"
cg2_code="${create_g2%%|*}"
cg2_body="${create_g2#*|}"
[[ "$cg2_code" == "200" || "$cg2_code" == "201" ]] || fail "POST guides guide2 HTTP $cg2_code body=$cg2_body"
GUIDE2_ID="$(node -e "const o=JSON.parse(process.argv[1]); process.stdout.write(String(o.guide?.id||o.id||''));" "$cg2_body")"
[[ -n "$GUIDE2_ID" ]] || fail "guide2 id missing"

stake_g2="$(curl_json POST "$API_BASE/api/v1/guides/${GUIDE2_ID}/stake" '{"amount":"100"}' "$GUIDE2_TOKEN")"
sg2_code="${stake_g2%%|*}"
[[ "$sg2_code" == "200" ]] || fail "POST stake guide2 HTTP $sg2_code body=${stake_g2#*|}"

reassign="$(curl_json PATCH "$API_BASE/api/v1/orders/${ORDER_ID}/guide" "{\"guide_id\":\"$GUIDE2_ID\"}" "$TOKEN")"
ra_code="${reassign%%|*}"
ra_body="${reassign#*|}"
[[ "$ra_code" == "200" ]] || fail "PATCH reassign guide HTTP $ra_code body=$ra_body"

get2="$(curl_json GET "$API_BASE/api/v1/orders/${ORDER_ID}" "" "$TOKEN")"
g2_code="${get2%%|*}"
g2_body="${get2#*|}"
[[ "$g2_code" == "200" ]] || fail "GET order after reassign HTTP $g2_code"
tt_assert_order_has_guide "$g2_body" "$GUIDE2_ID" "after reassign PATCH guide" || fail "reassign guide_id mismatch"

ok "order=$ORDER_ID guide1=$GUIDE_ID guide2=$GUIDE2_ID (no guide on create · bind · reassign)"
echo "  UI step2: /escrow/$ORDER_ID — 请选择向导"
echo "  UI step2: /market?view=split&bindGuideToOrder=$ORDER_ID"
echo "smoke-escrow-draft-guide-bind: PASS (phase ① · itinerary-first · guide reassign)"
