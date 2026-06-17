#!/usr/bin/env bash
# Phase ② · Testnet Execution Sprint — staging API 全链（注册→评价）
#
#   STAGING_API_BASE=https://tt-api-staging.fly.dev \
#   P2EXEC_EVID_ROOT=evidence/GO_phase2_testnet_execution_sprint/steps \
#     bash scripts/dev/smoke-phase2-testnet-execution-sprint.sh
#
# 诚实边界：订单支付步为 chain_off mock-pay（② 沙箱）；真 USDC /pay → WEB3-P2-003 另项。
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/phase2-testnet-execution-lib.sh
source "$ROOT/scripts/dev/lib/phase2-testnet-execution-lib.sh"

API="$(p2exec_api_base)"
STAMP="$(date +%s)"
SUFFIX="${STAMP}-$RANDOM"
TOURIST_EMAIL="p2exec-tourist-${SUFFIX}@traveltrust.testnet"
GUIDE_EMAIL="p2exec-guide-${SUFFIX}@traveltrust.testnet"
PASSWORD="${P2EXEC_PASSWORD:-TestPass12!}"
EVID_ROOT="${P2EXEC_EVID_ROOT:-$ROOT/frontend/evidence/GO_phase2_testnet_execution_sprint/steps-${STAMP}}"

ORDER_ID=""
GUIDE_ROW_ID=""
TOURIST_TOKEN=""
GUIDE_TOKEN=""
ITIN_VERSION="1"

step_dir() { echo "${EVID_ROOT}/$1"; }

run_step() {
  local id="$1" title="$2"
  shift 2
  local dir
  dir="$(step_dir "$id")"
  mkdir -p "$dir"
  echo ""
  echo "== ${id} · ${title} =="
  if "$@"; then
    p2exec_write_step_evidence "$dir" "$id" "PASS" "$title"
    echo "TT_P2EXEC_STEP_${id}: OK" | tee -a "$dir/run.log"
  else
    p2exec_write_step_evidence "$dir" "$id" "FAIL" "$title"
    echo "TT_P2EXEC_STEP_${id}: FAIL" | tee -a "$dir/run.log"
    exit 1
  fi
}

s01_register() {
  p2exec_require_health "$API"
  p2exec_register_with_code "$API" "$TOURIST_EMAIL" "$PASSWORD" "P2Exec Tourist"
  TOURIST_TOKEN="$P2EXEC_TOKEN"
  p2exec_register_with_code "$API" "$GUIDE_EMAIL" "$PASSWORD" "P2Exec Guide"
  GUIDE_TOKEN="$P2EXEC_TOKEN"
  local dir
  dir="$(step_dir S01-register)"
  p2exec_save_json "$dir/tourist-register.json" "{\"email\":\"$TOURIST_EMAIL\",\"user_id\":\"$P2EXEC_USER_ID\"}"
  p2exec_write_rollback_md "$dir/rollback.md" "S01 register" \
    "- **Probe:** \`GET /api/v1/me\` without Bearer → 401 login_required (verified post-step).\\n- **Rollback:** no PG user delete in sprint; staging cohort emails isolated (@traveltrust.testnet)."
  local anon
  anon="$(p2exec_curl_json GET "${API}/api/v1/me" "" "")"
  [[ "${anon%%|*}" == "401" ]] || p2exec_fail "rollback probe: anonymous /me expected 401"
  p2exec_ok "registered tourist+guide"
}

s02_guide_onboard() {
  local idem dir out code body gfile
  gfile="$(mktemp)"
  node -e "const fs=require('fs'); fs.writeFileSync(process.argv[1], JSON.stringify({city:'\\u5317\\u4eac',country_code:'CN',languages:['zh'],service_types:['walking'],bio:'p2exec-'+process.argv[2]}));" "$gfile" "$SUFFIX"
  out="$(p2exec_post_json_file POST "${API}/api/v1/guides" "$gfile" "$GUIDE_TOKEN")"
  rm -f "$gfile"
  code="${out%%|*}"; body="${out#*|}"
  [[ "$code" == "200" || "$code" == "201" ]] || p2exec_fail "POST /guides HTTP $code body=$body"
  GUIDE_ROW_ID="$(p2exec_json_nested "$body" guide.id)"
  [[ -n "$GUIDE_ROW_ID" ]] || p2exec_fail "missing guide.id"
  idem="$(p2exec_idem_key stake)"
  out="$(curl --noproxy "*" -sS -w '%{http_code}' -X POST "${API}/api/v1/guides/${GUIDE_ROW_ID}/stake" \
    -H "Authorization: Bearer ${GUIDE_TOKEN}" -H "Content-Type: application/json" \
    -H "Idempotency-Key: ${idem}" -d '{"amount":"1"}')"
  code="${out: -3}"
  [[ "$code" == "200" || "$code" == "201" ]] || p2exec_fail "POST stake HTTP $code"
  dir="$(step_dir S02-guide-onboard)"
  p2exec_save_json "$dir/guide.json" "$body"
  p2exec_write_rollback_md "$dir/rollback.md" "S02 guide onboard" \
    "- **Probe:** guide row exists on \`GET /me\` for guide token.\\n- **Rollback:** Admin suspend guide / staging DB restore per ops runbook §13."
  p2exec_ok "guide ${GUIDE_ROW_ID} staked"
}

s03_book() {
  local dir create_out code body patch_out start end ifile
  dir="$(step_dir S03-book)"
  start="$(node -e "const d=new Date(); d.setDate(d.getDate()+14); console.log(d.toISOString().slice(0,10));")"
  end="$(node -e "const d=new Date(); d.setDate(d.getDate()+16); console.log(d.toISOString().slice(0,10));")"
  ifile="$(mktemp)"
  node -e "
    const fs=require('fs');
    fs.writeFileSync(process.argv[1], JSON.stringify({
      destination:'\\u4e2d\\u56fd',
      city:'\\u5317\\u4eac',
      travel_date:process.argv[2],
      days:3,
      cities:['\\u5317\\u4eac'],
      hotel_type:'\\u6807\\u51c6',
      food_preference:'\\u5f53\\u5730\\u7279\\u8272',
      budget_min:1600,
      budget_max:2000,
      notes:'p2exec'
    }));
  " "$ifile" "$start"
  create_out="$(p2exec_post_json_file POST "${API}/api/v1/itineraries" "$ifile" "$TOURIST_TOKEN")"
  rm -f "$ifile"
  code="${create_out%%|*}"; body="${create_out#*|}"
  [[ "$code" == "200" || "$code" == "201" ]] || p2exec_fail "POST itineraries HTTP $code body=$body"
  ORDER_ID="$(p2exec_json_field "$body" order_id)"
  [[ -z "$ORDER_ID" ]] && ORDER_ID="$(p2exec_json_nested "$body" order.id)"
  [[ -n "$ORDER_ID" ]] || p2exec_fail "missing order_id"

  local get_out get_body patch_file pub_out
  get_out="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$TOURIST_TOKEN")"
  [[ "${get_out%%|*}" == "200" ]] || p2exec_fail "GET order HTTP ${get_out%%|*}"
  get_body="${get_out#*|}"
  patch_file="$(mktemp)"
  node -e "
    const fs=require('fs');
    const get=JSON.parse(process.argv[1]);
    const days=(get.itinerary?.daily_itinerary||[]).length
      ? get.itinerary.daily_itinerary
      : [{day:1,city:'\\u5317\\u4eac',activities:['p2exec']}];
    fs.writeFileSync(process.argv[2], JSON.stringify({ daily_itinerary: days }));
  " "$get_body" "$patch_file"
  pub_out="$(p2exec_post_json_file PATCH "${API}/api/v1/orders/${ORDER_ID}/itinerary" "$patch_file" "$TOURIST_TOKEN")"
  rm -f "$patch_file"
  [[ "${pub_out%%|*}" == "200" ]] || p2exec_fail "PATCH itinerary publish HTTP ${pub_out%%|*}"
  patch_out="$(curl --noproxy "*" -sS -w '%{http_code}' -X PATCH "${API}/api/v1/orders/${ORDER_ID}/guide" \
    -H "Authorization: Bearer ${TOURIST_TOKEN}" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(p2exec_idem_key bind)" -d "{\"guide_id\":\"${GUIDE_ROW_ID}\"}")"
  code="${patch_out: -3}"
  [[ "$code" == "200" ]] || p2exec_fail "PATCH guide HTTP $code"
  patch_out="$(curl --noproxy "*" -sS -w '%{http_code}' -X PATCH "${API}/api/v1/orders/${ORDER_ID}/trip-dates" \
    -H "Authorization: Bearer ${TOURIST_TOKEN}" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(p2exec_idem_key dates)" -d "{\"start_date\":\"${start}\",\"end_date\":\"${end}\"}")"
  code="${patch_out: -3}"
  if [[ "$code" == "200" ]]; then
    p2exec_ok "trip-dates patched ${start}..${end}"
  elif [[ "$code" == "404" || "$code" == "501" ]]; then
    echo "p2exec: WARN trip-dates HTTP ${code} — using itinerary travel_date from create"
  else
    p2exec_fail "PATCH trip-dates HTTP $code"
  fi
  p2exec_save_json "$dir/order.json" "{\"order_id\":\"$ORDER_ID\",\"start\":\"$start\",\"end\":\"$end\"}"
  p2exec_write_rollback_md "$dir/rollback.md" "S03 book" \
    "- **Probe:** \`POST …/cancel\` by tourist while Created/Accepted → 200.\\n- **Rollback:** cancel order releases guide slot (ops runbook)."
  p2exec_ok "order ${ORDER_ID} published+bound"
}

s04_accept() {
  local out
  out="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/accept" "{}" "$GUIDE_TOKEN")"
  [[ "${out%%|*}" == "200" ]] || p2exec_fail "accept HTTP ${out%%|*}"
  p2exec_write_rollback_md "$(step_dir S04-accept)/rollback.md" "S04 accept" \
    "- **Probe:** duplicate accept → 409 invalid_state.\\n- **Rollback:** tourist \`POST …/cancel\` while Accepted."
  p2exec_ok "guide accepted"
}

s05_bilateral() {
  local out1 out2
  out1="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-bilateral" "{}" "$TOURIST_TOKEN")"
  [[ "${out1%%|*}" == "200" ]] || p2exec_fail "tourist bilateral HTTP ${out1%%|*}"
  out2="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-bilateral" "{}" "$GUIDE_TOKEN")"
  [[ "${out2%%|*}" == "200" ]] || p2exec_fail "guide bilateral HTTP ${out2%%|*}"
  p2exec_write_rollback_md "$(step_dir S05-bilateral)/rollback.md" "S05 bilateral" \
    "- **Probe:** order sub_status confirmed on GET.\\n- **Rollback:** cancel per participant policy (ops runbook §13)."
  p2exec_ok "bilateral both sides"
}

s06_final_plan() {
  local pre out ver
  pre="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}" "" "$TOURIST_TOKEN")"
  [[ "${pre%%|*}" == "200" ]] || p2exec_fail "GET order HTTP ${pre%%|*}"
  ver="$(p2exec_json_nested "${pre#*|}" itinerary.version)"
  [[ -z "$ver" ]] && ver="1"
  ITIN_VERSION="$ver"
  out="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-final-plan" \
    "{\"expected_version\":${ITIN_VERSION}}" "$TOURIST_TOKEN")"
  [[ "${out%%|*}" == "200" ]] || p2exec_fail "confirm-final-plan HTTP ${out%%|*}"
  p2exec_save_json "$(step_dir S06-final-plan)/confirm-final.json" "${out#*|}"
  p2exec_write_rollback_md "$(step_dir S06-final-plan)/rollback.md" "S06 final plan" \
    "- **Probe:** snapshot_hash present on GET order.\\n- **Rollback:** no unconfirm API; dispute/cancel per state machine."
  p2exec_ok "final plan confirmed v${ITIN_VERSION}"
}

s07_payment_sandbox() {
  local out code body
  out="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOURIST_TOKEN")"
  code="${out%%|*}"; body="${out#*|}"
  if [[ "$code" == "501" ]]; then
    p2exec_fail "mock-pay 501 — staging chain_off unavailable; cannot complete ② payment sandbox step"
  fi
  [[ "$code" == "200" ]] || p2exec_fail "mock-pay HTTP $code body=$body"
  [[ "$(p2exec_json_nested "$body" order.status)" == "escrowed" ]] || p2exec_fail "expected escrowed"
  p2exec_save_json "$(step_dir S07-payment-sandbox)/mock-pay.json" "$body"
  p2exec_write_rollback_md "$(step_dir S07-payment-sandbox)/rollback.md" "S07 payment sandbox" \
    "- **Mode:** chain_off \`mock-pay\` on Sepolia-configured staging (**② 沙箱** · **非** ③ Production PSP).\\n- **Probe:** duplicate mock-pay → 409 invalid_state.\\n- **Rollback:** cancel/dispute per escrow state (ops runbook)."
  local dup
  dup="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOURIST_TOKEN")"
  [[ "${dup%%|*}" == "409" ]] || p2exec_fail "rollback probe: dup mock-pay expected 409"
  p2exec_ok "mock-pay → escrowed (② sandbox)"
}

s08_chain_testnet() {
  local sync_out meta_file chain_id escrow_json
  sync_out="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}/chain-sync-status" "" "$TOURIST_TOKEN")"
  [[ "${sync_out%%|*}" == "200" ]] || p2exec_fail "chain-sync-status HTTP ${sync_out%%|*}"
  meta_file="$(mktemp)"
  curl --noproxy "*" -sS -H "Bypass-Tunnel-Reminder: true" "${API}/meta" >"$meta_file"
  chain_id="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); process.stdout.write(String(j.chain?.chain_id??''));" "$meta_file")"
  [[ "$chain_id" == "11155111" ]] || p2exec_fail "expected Sepolia chain_id 11155111 got ${chain_id}"
  escrow_json="$(node -e "const j=JSON.parse(require('fs').readFileSync(process.argv[1],'utf8')); console.log(JSON.stringify(j.chain?.contracts??{}));" "$meta_file")"
  p2exec_save_json "$(step_dir S08-chain-testnet)/chain-sync-status.json" "${sync_out#*|}"
  p2exec_save_json "$(step_dir S08-chain-testnet)/meta-chain.json" \
    "{\"chain_id\":\"$chain_id\",\"contracts\":${escrow_json}}"
  rm -f "$meta_file"
  p2exec_write_rollback_md "$(step_dir S08-chain-testnet)/rollback.md" "S08 chain testnet" \
    "- **Probe:** \`GET /meta\` chain_id=11155111 · contracts deployed on staging.\\n- **On-chain tx:** full createEscrow+deposit is **B-407 / WEB3-P2-003** track; this step verifies **readiness + chain-sync HTTP** on ②.\\n- **Rollback:** pause indexer / revert Fly env per TT-9629 runbook."
  p2exec_ok "Sepolia meta + chain-sync-status 200"
}

s09_complete() {
  local out
  out="$(p2exec_curl_json POST "${API}/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$GUIDE_TOKEN")"
  [[ "${out%%|*}" == "200" ]] || p2exec_fail "confirm-completion HTTP ${out%%|*}"
  p2exec_write_rollback_md "$(step_dir S09-complete)/rollback.md" "S09 complete" \
    "- **Probe:** order state completed on GET.\\n- **Rollback:** no uncomplete; dispute path closed post-completion."
  p2exec_ok "guide confirm completion"
}

s10_review() {
  local out list
  out="$(curl --noproxy "*" -sS -w '%{http_code}' -X POST "${API}/api/v1/orders/${ORDER_ID}/reviews" \
    -H "Authorization: Bearer ${TOURIST_TOKEN}" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(p2exec_idem_key review)" \
    -d "{\"score\":5,\"comment\":\"p2exec-${SUFFIX}\"}")"
  [[ "${out: -3}" == "200" ]] || p2exec_fail "POST review HTTP ${out: -3}"
  list="$(p2exec_curl_json GET "${API}/api/v1/orders/${ORDER_ID}/reviews" "" "$TOURIST_TOKEN")"
  [[ "${list%%|*}" == "200" ]] || p2exec_fail "GET reviews HTTP ${list%%|*}"
  p2exec_save_json "$(step_dir S10-review)/reviews.json" "${list#*|}"
  p2exec_write_rollback_md "$(step_dir S10-review)/rollback.md" "S10 review" \
    "- **Probe:** duplicate review → 409 already_reviewed.\\n- **Rollback:** reviews immutable; Admin moderation per C3 runbook."
  local dup
  dup="$(curl --noproxy "*" -sS -w '%{http_code}' -X POST "${API}/api/v1/orders/${ORDER_ID}/reviews" \
    -H "Authorization: Bearer ${TOURIST_TOKEN}" -H "Content-Type: application/json" \
    -H "Idempotency-Key: $(p2exec_idem_key review2)" \
    -d '{"score":4,"comment":"dup"}')"
  [[ "${dup: -3}" == "409" ]] || p2exec_fail "rollback probe: dup review expected 409"
  p2exec_ok "review submitted + listed"
}

echo "== smoke-phase2-testnet-execution-sprint (② · API=${API}) =="
echo "evidence: ${EVID_ROOT}"

run_step S01-register "真实用户注册" s01_register
run_step S02-guide-onboard "向导入驻+质押" s02_guide_onboard
run_step S03-book "预约/绑定向导/档期" s03_book
run_step S04-accept "向导接单" s04_accept
run_step S05-bilateral "双边确认" s05_bilateral
run_step S06-final-plan "终版 snapshot" s06_final_plan
run_step S07-payment-sandbox "支付沙箱 mock-pay" s07_payment_sandbox
run_step S08-chain-testnet "测试网链就绪+chain-sync" s08_chain_testnet
run_step S09-complete "向导确认完成" s09_complete
run_step S10-review "游客评价" s10_review

cat >"${EVID_ROOT}/SUMMARY.json" <<EOF
{
  "order_id": "${ORDER_ID}",
  "guide_row_id": "${GUIDE_ROW_ID}",
  "tourist_email": "${TOURIST_EMAIL}",
  "guide_email": "${GUIDE_EMAIL}",
  "api_base": "${API}",
  "phase": "② testnet execution sprint"
}
EOF

echo ""
echo "TT_PHASE2_TESTNET_EXECUTION_SPRINT: OK"
echo "  order_id=${ORDER_ID}"
echo "  api=${API}"
echo "  evidence=${EVID_ROOT}"
