#!/usr/bin/env bash
# ① 本地 · Chain B 种子账号全链交易（tourist@test.com + guide@test.com）
#
# API 链：seed → 释放档期 → POST /orders → accept → mock-pay → confirm-completion → review
# 供 start-api-with-seed Step 6o / 人工审核：API 先跑通一笔 completed 订单，再在 UI 核对。
#
# 用法（仓库根 · API 已起）：
#   bash scripts/dev/smoke-seed-tourist-guide-transaction-local.sh
#
# 可选：
#   RESTART_API=0          默认不重启（start-api-with-seed 栈已起）
#   API_BASE=http://127.0.0.1:8080
#   PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012
#   EVID_DIR=evidence/manual-transaction-review
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
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://127.0.0.1:3012}"
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL%/}"
RESTART_API="${RESTART_API:-0}"
PASSWORD="Test123!"
TOURIST_EMAIL="tourist@test.com"
GUIDE_EMAIL="guide@test.com"
EVID_DIR="${EVID_DIR:-$ROOT/evidence/manual-transaction-review}"

fail() { echo "seed-transaction-smoke: FAIL $*" >&2; exit 1; }
ok() { echo "seed-transaction-smoke: OK $*"; }

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

login_token() {
  local email="$1"
  local resp code body
  resp="$(curl_json POST "${API_BASE}/auth/login" "{\"email\":\"${email}\",\"password\":\"${PASSWORD}\"}")"
  code="${resp%%|*}"
  body="${resp#*|}"
  [[ "$code" == "200" ]] || fail "login ${email} HTTP $code body=$body"
  json_field "$body" token
}

resolve_seed_guide_id() {
  local guide_tok me_resp me_code me_body guide_row_id
  guide_tok="$(login_token "$GUIDE_EMAIL")"
  [[ -n "$guide_tok" ]] || fail "${GUIDE_EMAIL} token empty"
  me_resp="$(curl_json GET "${API_BASE}/api/v1/me" "" "$guide_tok")"
  me_code="${me_resp%%|*}"
  me_body="${me_resp#*|}"
  [[ "$me_code" == "200" ]] || fail "GET /me guide HTTP $me_code"
  guide_row_id="$(json_nested "$me_body" "guide.id")"
  [[ -n "$guide_row_id" ]] || fail "${GUIDE_EMAIL} has no guide.id on GET /me (run seed-test-accounts)"
  [[ "$(json_nested "$me_body" "guide.status")" == "active" ]] || fail "${GUIDE_EMAIL} guide.status not active"
  echo "$guide_row_id"
}

print_manual_review_checklist() {
  local order_id="$1" guide_id="$2" amount="$3"
  cat <<EOF

========== 人工审核 · Chain B 种子全链交易（① 本地） ==========
阶段口径：① 本地 mock-pay 沙箱（非 ② 测试网 GO · 非 ③ Production PSP）

账号（先退出再换角色登录）：
  游客  ${TOURIST_EMAIL}  /  ${PASSWORD}
  向导  ${GUIDE_EMAIL}    /  ${PASSWORD}

本笔 API 已闭环订单：
  order_id=${order_id}
  guide_id=${guide_id}
  amount=${amount} USD
  终态：completed + review(score=5)

UI 核对清单（人工勾选）：
  [ ] 游客登录 → ${PLAYWRIGHT_BASE_URL}/orders  可见该单 status=completed
  [ ] 打开 Escrow → ${PLAYWRIGHT_BASE_URL}/escrow/${order_id}  暖色壳 · 无 cyan DID 外露
  [ ] 向导登录 → ${PLAYWRIGHT_BASE_URL}/orders  同单可见 · 接单/完成态一致
  [ ] 市场选向导 UI（可选复测）→ ${PLAYWRIGHT_BASE_URL}/market?view=guides  杭州含 guide@test.com
  [ ] 评价可见（游客视角订单详情或 reviews 区）

勿与 Chain A 混用：tg_guide_main@trustgate-e2e.local 订单与本链无关。
证据：${EVID_DIR}/latest.json
==============================================================

EOF
}

write_evidence() {
  local order_id="$1" guide_id="$2" amount="$3" status="$4"
  mkdir -p "$EVID_DIR"
  node -e "
    const fs=require('fs');
    const p=process.argv[1];
    const j={
      phase:'① local',
      chain:'B',
      tourist_email:process.argv[2],
      guide_email:process.argv[3],
      order_id:process.argv[4],
      guide_id:process.argv[5],
      amount_usd:process.argv[6],
      final_status:process.argv[7],
      api_base:process.argv[8],
      frontend_base:process.argv[9],
      ui_urls:{
        orders_tourist:process.argv[9]+'/orders',
        escrow:process.argv[9]+'/escrow/'+process.argv[4],
        market_guides:process.argv[9]+'/market?view=guides',
        login:process.argv[9]+'/auth/login'
      },
      note:'mock-pay chain_off sandbox; not ② staging GO nor ③ production PSP'
    };
    fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
    fs.writeFileSync(p.replace(/latest\\.json$/,'latest-order-id.txt'), process.argv[4]+'\n');
  " "$EVID_DIR/latest.json" "$TOURIST_EMAIL" "$GUIDE_EMAIL" "$order_id" "$guide_id" "$amount" "$status" "$API_BASE" "$PLAYWRIGHT_BASE_URL"
}

echo "== seed-tourist-guide-transaction smoke (① only) API=${API_BASE} =="

health="$(curl -sS -o /dev/null -w '%{http_code}' "${API_BASE}/health" || true)"
[[ "$health" == "200" ]] || fail "API /health not 200 (got $health); run start-api-with-seed first"

local_smoke_require_mock_pay_api "$API_BASE"

seed="$(curl_json POST "${API_BASE}/auth/seed-test-accounts" "{}")"
seed_code="${seed%%|*}"
[[ "$seed_code" == "200" || "$seed_code" == "201" || "$seed_code" == "409" ]] || fail "seed-test-accounts HTTP $seed_code"
release_seed_guide_slot "$API_BASE"
ok "seed + release guide_slot"

TOURIST_TOKEN="$(login_token "$TOURIST_EMAIL")"
GUIDE_TOKEN="$(login_token "$GUIDE_EMAIL")"
[[ -n "$TOURIST_TOKEN" && -n "$GUIDE_TOKEN" ]] || fail "empty login token"

GUIDE_ID="$(resolve_seed_guide_id)"
[[ -n "$GUIDE_ID" ]] || fail "no guide row id for ${GUIDE_EMAIL}"
ok "guide_id=${GUIDE_ID} (Chain B · ${GUIDE_EMAIL} /me.guide.id)"

AMOUNT="88.${RANDOM}"
CREATE_IDEM="$(idem_key)"
ORDER_TMP="$(mktemp)"
create_code="$(curl -sS -o "$ORDER_TMP" -w '%{http_code}' -X POST "${API_BASE}/api/v1/orders" \
  -H "Authorization: Bearer ${TOURIST_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${CREATE_IDEM}" \
  -d "{\"guide_id\":\"${GUIDE_ID}\",\"amount\":\"${AMOUNT}\",\"currency\":\"USD\"}")"
create_body="$(cat "$ORDER_TMP")"
rm -f "$ORDER_TMP"
[[ "$create_code" == "200" || "$create_code" == "201" ]] || fail "POST /orders HTTP $create_code body=$create_body"
ORDER_ID="$(json_nested "$create_body" "order.id")"
[[ -z "$ORDER_ID" ]] && ORDER_ID="$(json_field "$create_body" id)"
[[ -n "$ORDER_ID" ]] || fail "order id missing"
ok "POST /orders order_id=${ORDER_ID} amount=${AMOUNT}"

accept_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/accept" "{}" "$GUIDE_TOKEN")"
[[ "${accept_resp%%|*}" == "200" ]] || fail "accept HTTP ${accept_resp%%|*} body=${accept_resp#*|}"
ok "guide accepted"

pay_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/mock-pay" "{}" "$TOURIST_TOKEN")"
pay_code="${pay_resp%%|*}"
pay_body="${pay_resp#*|}"
if [[ "$pay_code" == "501" ]]; then
  fail "mock-pay 501 — local chain_off unavailable; check P3_CHAIN_OFF=1 and API hydrate"
fi
[[ "$pay_code" == "200" ]] || fail "mock-pay HTTP $pay_code body=$pay_body"
[[ "$(json_nested "$pay_body" "order.status")" == "escrowed" ]] || fail "expected escrowed after mock-pay"
ok "mock-pay → escrowed (① sandbox)"

complete_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$GUIDE_TOKEN")"
[[ "${complete_resp%%|*}" == "200" ]] || fail "guide confirm-completion HTTP ${complete_resp%%|*} body=${complete_resp#*|}"
[[ "$(json_nested "${complete_resp#*|}" "order.sub_status")" == "service_completion_pending" ]] || fail "expected service_completion_pending after guide confirm"
ok "guide confirm-completion → service_completion_pending"

tourist_complete_resp="$(curl_json POST "${API_BASE}/api/v1/orders/${ORDER_ID}/confirm-completion" "{}" "$TOURIST_TOKEN")"
[[ "${tourist_complete_resp%%|*}" == "200" ]] || fail "tourist confirm-completion HTTP ${tourist_complete_resp%%|*} body=${tourist_complete_resp#*|}"
[[ "$(json_nested "${tourist_complete_resp#*|}" "order.status")" == "completed" ]] || fail "expected completed after bilateral confirm"
ok "tourist confirm-completion → completed"

REVIEW_IDEM="$(idem_key)"
REVIEW_TMP="$(mktemp)"
review_code="$(curl -sS -o "$REVIEW_TMP" -w '%{http_code}' -X POST \
  "${API_BASE}/api/v1/orders/${ORDER_ID}/reviews" \
  -H "Authorization: Bearer ${TOURIST_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: ${REVIEW_IDEM}" \
  -d "{\"score\":5,\"comment\":\"manual-review-seed-chain-b-$(date +%Y%m%d)\"}")"
review_body="$(cat "$REVIEW_TMP")"
rm -f "$REVIEW_TMP"
[[ "$review_code" == "200" ]] || fail "POST review HTTP $review_code body=$review_body"
ok "tourist review submitted"

list_resp="$(curl_json GET "${API_BASE}/api/v1/orders/${ORDER_ID}/reviews" "" "$TOURIST_TOKEN")"
[[ "${list_resp%%|*}" == "200" ]] || fail "GET reviews HTTP ${list_resp%%|*}"

write_evidence "$ORDER_ID" "$GUIDE_ID" "$AMOUNT" "completed"
print_manual_review_checklist "$ORDER_ID" "$GUIDE_ID" "$AMOUNT"

echo ""
echo "TT_SEED_TRANSACTION_SMOKE: OK (① local · order=${ORDER_ID} · guide=${GUIDE_ID})"
echo "  phase: ① only (mock-pay sandbox · not ②③ GO)"
exit 0
