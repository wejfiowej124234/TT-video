#!/usr/bin/env bash
# **TT-B395**：**B-395** **spread** **分层** **诊断** — **`POST …/internal/indexer-reconcile`**
#（**`persist:true`** + **`include_revenue_pipeline_spread_stratified_observability:true`**）
# 与 **`GET …/admin/observability/overview`** **`overview.revenue_pipeline_spread_stratified_observability`** JSON 相等。
#
# 前置：**API**、**`DATABASE_URL`**、**链**（与 **`indexer-reconcile`** 一致）；须 **admin** 会话。
#
# 环境变量：
#   API_BASE_URL         默认 http://127.0.0.1:8080
#   INTERNAL_API_SECRET  **`X-Internal-Api-Secret`**
#   ADMIN_BEARER_TOKEN   Admin **Bearer**（**勿**入库；**不含** `Bearer ` 前缀）
#
# 退出码：同 **`b394-revenue-pipeline-per-leg-projection-max-block-spread-reconcile-admin-overview-smoke.sh`**。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_EXPECT="395-REVENUE-PIPELINE-SPREAD-STRATIFIED-OBS-V1"
OBS_KEY="revenue_pipeline_spread_stratified_observability"

if ! command -v jq >/dev/null 2>&1; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: ADMIN_BEARER_TOKEN is required" >&2
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
    -d "{\"persist\":true,\"include_revenue_pipeline_spread_stratified_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 1200 "$rec" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".${OBS_KEY} != null" "$rec" >/dev/null 2>&1; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: missing ${OBS_KEY} in reconcile body" >&2
  exit 3
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.${OBS_KEY}.anchor == \$a)" "$rec" >/dev/null \
  || {
    echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: unexpected anchor in reconcile leg" >&2
    jq ".${OBS_KEY}.anchor" "$rec" >&2
    exit 3
  }

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 1200 "$adm" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".overview.${OBS_KEY} != null" "$adm" >/dev/null 2>&1; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: missing overview.${OBS_KEY}" >&2
  exit 4
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.overview.${OBS_KEY}.anchor == \$a)" "$adm" >/dev/null \
  || {
    echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: unexpected anchor in overview leg" >&2
    jq ".overview.${OBS_KEY}.anchor" "$adm" >&2
    exit 4
  }

eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
  "(\$r[0].${OBS_KEY}) == (\$a[0].overview.${OBS_KEY})")"
if [[ "$eq" != "true" ]]; then
  echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: reconcile vs admin overview JSON mismatch" >&2
  echo "reconcile_obs:" >&2
  jq ".${OBS_KEY}" "$rec" >&2
  echo "overview_obs:" >&2
  jq ".overview.${OBS_KEY}" "$adm" >&2
  exit 5
fi

mk="$(jq -r ".overview.${OBS_KEY}.marker // empty" "$adm")"
layer="$(jq -r ".overview.${OBS_KEY}.spread_anomaly_layer // empty" "$adm")"
echo "b395-revenue-pipeline-spread-stratified-reconcile-admin-overview-smoke.sh: ok (marker=${mk}; spread_anomaly_layer=${layer}; anchor=${ANCHOR_EXPECT}; reconcile == admin overview)"
exit 0
