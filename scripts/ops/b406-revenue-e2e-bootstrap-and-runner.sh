#!/usr/bin/env bash
# **B-406**：**自动** **创建** **最小** **测试** **订单** **→** **Accepted** **→** **Escrowed** **（** **`mock-pay`** **）** **→** **调用** **TT-B405** **`b405-revenue-e2e-order-driven-runner.sh`** **（** **`indexer-tick`** **+** **`b402`** **）** **，** **不再** **依赖** **预先** **存在** **的** **`B405_ORDER_ID`** **。**
#
# **前置** **（** **目标** **API** **进程** **）**：**`SEED_TEST_ACCOUNTS=1`** **（** **建议** **）** **；** **`P3_CHAIN_OFF=1`** **（** **`POST …/mock-pay`** **硬性** **要求** **，** **见** **`orders/mutations.rs`** **）** **；** **`chain_off`** **+** **DB** **与** **B-402/B-405** **烟测** **一致** **。**
#
# **环境** **（** **除** **B-405** **同源** **变量** **外** **）**：
#   B406_TOURIST_EMAIL   默认 **tourist@test.com**
#   B406_GUIDE_EMAIL     默认 **guide@test.com**
#   B406_PASSWORD        默认 **Test123!**
#   B406_GUIDE_CITY      **`GET …/guides`** **筛选** **，** **默认** **杭州** **（** **与** **seed** **向导** **同城** **）**
#   B406_ORDER_AMOUNT    默认 **100**
#   B406_ORDER_CURRENCY  默认 **USD**
#   B406_SKIP_SEED       设为 **1** **跳过** **`POST …/seed-test-accounts`**
#
# **继承** **B-405**：**`INTERNAL_API_SECRET`**、**`ADMIN_BEARER_TOKEN`**、**`B405_ROUNDS`** **（** **默认** **2** **）**、**`B405_RUNS_OUT`** **等** **—** **本** **脚本** **在** **调用** **b405** **前** **设置** **`B405_ORDER_ID`** **（** **覆盖** **环境** **中** **原有** **值** **）** **。**
#
# 退出码：**0** 成功；**1** 缺依赖；**8** **无** **可用** **active** **向导** **；** **9** **`mock-pay`** **非** **200** **（** **常见** **：** **`P3_CHAIN_OFF≠1`** **→** **501** **）** **；** **10** **登录** **失败** **；** **11** **建单** **/** **接单** **失败** **；** **其余** **同** **b405** **（** **2/5/6/7** **）** **。**

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

TOURIST_EMAIL="${B406_TOURIST_EMAIL:-tourist@test.com}"
GUIDE_EMAIL="${B406_GUIDE_EMAIL:-guide@test.com}"
SEED_PW="${B406_PASSWORD:-Test123!}"
GUIDE_CITY="${B406_GUIDE_CITY:-杭州}"
ORDER_AMT="${B406_ORDER_AMOUNT:-100}"
ORDER_CCY="${B406_ORDER_CURRENCY:-USD}"

if ! command -v jq >/dev/null 2>&1; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

login_json() {
  local email="$1"
  local out
  out="$(mktemp)"
  local code
  code="$(
    curl -sS -o "$out" -w "%{http_code}" \
      -H "Content-Type: application/json" \
      -d "{\"email\":\"${email}\",\"password\":\"${SEED_PW}\"}" \
      "${BASE}/auth/login"
  )"
  if [[ "$code" != "200" ]]; then
    echo "b406-revenue-e2e-bootstrap-and-runner.sh: login failed for ${email} HTTP ${code}" >&2
    head -c 1200 "$out" >&2 || true
    echo >&2
    rm -f "$out"
    exit 10
  fi
  cat "$out"
  rm -f "$out"
}

if [[ "${B406_SKIP_SEED:-0}" != "1" ]]; then
  curl -sS -X POST "${BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
fi

echo "b406-revenue-e2e-bootstrap-and-runner.sh: logging in tourist + guide..."
TOURIST_JSON="$(login_json "$TOURIST_EMAIL")"
GUIDE_JSON="$(login_json "$GUIDE_EMAIL")"
TOKEN_T="$(echo "$TOURIST_JSON" | jq -r '.token // empty')"
TOKEN_G="$(echo "$GUIDE_JSON" | jq -r '.token // empty')"
if [[ -z "$TOKEN_T" || -z "$TOKEN_G" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: missing token in login response" >&2
  exit 10
fi

guides_tmp="$(mktemp)"
curl -sS -o "$guides_tmp" "${BASE}/api/v1/guides?city=$(printf '%s' "$GUIDE_CITY" | jq -sRr @uri)"
GUIDE_ROW_ID="$(jq -r '.items[0].id // empty' "$guides_tmp")"
if [[ -z "$GUIDE_ROW_ID" ]]; then
  curl -sS -o "$guides_tmp" "${BASE}/api/v1/guides"
  GUIDE_ROW_ID="$(jq -r '.items[0].id // empty' "$guides_tmp")"
fi
rm -f "$guides_tmp"

if [[ -z "$GUIDE_ROW_ID" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: no active guide in GET /api/v1/guides (try B406_GUIDE_CITY or seed accounts)" >&2
  exit 8
fi

echo "b406-revenue-e2e-bootstrap-and-runner.sh: creating order (guide_id=${GUIDE_ROW_ID})..."

body="$(jq -n \
  --arg gid "$GUIDE_ROW_ID" \
  --arg amt "$ORDER_AMT" \
  --arg ccy "$ORDER_CCY" \
  '{guide_id:$gid, amount:$amt, currency:$ccy}')"

oc_tmp="$(mktemp)"
code_oc="$(
  curl -sS -o "$oc_tmp" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN_T}" \
    -d "$body" \
    "${BASE}/api/v1/orders"
)"
if [[ "$code_oc" != "200" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: POST /orders HTTP ${code_oc}" >&2
  head -c 1600 "$oc_tmp" >&2 || true
  echo >&2
  rm -f "$oc_tmp"
  exit 11
fi
ORDER_ID="$(jq -r '.order.id // empty' "$oc_tmp")"
rm -f "$oc_tmp"
if [[ -z "$ORDER_ID" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: could not parse order.id" >&2
  exit 11
fi

echo "b406-revenue-e2e-bootstrap-and-runner.sh: accepting order ${ORDER_ID} as guide..."
code_acc="$(
  curl -sS -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN_G}" \
    "${BASE}/api/v1/orders/${ORDER_ID}/accept"
)"
if [[ "$code_acc" != "200" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: POST /orders/:id/accept HTTP ${code_acc}" >&2
  exit 11
fi

echo "b406-revenue-e2e-bootstrap-and-runner.sh: mock-pay (requires P3_CHAIN_OFF=1 on API)..."
pay_tmp="$(mktemp)"
code_pay="$(
  curl -sS -o "$pay_tmp" -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN_T}" \
    "${BASE}/api/v1/orders/${ORDER_ID}/mock-pay"
)"
if [[ "$code_pay" != "200" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: POST /orders/:id/mock-pay HTTP ${code_pay}" >&2
  head -c 1600 "$pay_tmp" 2>/dev/null || true
  echo >&2
  rm -f "$pay_tmp"
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: hint: ensure API process has P3_CHAIN_OFF=1 (see Epic-F / orders/mutations mock-pay gate)" >&2
  exit 9
fi
rm -f "$pay_tmp"

export B405_ORDER_ID="$ORDER_ID"

echo "b406-revenue-e2e-bootstrap-and-runner.sh: order ${ORDER_ID} is escrowed; invoking b405 runner (B405_ORDER_ID exported)..."

set +e
bash "${ROOT}/scripts/ops/b405-revenue-e2e-order-driven-runner.sh"
ec=$?
set -e
if [[ "$ec" != "0" ]]; then
  exit "$ec"
fi

RUN_ID=""
MPATH="${ROOT}/${B405_RUNS_OUT:-evidence/b405_revenue_e2e_runs}/b405-run-manifest.jsonl"
if [[ -f "$MPATH" ]]; then
  RUN_ID="$(grep '"kind":"b405_round"' "$MPATH" 2>/dev/null | tail -1 | jq -r '.run_id // empty' 2>/dev/null || true)"
  if [[ -z "$RUN_ID" ]]; then
    RUN_ID="$(grep 'b405_round' "$MPATH" 2>/dev/null | tail -1 | jq -r '.run_id // empty' 2>/dev/null || true)"
  fi
fi

echo "b406-revenue-e2e-bootstrap-and-runner.sh: ok (order_id=${ORDER_ID}; last b405_round run_id=${RUN_ID:-unknown})"
if [[ -n "$RUN_ID" ]]; then
  echo "b406-revenue-e2e-bootstrap-and-runner.sh: B-404 sample: curl -sS -H \"X-Internal-Api-Secret: \${INTERNAL_API_SECRET}\" \"${BASE}/api/v1/internal/revenue-e2e-run-status?run_id=${RUN_ID}\""
fi
exit 0
