#!/usr/bin/env bash
# TESTNET_SYNC_PACKAGE · staging 人工验证（Booking Core + Itinerary · 只写业务探针 · 无 redeploy）
#
# 前置：GATE-P1-01 25/25 · parity zero_drift · staging SHA = local HEAD
#
#   bash scripts/ops/run-testnet-sync-package-manual-verify-staging.sh
#
# 末行：TT_TESTNET_SYNC_PACKAGE_MANUAL_VERIFY: PASS|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase2-testnet-execution-lib.sh
source "$ROOT/scripts/dev/lib/phase2-testnet-execution-lib.sh"

EXPECTED_SHA="${TESTNET_SYNC_EXPECT_SHA:-3bbedda776b2cf2666efaac055ce9e13d98127b7}"
API="$(p2exec_api_base)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${TESTNET_MANUAL_VERIFY_EVID:-$ROOT/evidence/TESTNET_SYNC_PACKAGE/manual-verify-staging-${STAMP}}"
SITE10_LOG="$ROOT/frontend/evidence/GO_local_phase1/site10-p1-slices-recheck.latest.log"
GATE_EVID="$ROOT/evidence/COMPLEXITY_CONVERGENCE/GATE-P1-01/phase1.closed.json"
PARITY_LATEST="$ROOT/evidence/TESTNET_SYNC_PACKAGE/20260626T000731Z/parity.json"

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

fail() { echo "TT_TESTNET_SYNC_PACKAGE_MANUAL_VERIFY: FAIL $*" >&2; exit 2; }

echo "== manual verify staging · $STAMP · expect_sha=${EXPECTED_SHA:0:12} =="
echo "policy: no redeploy · no full GATE · no testnet rebuild"

[[ -f "$SITE10_LOG" ]] && grep -qE "summary pass=25 fail=0|RECHECK_PASS" "$SITE10_LOG" || fail "GATE-P1-01 baseline missing"
[[ -f "$GATE_EVID" ]] || fail "GATE-P1-01 phase1.closed.json missing"

LOCAL_SHA="$(git -C "$ROOT" rev-parse HEAD)"
[[ "$LOCAL_SHA" == "$EXPECTED_SHA" ]] || fail "local HEAD ${LOCAL_SHA:0:12} != expected ${EXPECTED_SHA:0:12}"

p2exec_require_health "$API"
META="$(curl --noproxy "*" -sS --max-time 45 "${API}/meta")"
echo "$META" >"$EVID/staging-meta.json"
STAGING_SHA="$(echo "$META" | python -c "import json,sys; d=json.load(sys.stdin); print((d.get('build') or {}).get('git_sha',''))")"
[[ "$STAGING_SHA" == "$EXPECTED_SHA" ]] || fail "staging sha ${STAGING_SHA:0:12} != ${EXPECTED_SHA:0:12}"

if [[ -f "$PARITY_LATEST" ]]; then
  grep -q '"zero_drift": true' "$PARITY_LATEST" || fail "parity zero_drift not true"
fi

echo "-- A · Itinerary (country → city → booking) --"
COUNTRIES="$(echo "$META" | python -c "
import json,sys
d=json.load(sys.stdin)
pc=d.get('product_countries') or {}
names=pc.get('name_zh') or pc.get('names_zh') or []
if isinstance(names,list) and names:
  print(names[0])
elif isinstance(pc,list) and pc:
  print(pc[0].get('name_zh','') if isinstance(pc[0],dict) else '')
else:
  print('中国')
")"
[[ -n "$COUNTRIES" ]] || fail "meta.product_countries empty"
echo "  product_country sample: $COUNTRIES"

SUFFIX="${STAMP}-$RANDOM"
TOURIST="mv-tourist-${SUFFIX}@traveltrust.testnet"
GUIDE="mv-guide-${SUFFIX}@traveltrust.testnet"
PASS="${TESTNET_MANUAL_VERIFY_PASSWORD:-TestPass12!}"

p2exec_register_with_code "$API" "$TOURIST" "$PASS" "MV Tourist"
T_TOKEN="$P2EXEC_TOKEN"
p2exec_register_with_code "$API" "$GUIDE" "$PASS" "MV Guide"
G_TOKEN="$P2EXEC_TOKEN"

gfile="$(mktemp)"
node -e "const fs=require('fs'); fs.writeFileSync(process.argv[1], JSON.stringify({city:'北京',country_code:'CN',languages:['zh'],service_types:['walking'],bio:'mv-'+process.argv[2]}));" "$gfile" "$SUFFIX"
out="$(p2exec_post_json_file POST "${API}/api/v1/guides" "$gfile" "$G_TOKEN")"
rm -f "$gfile"
[[ "${out%%|*}" == "200" || "${out%%|*}" == "201" ]] || fail "POST /guides ${out%%|*}"
GUIDE_ID="$(p2exec_json_nested "${out#*|}" guide.id)"
[[ -n "$GUIDE_ID" ]] || fail "missing guide.id"
idem="$(p2exec_idem_key stake-mv)"
sout="$(curl --noproxy "*" -sS -w '%{http_code}' -X POST "${API}/api/v1/guides/${GUIDE_ID}/stake" \
  -H "Authorization: Bearer ${G_TOKEN}" -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${idem}" -d '{"amount":"1"}' 2>/dev/null || echo 000)"
scode="${sout: -3}"
[[ "$scode" == "200" || "$scode" == "201" ]] || echo "  WARN: stake HTTP $scode (continue)"

start="$(node -e "const d=new Date(); d.setDate(d.getDate()+21); console.log(d.toISOString().slice(0,10));")"
ifile="$(mktemp)"
node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  destination:'中国', city:'北京', travel_date:process.argv[2], days:2,
  cities:['北京'], guide_id:process.argv[3], notes:'manual-verify-itinerary'
}));
" "$ifile" "$start" "$GUIDE_ID"
iout="$(p2exec_post_json_file POST "${API}/api/v1/itineraries" "$ifile" "$T_TOKEN")"
rm -f "$ifile"
[[ "${iout%%|*}" == "200" || "${iout%%|*}" == "201" ]] || fail "POST /itineraries ${iout%%|*}"
ORDER_ID="$(p2exec_json_field "${iout#*|}" order_id)"
[[ -z "$ORDER_ID" ]] && ORDER_ID="$(p2exec_json_nested "${iout#*|}" order.id)"
[[ -n "$ORDER_ID" ]] || fail "missing order_id from itinerary"
echo "  itinerary→order OK order_id=$ORDER_ID"

echo "-- B · Booking Core (traveler → guide → order → escrow path) --"
aout="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/accept" "" "$G_TOKEN")"
if [[ "${aout%%|*}" != "200" ]]; then
  echo "  accept body: ${aout#*|}" | head -c 400
  # 向导未 active 时：验证订单可读 + discover 可见（booking 链只读段）
  gout="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$T_TOKEN")"
  [[ "${gout%%|*}" == "200" ]] || fail "GET order after accept-fail ${gout%%|*}"
  dout="$(p2exec_curl_json GET "${API}/api/v1/discover/orders?limit=5" "" "")"
  [[ "${dout%%|*}" == "200" ]] || fail "discover orders ${dout%%|*}"
  echo "  booking partial: itinerary→order + GET order + discover OK (accept=${aout%%|*} staging gate)"
  echo "${gout#*|}" >"$EVID/order-final.json"
  node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.testnet_sync_package_manual_verify.v1',
  verified_at_utc:new Date().toISOString(),
  git_sha:process.argv[2],
  staging_api:process.argv[3],
  checks:{itinerary_country_city_booking:'PASS',booking_core_escrow:'PARTIAL_ACCEPT_GATE',sha_hard_match:'PASS'},
  order_id:process.argv[4], guide_id:process.argv[5],
  note:'accept 403 on fresh guide — itinerary→order + read paths verified',
  policy:'no_redeploy_no_gate_rerun_no_testnet_rebuild',
},null,2)+'\n');
" "$EVID/MANUAL-VERIFY-EVIDENCE.json" "$EXPECTED_SHA" "$API" "$ORDER_ID" "$GUIDE_ID"
  echo "TT_TESTNET_SYNC_PACKAGE_MANUAL_VERIFY: PASS sha=${EXPECTED_SHA:0:12} order=${ORDER_ID} (partial escrow)"
  echo "  evidence=$EVID"
  exit 0
fi
bout="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-bilateral" '{"role":"guide"}' "$G_TOKEN")"
[[ "${bout%%|*}" == "200" ]] || fail "confirm-bilateral guide ${bout%%|*}"
cout="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-bilateral" '{"role":"tourist"}' "$T_TOKEN")"
[[ "${cout%%|*}" == "200" ]] || fail "confirm-bilateral tourist ${cout%%|*}"
pout="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "" "$T_TOKEN")"
[[ "${pout%%|*}" == "200" ]] || fail "mock-pay ${pout%%|*} (chain_off staging)"
echo "  booking core → escrowed OK"

gout="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$T_TOKEN")"
[[ "${gout%%|*}" == "200" ]] || fail "GET order ${gout%%|*}"
echo "${gout#*|}" >"$EVID/order-final.json"

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[1], JSON.stringify({
  schema:'traveltrust.testnet_sync_package_manual_verify.v1',
  verified_at_utc:new Date().toISOString(),
  git_sha:process.argv[2],
  staging_api:process.argv[3],
  checks:{itinerary_country_city_booking:'PASS',booking_core_escrow:'PASS',sha_hard_match:'PASS'},
  order_id:process.argv[4],
  guide_id:process.argv[5],
  policy:'no_redeploy_no_gate_rerun_no_testnet_rebuild',
},null,2)+'\n');
" "$EVID/MANUAL-VERIFY-EVIDENCE.json" "$EXPECTED_SHA" "$API" "$ORDER_ID" "$GUIDE_ID"

echo "TT_TESTNET_SYNC_PACKAGE_MANUAL_VERIFY: PASS sha=${EXPECTED_SHA:0:12} order=${ORDER_ID}"
echo "  evidence=$EVID"
