#!/usr/bin/env bash
# **TT-B402**：最小 revenue 闭环观测烟测 — **单请求**同时拉 **B-383**（FeeRouter 链 vs DB 条数）
# 与 **B-386**（三腿 bundle 汇总），并校验 **`GET …/admin/observability/overview`** 与 reconcile 根级 JSON **深相等**。
#
# **不**替代 **b383-*** / **b386-*** 单卡脚本；本脚本用于「一条 reconcile 验 B-383+B-386」与 Runbook 收口。
#
# 前置：**API**、**`DATABASE_URL`**、**链**（**`FEE_ROUTER_ADDRESS`** 等）；须 **admin**；链上若尚无 **`PlatformFeeRouted`** **投影**，bundle **rollup** 可能为 **drift/unavailable**（**属** **B-402** **Runbook** **预期**）。
#
# 环境变量：同 **`b383-fee-router-platform-fee-routed-log-count-reconcile-admin-overview-smoke.sh`**
#
# 退出码：**0** 成功；**1** 缺依赖；**2** HTTP；**3/4** 缺键或 anchor；**5** JSON 不等。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_383="383-FEE-ROUTER-PLATFORM-FEE-ROUTED-LOG-COUNT-CHAIN-VS-DB-OBS-V1"
ANCHOR_386="386-REVENUE-PIPELINE-LOG-COUNT-CHAIN-VS-DB-BUNDLE-OBS-V1"
KEY_383="fee_router_platform_fee_routed_log_count_chain_vs_db_observability"
KEY_386="revenue_pipeline_log_count_chain_vs_db_bundle_observability"

if ! command -v jq >/dev/null 2>&1; then
  echo "b402-min-revenue-e2e-reconcile-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b402-min-revenue-e2e-reconcile-smoke.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b402-min-revenue-e2e-reconcile-smoke.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

rec="$(mktemp)"
adm="$(mktemp)"
trap 'rm -f "$rec" "$adm"' EXIT

BODY='{"persist":true,"include_fee_router_platform_fee_routed_log_count_chain_vs_db_observability":true,"include_revenue_pipeline_log_count_chain_vs_db_bundle_observability":true}'

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "$BODY" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b402-min-revenue-e2e-reconcile-smoke.sh: indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 1600 "$rec" >&2 || true
  echo >&2
  exit 2
fi

for pair in "${KEY_383}:${ANCHOR_383}" "${KEY_386}:${ANCHOR_386}"; do
  k="${pair%%:*}"
  a="${pair#*:}"
  if ! jq -e ".${k} != null" "$rec" >/dev/null 2>&1; then
    echo "b402-min-revenue-e2e-reconcile-smoke.sh: missing ${k} in reconcile body" >&2
    exit 3
  fi
  jq -e --arg an "$a" "(.${k}.anchor == \$an)" "$rec" >/dev/null \
    || {
      echo "b402-min-revenue-e2e-reconcile-smoke.sh: unexpected anchor for ${k}" >&2
      jq ".${k}.anchor" "$rec" >&2
      exit 3
    }
done

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b402-min-revenue-e2e-reconcile-smoke.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 1200 "$adm" >&2 || true
  echo >&2
  exit 2
fi

for k in "$KEY_383" "$KEY_386"; do
  if ! jq -e ".overview.${k} != null" "$adm" >/dev/null 2>&1; then
    echo "b402-min-revenue-e2e-reconcile-smoke.sh: missing overview.${k}" >&2
    exit 4
  fi
done

for k in "$KEY_383" "$KEY_386"; do
  eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
    "(\$r[0].${k}) == (\$a[0].overview.${k})")"
  if [[ "$eq" != "true" ]]; then
    echo "b402-min-revenue-e2e-reconcile-smoke.sh: reconcile vs admin mismatch for ${k}" >&2
    exit 5
  fi
done

mk="$(jq -r ".${KEY_386}.rollup.marker // empty" "$rec")"
echo "b402-min-revenue-e2e-reconcile-smoke.sh: ok (B-383+B-386 reconcile == admin overview; bundle rollup.marker=${mk})"
exit 0
