#!/usr/bin/env bash
# **TT-B388**：**B-388** — **`POST …/internal/indexer-reconcile`**
# **三步**：先 **B-386** **bundle** **`persist`**；再 **B-387** **`persist:true`** + **`include_revenue_pipeline_bundle_cross_snapshot_observability:true`**；
# 最后 **`persist:true`** + **`include_revenue_pipeline_bundle_cross_snapshot_observability:true`**
# + **`include_revenue_pipeline_cross_snapshot_history_trend_observability:true`**
# 与 **`GET …/admin/observability/overview`** **`overview.revenue_pipeline_cross_snapshot_history_trend_observability`** JSON 相等。
#
# 前置：**API**、**`DATABASE_URL`**、**链**（与 **`indexer-reconcile`** 一致）；须 **admin** 会话。
#
# 环境变量：同 **`b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh`**。
#
# 退出码：**0** 深相等；**1** 缺依赖；**2** HTTP；**3/4** 缺键；**5** JSON 不等。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_EXPECT="388-REVENUE-PIPELINE-CROSS-SNAPSHOT-HISTORY-TREND-OBS-V1"
OBS_KEY="revenue_pipeline_cross_snapshot_history_trend_observability"

if ! command -v jq >/dev/null 2>&1; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

seed="$(mktemp)"
cross="$(mktemp)"
rec="$(mktemp)"
adm="$(mktemp)"
trap 'rm -f "$seed" "$cross" "$rec" "$adm"' EXIT

code_seed="$(
  curl -sS -o "$seed" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_revenue_pipeline_log_count_chain_vs_db_bundle_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_seed" != "200" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: seed indexer-reconcile HTTP ${code_seed} (expected 200)" >&2
  head -c 1200 "$seed" >&2 || true
  echo >&2
  exit 2
fi

code_cross="$(
  curl -sS -o "$cross" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_revenue_pipeline_bundle_cross_snapshot_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_cross" != "200" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: cross (B-387) indexer-reconcile HTTP ${code_cross} (expected 200)" >&2
  head -c 1200 "$cross" >&2 || true
  echo >&2
  exit 2
fi

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_revenue_pipeline_bundle_cross_snapshot_observability\":true,\"include_revenue_pipeline_cross_snapshot_history_trend_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: history (B-388) indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 1200 "$rec" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".${OBS_KEY} != null" "$rec" >/dev/null 2>&1; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: missing ${OBS_KEY} in reconcile body" >&2
  exit 3
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.${OBS_KEY}.anchor == \$a)" "$rec" >/dev/null \
  || {
    echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: unexpected anchor in reconcile leg" >&2
    jq ".${OBS_KEY}.anchor" "$rec" >&2
    exit 3
  }

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 1200 "$adm" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".overview.${OBS_KEY} != null" "$adm" >/dev/null 2>&1; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: missing overview.${OBS_KEY}" >&2
  exit 4
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.overview.${OBS_KEY}.anchor == \$a)" "$adm" >/dev/null \
  || {
    echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: unexpected anchor in overview leg" >&2
    jq ".overview.${OBS_KEY}.anchor" "$adm" >&2
    exit 4
  }

eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
  "(\$r[0].${OBS_KEY}) == (\$a[0].overview.${OBS_KEY})")"
if [[ "$eq" != "true" ]]; then
  echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: reconcile vs admin overview JSON mismatch" >&2
  echo "reconcile_obs:" >&2
  jq ".${OBS_KEY}" "$rec" >&2
  echo "overview_obs:" >&2
  jq ".overview.${OBS_KEY}" "$adm" >&2
  exit 5
fi

note="$(jq -r ".overview.${OBS_KEY}.observation_note // empty" "$adm")"
streak="$(jq -r ".overview.${OBS_KEY}.consecutive_drift_streak // empty" "$adm")"
echo "b388-revenue-pipeline-cross-snapshot-history-trend-reconcile-admin-overview-smoke.sh: ok (observation_note=${note}; consecutive_drift_streak=${streak}; anchor=${ANCHOR_EXPECT}; reconcile == admin overview)"
exit 0
