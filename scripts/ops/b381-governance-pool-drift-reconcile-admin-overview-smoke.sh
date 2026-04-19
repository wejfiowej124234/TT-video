#!/usr/bin/env bash
# **TT-B382**：**B-381** 真实链路对拍 — **`POST …/internal/indexer-reconcile`**（**`persist:true`** + **`include_governance_pool_db_vs_chain_balance_drift_observability:true`**）
# 与 **`GET …/admin/observability/overview`** **`overview.governance_pool_db_vs_chain_balance_drift_observability`** 机读 **JSON 相等**（回读 **`reconciliation_reports.summary`** 同键）。
#
# 前置：**API** 已启、**`DATABASE_URL`**、**链**与 **indexer** 与 **B-381** 一致（**`CHAIN_RPC_URL`**、**`FEE_ROUTER_ADDRESS`**、**`GOVERNANCE_POOL_SSOT_TOKEN_ADDRESS`** 等按环境已配）；须 **admin** 会话。
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  与 API **一致**（**`X-Internal-Api-Secret`**）
#   ADMIN_BEARER_TOKEN   与浏览器 Admin **Bearer** 同源（**勿**入库；**不含** `Bearer ` 前缀）
#
# 退出码：
#   0  两段 JSON **深相等**（**`jq` `==`**）
#   1  缺 **jq** / 缺 **`INTERNAL_API_SECRET`** / 缺 **`ADMIN_BEARER_TOKEN`**
#   2  reconcile 或 overview **HTTP** **≠** **200**
#   3  reconcile **200** 体缺少 **`governance_pool_db_vs_chain_balance_drift_observability`**
#   4  overview 缺少 **`overview.governance_pool_db_vs_chain_balance_drift_observability`**
#   5  两段 **JSON** **不相等**（stderr 打印 **`diff` 友好摘要**）
#
# Windows：须 **Git Bash** + **jq**。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_EXPECT="381-GOVERNANCE-POOL-DB-VS-CHAIN-BALANCE-DRIFT-OBS-V1"

if ! command -v jq >/dev/null 2>&1; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

rec="$(mktemp)"
adm="$(mktemp)"
trap 'rm -f "$rec" "$adm"' EXIT

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_governance_pool_db_vs_chain_balance_drift_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 1200 "$rec" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e '.governance_pool_db_vs_chain_balance_drift_observability != null' "$rec" >/dev/null 2>&1; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: missing governance_pool_db_vs_chain_balance_drift_observability in reconcile body" >&2
  exit 3
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  '(.governance_pool_db_vs_chain_balance_drift_observability.anchor == $a)' "$rec" >/dev/null \
  || {
    echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: unexpected anchor in reconcile leg" >&2
    jq '.governance_pool_db_vs_chain_balance_drift_observability.anchor' "$rec" >&2
    exit 3
  }

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 1200 "$adm" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e '.overview.governance_pool_db_vs_chain_balance_drift_observability != null' "$adm" >/dev/null 2>&1; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: missing overview.governance_pool_db_vs_chain_balance_drift_observability" >&2
  exit 4
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  '(.overview.governance_pool_db_vs_chain_balance_drift_observability.anchor == $a)' "$adm" >/dev/null \
  || {
    echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: unexpected anchor in overview leg" >&2
    jq '.overview.governance_pool_db_vs_chain_balance_drift_observability.anchor' "$adm" >&2
    exit 4
  }

# 深比较：persist 写入的 summary 键与 admin 回读须一致
eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
  '($r[0].governance_pool_db_vs_chain_balance_drift_observability) == ($a[0].overview.governance_pool_db_vs_chain_balance_drift_observability)')"
if [[ "$eq" != "true" ]]; then
  echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: reconcile vs admin overview JSON mismatch" >&2
  echo "reconcile_obs:" >&2
  jq '.governance_pool_db_vs_chain_balance_drift_observability' "$rec" >&2
  echo "overview_obs:" >&2
  jq '.overview.governance_pool_db_vs_chain_balance_drift_observability' "$adm" >&2
  exit 5
fi

marker="$(jq -r '.overview.governance_pool_db_vs_chain_balance_drift_observability.marker // empty' "$adm")"
echo "b381-governance-pool-drift-reconcile-admin-overview-smoke.sh: ok (marker=${marker}; anchor=${ANCHOR_EXPECT}; reconcile == admin overview)"
exit 0
