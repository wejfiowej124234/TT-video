#!/usr/bin/env bash
# **B-407**：**不** **使用** **`mock-pay`** **；** **seed** **/** **登录** **→** **建单** **→** **接单** **→** **`POST …/set-escrow-address`** **→** **链上** **`release`+`distribute`** **（** **`b407-exec-chain-release-distribute.sh`** **）** **→** **导出** **`B405_ORDER_ID`** **并** **调用** **TT-B405** **`b405-revenue-e2e-order-driven-runner.sh`** **（** **indexer-tick** **+** **TT-B402** **`b402`** **）** **，** **留证** **/** **验证** **仍** **走** **B-404** **`GET …/revenue-e2e-run-status`** **。**
#
# **与** **B-406** **差异**：**无** **`P3_CHAIN_OFF`** **/** **`/mock-pay`** **依赖** **；** **须** **自备** **已** **`Funded`** **且** **`platformFeeRecipient`** **指向** **FeeRouter** **的** **Escrow** **实例** **地址** **（** **`B407_ESCROW_ADDRESS`** **）** **及** **链** **环境** **变量** **（** **见** **下** **）** **。**
#
# **API** **侧** **须** **与** **B-402/B-405** **烟测** **一致** **（** **`chain_off`** **+** **DB** **+** **indexer** **配置** **与** **链** **上** **同一** **`FEE_ROUTER_ADDRESS`** **等** **）** **。**
#
# **环境** **（** **HTTP** **段** **默认同** **B-406** **，** **前缀** **B407_** **）**：
#   B407_TOURIST_EMAIL   默认 tourist@test.com
#   B407_GUIDE_EMAIL     默认 guide@test.com
#   B407_PASSWORD        默认 Test123!
#   B407_GUIDE_CITY      默认 杭州
#   B407_ORDER_AMOUNT    默认 100
#   B407_ORDER_CURRENCY  默认 USD
#   B407_SKIP_SEED       设为 1 跳过 seed-test-accounts
#   B407_ESCROW_ADDRESS  **必填** **：** **0x…** **42** **字符** **（** **已** **Funded** **Escrow** **）**
#   **继承** **B-405**：**INTERNAL_API_SECRET**、**ADMIN_BEARER_TOKEN**、**B405_ROUNDS**、**B405_RUNS_OUT** **等**
#   **链** **段** **见** **`b407-exec-chain-release-distribute.sh`** **头注释** **（** **B407_RPC_URL** **/** **B407_ESCROW** **/** **B407_FEE_ROUTER** **/** **B407_RELAYER_PK** **/** **B407_OWNER_PK** **）**
#   **B-408** **封口** **：** **设** **`B408_RECORD_DIR`** **（** **目录** **）** **时** **自动** **写** **`b407-chain-tx.json`** **、** **`b404-run-status.json`** **、** **`b408-acceptance-record.json`** **（** **须** **B-404** **200** **）** **—** **见** **`b408-revenue-e2e-acceptance-closeout.sh`** **。**
#
# **退出码**：**0** **成功** **；** **1** **缺** **依赖** **；** **8** **无** **向导** **；** **10** **登录** **失败** **；** **11** **建单** **/** **接单** **失败** **；** **12** **链** **步** **失败** **或** **缺** **cast** **/** **jq** **；** **13** **set-escrow** **非** **200** **；** **14** **B-404** **非** **200** **（** **仅** **`B408_RECORD_DIR`** **时** **）** **；** **15** **无法** **解析** **`run_id`** **（** **仅** **`B408_RECORD_DIR`** **时** **）** **；** **其余** **同** **b405** **。**

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

TOURIST_EMAIL="${B407_TOURIST_EMAIL:-tourist@test.com}"
GUIDE_EMAIL="${B407_GUIDE_EMAIL:-guide@test.com}"
SEED_PW="${B407_PASSWORD:-Test123!}"
GUIDE_CITY="${B407_GUIDE_CITY:-杭州}"
ORDER_AMT="${B407_ORDER_AMOUNT:-100}"
ORDER_CCY="${B407_ORDER_CURRENCY:-USD}"
ESCROW_ADDR="${B407_ESCROW_ADDRESS:-}"

if ! command -v jq >/dev/null 2>&1; then
  echo "b407-revenue-e2e-real-chain-runner.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

if [[ -z "$ESCROW_ADDR" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: B407_ESCROW_ADDRESS is required (funded Escrow, platformFeeRecipient=FeeRouter)" >&2
  exit 1
fi
if [[ "${ESCROW_ADDR}" != 0x* ]] || [[ "${#ESCROW_ADDR}" -ne 42 ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: B407_ESCROW_ADDRESS must be 0x + 40 hex chars" >&2
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
    echo "b407-revenue-e2e-real-chain-runner.sh: login failed for ${email} HTTP ${code}" >&2
    head -c 1200 "$out" >&2 || true
    echo >&2
    rm -f "$out"
    exit 10
  fi
  cat "$out"
  rm -f "$out"
}

if [[ "${B407_SKIP_SEED:-0}" != "1" ]]; then
  curl -sS -X POST "${BASE}/auth/seed-test-accounts" -H "Content-Type: application/json" -d '{}' >/dev/null 2>&1 || true
fi

echo "b407-revenue-e2e-real-chain-runner.sh: logging in tourist + guide..."
TOURIST_JSON="$(login_json "$TOURIST_EMAIL")"
GUIDE_JSON="$(login_json "$GUIDE_EMAIL")"
TOKEN_T="$(echo "$TOURIST_JSON" | jq -r '.token // empty')"
TOKEN_G="$(echo "$GUIDE_JSON" | jq -r '.token // empty')"
if [[ -z "$TOKEN_T" || -z "$TOKEN_G" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: missing token in login response" >&2
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
  echo "b407-revenue-e2e-real-chain-runner.sh: no active guide in GET /api/v1/guides (try B407_GUIDE_CITY or seed accounts)" >&2
  exit 8
fi

echo "b407-revenue-e2e-real-chain-runner.sh: creating order (guide_id=${GUIDE_ROW_ID})..."

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
  echo "b407-revenue-e2e-real-chain-runner.sh: POST /orders HTTP ${code_oc}" >&2
  head -c 1600 "$oc_tmp" >&2 || true
  echo >&2
  rm -f "$oc_tmp"
  exit 11
fi
ORDER_ID="$(jq -r '.order.id // empty' "$oc_tmp")"
rm -f "$oc_tmp"
if [[ -z "$ORDER_ID" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: could not parse order.id" >&2
  exit 11
fi

echo "b407-revenue-e2e-real-chain-runner.sh: accepting order ${ORDER_ID} as guide..."
code_acc="$(
  curl -sS -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "Authorization: Bearer ${TOKEN_G}" \
    "${BASE}/api/v1/orders/${ORDER_ID}/accept"
)"
if [[ "$code_acc" != "200" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: POST /orders/:id/accept HTTP ${code_acc}" >&2
  exit 11
fi

echo "b407-revenue-e2e-real-chain-runner.sh: POST …/set-escrow-address (${ESCROW_ADDR})..."
se_tmp="$(mktemp)"
code_se="$(
  curl -sS -o "$se_tmp" -w "%{http_code}" \
    -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN_T}" \
    -d "$(jq -n --arg a "$ESCROW_ADDR" '{escrow_address:$a}')" \
    "${BASE}/api/v1/orders/${ORDER_ID}/set-escrow-address"
)"
if [[ "$code_se" != "200" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: POST /set-escrow-address HTTP ${code_se}" >&2
  head -c 1600 "$se_tmp" 2>/dev/null || true
  echo >&2
  rm -f "$se_tmp"
  exit 13
fi
rm -f "$se_tmp"

export B407_ESCROW="$ESCROW_ADDR"
if [[ -z "${B407_RPC_URL:-}" && -n "${CHAIN_RPC_URL:-}" ]]; then
  export B407_RPC_URL="${CHAIN_RPC_URL}"
fi
if [[ -z "${B407_RPC_URL:-}" && -n "${RPC_URL:-}" ]]; then
  export B407_RPC_URL="${RPC_URL}"
fi

if [[ -n "${B408_RECORD_DIR:-}" ]]; then
  mkdir -p "$B408_RECORD_DIR"
  export B407_TX_RECORD_JSON="${B408_RECORD_DIR}/b407-chain-tx.json"
fi

echo "b407-revenue-e2e-real-chain-runner.sh: on-chain release + FeeRouter distribute (see b407-exec-chain-release-distribute.sh)..."
if ! bash "${ROOT}/scripts/ops/b407-exec-chain-release-distribute.sh"; then
  exit 12
fi

export B405_ORDER_ID="$ORDER_ID"

echo "b407-revenue-e2e-real-chain-runner.sh: order ${ORDER_ID} chain steps done; invoking b405 runner (B405_ORDER_ID exported)..."

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

if [[ -n "${B408_RECORD_DIR:-}" ]]; then
  printf '%s' "$ORDER_ID" >"${B408_RECORD_DIR}/b405-order-id.txt"
  printf '%s' "$BASE" >"${B408_RECORD_DIR}/api-base-url.txt"
  if [[ -z "$RUN_ID" ]]; then
    echo "b407-revenue-e2e-real-chain-runner.sh: B408_RECORD_DIR set but could not resolve b405_run_id from manifest ${MPATH}" >&2
    exit 15
  fi
  printf '%s' "$RUN_ID" >"${B408_RECORD_DIR}/b405-run-id.txt"
  b404_tmp="$(mktemp)"
  b404_code="$(
    curl -sS -o "$b404_tmp" -w "%{http_code}" \
      -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
      "${BASE}/api/v1/internal/revenue-e2e-run-status?run_id=${RUN_ID}"
  )"
  printf '%s' "$b404_code" >"${B408_RECORD_DIR}/b404-http-status.txt"
  if [[ "$b404_code" != "200" ]]; then
    mv -f "$b404_tmp" "${B408_RECORD_DIR}/b404-run-status.error.txt"
    echo "b407-revenue-e2e-real-chain-runner.sh: B-404 GET revenue-e2e-run-status HTTP ${b404_code} (expected 200)" >&2
    exit 14
  fi
  mv -f "$b404_tmp" "${B408_RECORD_DIR}/b404-run-status.json"
  git_sha=""
  if command -v git >/dev/null 2>&1 && git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git_sha="$(git -C "$ROOT" rev-parse HEAD 2>/dev/null | tr -d '\r\n' || true)"
  fi
  jq -n \
    --arg card "TT-B408" \
    --arg closed "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
    --arg api "$BASE" \
    --arg oid "$ORDER_ID" \
    --arg rid "$RUN_ID" \
    --arg gsha "${git_sha}" \
    --argjson http "$b404_code" \
    --slurpfile ch "${B408_RECORD_DIR}/b407-chain-tx.json" \
    --slurpfile b4 "${B408_RECORD_DIR}/b404-run-status.json" \
    '{
      card: $card,
      closed_at_utc: $closed,
      api_base_url: $api,
      b405_order_id: $oid,
      b405_run_id: $rid,
      git_rev: (if ($gsha|length) > 0 then $gsha else null end),
      chain: $ch[0],
      b404_http_status: $http,
      b404_revenue_e2e_run_status: $b4[0]
    }' >"${B408_RECORD_DIR}/b408-acceptance-record.json"
  echo "b407-revenue-e2e-real-chain-runner.sh: B-408 artifacts under ${B408_RECORD_DIR} (b408-acceptance-record.json)"
fi

echo "b407-revenue-e2e-real-chain-runner.sh: ok (order_id=${ORDER_ID}; last b405_round run_id=${RUN_ID:-unknown})"
if [[ -n "$RUN_ID" ]]; then
  echo "b407-revenue-e2e-real-chain-runner.sh: B-404 sample: curl -sS -H \"X-Internal-Api-Secret: \${INTERNAL_API_SECRET}\" \"${BASE}/api/v1/internal/revenue-e2e-run-status?run_id=${RUN_ID}\""
fi
exit 0
