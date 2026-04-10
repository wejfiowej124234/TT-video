#!/usr/bin/env bash
# Epic E-10：只读连通性 + **单接口** JSON 形状 smoke（**curl** + **jq**）。
#
# 覆盖：
#   GET /api/v1/admin/finance/summary
#   GET /api/v1/admin/cross-check
#   GET /api/v1/admin/drift-summary
#
# 可选：第一个参数 = 本地 **`epic_d_go_bundle_closure.json`** 路径 → 仅用 **jq** 校验 **`.bundle_closure`** 四键结构（**不**与 API 响应对拍）。
#
# 环境变量：
#   API_BASE_URL                    — 可选，默认 `http://127.0.0.1:8080`
#   ADMIN_BEARER_TOKEN              — Admin JWT（**不含** `Bearer ` 前缀；与 **`indexer-public-snapshot.sh`** / **`vault-forwarded-export-fetch.sh`** 同形）；**勿**入库
#   FINANCE_READONLY_SMOKE_SKIP=1   — 跳过全部检查，**exit 0**（无 API / 无 token 的文档或 CI 占位）
#
# 硬边界（勿扩展为「第三套对账」）：
#   - **禁止**跨接口数值运算、差分或推导 drift / 一致性
#   - **exit 0**：SKIP；或三路 **HTTP 200** 且各响应 **jq** 形状通过；可选 closure **jq** 通过
#   - **exit 非 0**：缺 **curl**/**jq**、缺 token（且未 SKIP）、**HTTP ≠ 200**、JSON 非对象、形状不符、可选文件不存在或结构不符
#   - **不得**用 exit 表达 **`drift_detected`** 等业务结论
#
# 用法：
#   bash scripts/finance-readonly-smoke.sh
#   bash scripts/finance-readonly-smoke.sh evidence/GO_20260409/epic_d_go_bundle_closure.json
#   FINANCE_READONLY_SMOKE_SKIP=1 bash scripts/finance-readonly-smoke.sh
set -euo pipefail

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${API_BASE_URL%/}"
CLOSURE_JSON="${1:-}"

if [[ "${FINANCE_READONLY_SMOKE_SKIP:-}" == "1" ]]; then
  echo "finance-readonly-smoke: FINANCE_READONLY_SMOKE_SKIP=1 — skipping (no curl/jq checks)." >&2
  exit 0
fi

for cmd in curl jq; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "finance-readonly-smoke: required command not found: ${cmd}" >&2
    exit 2
  fi
done

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "finance-readonly-smoke: set ADMIN_BEARER_TOKEN or FINANCE_READONLY_SMOKE_SKIP=1" >&2
  exit 2
fi

tmpfiles=()
cleanup() {
  local f
  for f in "${tmpfiles[@]:-}"; do
    rm -f "$f"
  done
}
trap cleanup EXIT

smoke_get_shape() {
  local name="$1" url="$2" filter="$3"
  local tmp code
  tmp="$(mktemp)"
  tmpfiles+=("$tmp")

  code="$(
    curl -sS -o "$tmp" -w "%{http_code}" \
      -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
      "$url" || true
  )"

  if [[ "$code" != "200" ]]; then
    echo "finance-readonly-smoke: ${name} HTTP ${code}" >&2
    head -c 800 "$tmp" 2>/dev/null | tr -d '\r' >&2 || true
    echo >&2
    return 1
  fi

  if ! jq -e "$filter" "$tmp" >/dev/null 2>&1; then
    echo "finance-readonly-smoke: ${name} JSON shape check failed (see jq filter in script header comments)" >&2
    return 1
  fi
  echo "finance-readonly-smoke: ok ${name}"
}

# finance/summary 成功体：status + meta + summary（**meta.build** 由服务端合并；此处只要求 **meta**/**summary** 为对象）
smoke_get_shape "GET /api/v1/admin/finance/summary" "${BASE}/api/v1/admin/finance/summary" \
  'type == "object" and .status == "ok" and (.meta | type == "object") and (.summary | type == "object")'

# cross-check 成功体：三源槽 + drift_summary（**不**断言 drift 真值）
smoke_get_shape "GET /api/v1/admin/cross-check" "${BASE}/api/v1/admin/cross-check" \
  'type == "object" and .status == "ok" \
    and (.fee_pool_projection | type == "object") \
    and (.governance_pool_chain | type == "object") \
    and (.protocol_reference | type == "object") \
    and (.drift_summary | type == "object") \
    and (.drift_summary | has("drift_detected")) \
    and (.drift_summary | has("delta"))'

# drift-summary 成功体：根级 drift_detected + delta（**不**根据取值设 exit）
smoke_get_shape "GET /api/v1/admin/drift-summary" "${BASE}/api/v1/admin/drift-summary" \
  'type == "object" and .status == "ok" and has("drift_detected") and has("delta")'

if [[ -n "$CLOSURE_JSON" ]]; then
  if [[ ! -f "$CLOSURE_JSON" ]]; then
    echo "finance-readonly-smoke: closure file not found: ${CLOSURE_JSON}" >&2
    exit 2
  fi
  if ! jq -e \
    '.bundle_closure
      | type == "object"
      and (has("epic") and has("closure_status") and has("artifact_version") and has("included_tasks"))' \
    "$CLOSURE_JSON" >/dev/null 2>&1; then
    echo "finance-readonly-smoke: bundle_closure structure check failed: ${CLOSURE_JSON}" >&2
    exit 1
  fi
  echo "finance-readonly-smoke: ok bundle_closure structure (${CLOSURE_JSON})"
fi

exit 0
