#!/usr/bin/env bash
# **B-405 L2**：**订单** **锚** **+** **`indexer-tick`** **+** **TT-B402** **`b402`** **（** **B-383+B-386** **）** **—** **留证** **`b405-run-manifest.jsonl`**
#
# **订单** **ID**：**优先** **`B405_ORDER_ID`** **（** **UUID** **）** **；** **否则** **`GET /api/v1/orders?limit=1`** **+** **`Authorization: Bearer ${ADMIN_BEARER_TOKEN}`** **取** **`items[0].id`** **（** **须** **列表** **非空** **；** **admin** **账号** **若** **无** **可见** **订单** **请** **导出** **`B405_ORDER_ID`** **）** **。**
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  **`X-Internal-Api-Secret`**
#   ADMIN_BEARER_TOKEN   Admin Bearer（与 **`b402`** 同源）
#   B405_ORDER_ID        可选，固定本跑流 **`order_id`**（UUID）
#   B405_ROUNDS          默认 **2**
#   B405_RUNS_OUT        默认 **`evidence/b405_revenue_e2e_runs`**
#
# 退出码：**0** 成功；**1** 缺依赖；**2** **`indexer-tick`** **非** **200**；**5** **`b402`** **非** **0**；**6** **写** **manifest** **失败**；**7** **无** **`order_id`** **可用**（**无** **`B405_ORDER_ID`** **且** **`GET …/orders`** **空** **）**。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ROUNDS="${B405_ROUNDS:-2}"
OUT_DIR="${B405_RUNS_OUT:-evidence/b405_revenue_e2e_runs}"
MANIFEST="${OUT_DIR}/b405-run-manifest.jsonl"

gen_uuid() {
  local out
  if command -v uuidgen >/dev/null 2>&1; then
    out="$(uuidgen 2>/dev/null | tr '[:upper:]' '[:lower:]')"
    if [[ -n "$out" ]]; then
      echo "$out"
      return 0
    fi
  fi
  for py in python python3; do
    if command -v "$py" >/dev/null 2>&1; then
      out="$("$py" -c "import uuid; print(uuid.uuid4())" 2>/dev/null | tr -d '\r')"
      if [[ -n "$out" ]]; then
        echo "$out"
        return 0
      fi
    fi
  done
  echo "b405-revenue-e2e-order-driven-runner.sh: uuidgen or working python is required" >&2
  exit 1
}

iso_now() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

if ! command -v jq >/dev/null 2>&1; then
  echo "b405-revenue-e2e-order-driven-runner.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b405-revenue-e2e-order-driven-runner.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b405-revenue-e2e-order-driven-runner.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

if ! [[ "$ROUNDS" =~ ^[0-9]+$ ]] || [[ "$ROUNDS" -lt 1 ]] || [[ "$ROUNDS" -gt 32 ]]; then
  echo "b405-revenue-e2e-order-driven-runner.sh: B405_ROUNDS must be 1..32" >&2
  exit 1
fi

mkdir -p "$OUT_DIR" || {
  echo "b405-revenue-e2e-order-driven-runner.sh: cannot mkdir ${OUT_DIR}" >&2
  exit 6
}

SESSION_ID="$(gen_uuid)"
STARTED="$(iso_now)"

if ! jq -n \
  --arg kind "b405_session_start" \
  --arg session_id "$SESSION_ID" \
  --arg started_at "$STARTED" \
  --argjson rounds "$ROUNDS" \
  --arg script "b405-revenue-e2e-order-driven-runner.sh" \
  --arg api_base "$BASE" \
  '{kind:$kind,session_id:$session_id,started_at:$started_at,rounds_planned:$rounds,script:$script,api_base_url:$api_base}' >>"$MANIFEST" 2>/dev/null; then
  echo "b405-revenue-e2e-order-driven-runner.sh: cannot write manifest ${MANIFEST}" >&2
  exit 6
fi

resolve_order_id() {
  if [[ -n "${B405_ORDER_ID:-}" ]]; then
    echo "${B405_ORDER_ID}"
    return 0
  fi
  local tmp orders_json oid
  tmp="$(mktemp)"
  curl -sS -o "$tmp" -w "" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/orders?limit=1" || true
  orders_json="$(cat "$tmp")"
  rm -f "$tmp"
  oid="$(echo "$orders_json" | jq -r '.items[0].id // empty')"
  if [[ -z "$oid" ]]; then
    echo "b405-revenue-e2e-order-driven-runner.sh: no order id (set B405_ORDER_ID=<uuid> or ensure GET /api/v1/orders returns items for this bearer)" >&2
    exit 7
  fi
  echo "$oid"
}

tick_tmp="$(mktemp)"
trap 'rm -f "$tick_tmp"' EXIT

for ((i = 1; i <= ROUNDS; i++)); do
  RUN_ID="$(gen_uuid)"
  ROUND_STARTED="$(iso_now)"
  ORDER_ID="$(resolve_order_id)"

  code_tick="$(
    curl -sS -o "$tick_tmp" -w "%{http_code}" \
      -X POST \
      -H "Content-Type: application/json" \
      -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
      -d '{}' \
      "${BASE}/api/v1/internal/indexer-tick"
  )"

  if [[ "$code_tick" != "200" ]]; then
    jq -n \
      --arg kind "b405_round_failed" \
      --arg session_id "$SESSION_ID" \
      --arg run_id "$RUN_ID" \
      --arg order_id "$ORDER_ID" \
      --argjson round "$i" \
      --arg tick_http "$code_tick" \
      --arg at "$(iso_now)" \
      '{kind:$kind,session_id:$session_id,run_id:$run_id,order_id:$order_id,round:$round,indexer_tick_http:$tick_http,error:"indexer_tick_not_200",at:$at}' >>"$MANIFEST" || true
    echo "b405-revenue-e2e-order-driven-runner.sh: round ${i} indexer-tick HTTP ${code_tick} (expected 200)" >&2
    head -c 1400 "$tick_tmp" >&2 || true
    echo >&2
    exit 2
  fi

  set +e
  b402_out="$(bash "${ROOT}/scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh" 2>&1)"
  b402_ec=$?
  set -e

  b402_last="$(printf '%s\n' "$b402_out" | tail -n 1)"
  if [[ "${#b402_last}" -gt 2000 ]]; then
    b402_last="${b402_last:0:2000}"
  fi

  if [[ "$b402_ec" == "0" ]]; then
    PHASE_AFTER="post_b402"
  else
    PHASE_AFTER="failed_b402"
  fi

  jq -n \
    --arg kind "b405_round" \
    --arg session_id "$SESSION_ID" \
    --arg run_id "$RUN_ID" \
    --arg order_id "$ORDER_ID" \
    --argjson round "$i" \
    --arg tick_http "$code_tick" \
    --argjson b402_exit "$b402_ec" \
    --arg b402_last_line "$b402_last" \
    --arg order_phase_before_tick "post_tick_pre_b402" \
    --arg order_phase_after_b402 "$PHASE_AFTER" \
    --arg started_at "$ROUND_STARTED" \
    --arg at "$(iso_now)" \
    '{kind:$kind,session_id:$session_id,run_id:$run_id,order_id:$order_id,round:$round,indexer_tick_http:$tick_http,b402_exit:$b402_exit,b402_last_line:$b402_last_line,order_phase_before_tick:$order_phase_before_tick,order_phase_after_b402:$order_phase_after_b402,started_at:$started_at,at:$at}' >>"$MANIFEST" || {
    echo "b405-revenue-e2e-order-driven-runner.sh: manifest append failed" >&2
    exit 6
  }

  if [[ "$b402_ec" != "0" ]]; then
    echo "$b402_out" >&2
    exit 5
  fi
done

jq -n \
  --arg kind "b405_session_ok" \
  --arg session_id "$SESSION_ID" \
  --arg at "$(iso_now)" \
  --argjson rounds "$ROUNDS" \
  --arg manifest "$MANIFEST" \
  '{kind:$kind,session_id:$session_id,rounds_completed:$rounds,at:$at,manifest_path:$manifest}' >>"$MANIFEST" || {
  echo "b405-revenue-e2e-order-driven-runner.sh: manifest finalize failed" >&2
  exit 6
}

echo "b405-revenue-e2e-order-driven-runner.sh: ok (rounds=${ROUNDS}; session_id=${SESSION_ID}; manifest=${MANIFEST})"
exit 0
