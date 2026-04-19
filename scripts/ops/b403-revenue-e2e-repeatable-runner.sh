#!/usr/bin/env bash
# **B-403 L0**：可重复 **revenue** **索引** **跑流** — 每轮生成 **`run_id`**，**`POST …/internal/indexer-tick`** 后复用 **TT-B402** **`b402-min-revenue-e2e-reconcile-smoke.sh`**（**B-383+B-386** **+** **admin overview** **深相等**）。
#
# **L0** **不**实现 **`GET …/internal/revenue-e2e-run-status`**（**B-404** **L1** **只读** **handler** **；** **与** **本** **脚本** **分轨** **）；** **不** **替代** **单轮** **`b402-*** **脚本** **。**
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  **`X-Internal-Api-Secret`**（与 API 一致）
#   ADMIN_BEARER_TOKEN   Admin Bearer（**勿**入库；与 **`b402`** 同源）
#   B403_ROUNDS          轮数，默认 **3**（**2～3** **轮** **验收** **可调** **为** **2**）
#   B403_RUNS_OUT        留证目录，默认 **`evidence/b403_revenue_e2e_runs`**（相对**仓库根**）
#
# 留证：追加 **`${B403_RUNS_OUT}/b403-run-manifest.jsonl`**（**NDJSON**；**含** **`session_id`** **/** **`run_id`** **/** **每轮** **`indexer_tick_http`** **/** **`b402_exit`** **/** **`b402_last_line`**）。
#
# 退出码：**0** 成功；**1** 缺依赖；**2** **`indexer-tick`** **HTTP** **非** **200**；**5** **某轮** **`b402`** **非** **0**；**6** **写** **留证** **失败**。

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ROUNDS="${B403_ROUNDS:-3}"
OUT_DIR="${B403_RUNS_OUT:-evidence/b403_revenue_e2e_runs}"
MANIFEST="${OUT_DIR}/b403-run-manifest.jsonl"

gen_uuid() {
  local out
  if command -v uuidgen >/dev/null 2>&1; then
    out="$(uuidgen 2>/dev/null | tr '[:upper:]' '[:lower:]')"
    if [[ -n "$out" ]]; then
      echo "$out"
      return 0
    fi
  fi
  # **Windows** **Git** **Bash**：**`python3`** **可能** **指向** **Store** **占位** **（** **无** **输出** **）** **—** **优先** **`python`** **/** **多** **候选** **。**
  for py in python python3; do
    if command -v "$py" >/dev/null 2>&1; then
      out="$("$py" -c "import uuid; print(uuid.uuid4())" 2>/dev/null | tr -d '\r')"
      if [[ -n "$out" ]]; then
        echo "$out"
        return 0
      fi
    fi
  done
  echo "b403-revenue-e2e-repeatable-runner.sh: uuidgen or working python is required for run_id" >&2
  exit 1
}

iso_now() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

if ! command -v jq >/dev/null 2>&1; then
  echo "b403-revenue-e2e-repeatable-runner.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b403-revenue-e2e-repeatable-runner.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b403-revenue-e2e-repeatable-runner.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

if ! [[ "$ROUNDS" =~ ^[0-9]+$ ]] || [[ "$ROUNDS" -lt 1 ]] || [[ "$ROUNDS" -gt 32 ]]; then
  echo "b403-revenue-e2e-repeatable-runner.sh: B403_ROUNDS must be 1..32" >&2
  exit 1
fi

mkdir -p "$OUT_DIR" || {
  echo "b403-revenue-e2e-repeatable-runner.sh: cannot mkdir ${OUT_DIR}" >&2
  exit 6
}

SESSION_ID="$(gen_uuid)"
STARTED="$(iso_now)"

if ! jq -n \
  --arg kind "b403_session_start" \
  --arg session_id "$SESSION_ID" \
  --arg started_at "$STARTED" \
  --argjson rounds "$ROUNDS" \
  --arg script "b403-revenue-e2e-repeatable-runner.sh" \
  '{kind:$kind,session_id:$session_id,started_at:$started_at,rounds_planned:$rounds,script:$script}' >>"$MANIFEST" 2>/dev/null; then
  echo "b403-revenue-e2e-repeatable-runner.sh: cannot write manifest ${MANIFEST}" >&2
  exit 6
fi

tick_tmp="$(mktemp)"
trap 'rm -f "$tick_tmp"' EXIT

for ((i = 1; i <= ROUNDS; i++)); do
  RUN_ID="$(gen_uuid)"
  ROUND_STARTED="$(iso_now)"

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
      --arg kind "b403_round_failed" \
      --arg session_id "$SESSION_ID" \
      --arg run_id "$RUN_ID" \
      --argjson round "$i" \
      --arg tick_http "$code_tick" \
      --arg at "$(iso_now)" \
      '{kind:$kind,session_id:$session_id,run_id:$run_id,round:$round,indexer_tick_http:$tick_http,error:"indexer_tick_not_200",at:$at}' >>"$MANIFEST" || true
    echo "b403-revenue-e2e-repeatable-runner.sh: round ${i} indexer-tick HTTP ${code_tick} (expected 200)" >&2
    head -c 1400 "$tick_tmp" >&2 || true
    echo >&2
    exit 2
  fi

  set +e
  b402_out="$(bash "${ROOT}/scripts/ops/b402-min-revenue-e2e-reconcile-smoke.sh" 2>&1)"
  b402_ec=$?
  set -e

  b402_last="$(printf '%s\n' "$b402_out" | tail -n 1)"

  jq -n \
    --arg kind "b403_round" \
    --arg session_id "$SESSION_ID" \
    --arg run_id "$RUN_ID" \
    --argjson round "$i" \
    --arg tick_http "$code_tick" \
    --argjson b402_exit "$b402_ec" \
    --arg b402_last_line "$b402_last" \
    --arg started_at "$ROUND_STARTED" \
    --arg at "$(iso_now)" \
    '{kind:$kind,session_id:$session_id,run_id:$run_id,round:$round,indexer_tick_http:$tick_http,b402_exit:$b402_exit,b402_last_line:$b402_last_line,started_at:$started_at,at:$at}' >>"$MANIFEST" || {
    echo "b403-revenue-e2e-repeatable-runner.sh: manifest append failed" >&2
    exit 6
  }

  if [[ "$b402_ec" != "0" ]]; then
    echo "$b402_out" >&2
    exit 5
  fi
done

jq -n \
  --arg kind "b403_session_ok" \
  --arg session_id "$SESSION_ID" \
  --arg at "$(iso_now)" \
  --argjson rounds "$ROUNDS" \
  --arg manifest "$MANIFEST" \
  '{kind:$kind,session_id:$session_id,rounds_completed:$rounds,at:$at,manifest_path:$manifest}' >>"$MANIFEST" || {
  echo "b403-revenue-e2e-repeatable-runner.sh: manifest finalize failed" >&2
  exit 6
}

echo "b403-revenue-e2e-repeatable-runner.sh: ok (rounds=${ROUNDS}; session_id=${SESSION_ID}; manifest=${MANIFEST})"
exit 0
