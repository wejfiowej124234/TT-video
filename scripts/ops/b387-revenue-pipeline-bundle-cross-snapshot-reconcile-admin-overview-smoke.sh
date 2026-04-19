#!/usr/bin/env bash
# **TT-B387**：**B-387** — **`POST …/internal/indexer-reconcile`**
#（**两次**：先 **B-386** **bundle** **persist**；再 **`persist:true`** + **`include_revenue_pipeline_bundle_cross_snapshot_observability:true`**）
# 与 **`GET …/admin/observability/overview`** **`overview.revenue_pipeline_bundle_cross_snapshot_drift_observability`** JSON 相等。
#
# 前置：**API**、**`DATABASE_URL`**、**链**（与 **`indexer-reconcile`** 一致）；须 **admin** 会话。
#
# 环境变量：同 **`b386-revenue-pipeline-log-count-bundle-reconcile-admin-overview-smoke.sh`**。
#
# 退出码：**0** 深相等；**1** 缺依赖；**2** HTTP；**3/4** 缺键；**5** JSON 不等。

set -euo pipefail

BASE="${API_BASE_URL:-http://127.0.0.1:8080}"
BASE="${BASE%/}"

ANCHOR_EXPECT="387-REVENUE-PIPELINE-BUNDLE-CROSS-SNAPSHOT-DRIFT-OBS-V1"
OBS_KEY="revenue_pipeline_bundle_cross_snapshot_drift_observability"

if ! command -v jq >/dev/null 2>&1; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: jq is required" >&2
  exit 1
fi

if [[ -z "${INTERNAL_API_SECRET:-}" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: INTERNAL_API_SECRET is required" >&2
  exit 1
fi

if [[ -z "${ADMIN_BEARER_TOKEN:-}" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: ADMIN_BEARER_TOKEN is required" >&2
  exit 1
fi

seed="$(mktemp)"
rec="$(mktemp)"
adm="$(mktemp)"
trap 'rm -f "$seed" "$rec" "$adm"' EXIT

# Seed prior persisted bundle (B-386) so the cross-snapshot leg has a comparable prior_report_id + prior bundle.
code_seed="$(
  curl -sS -o "$seed" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_revenue_pipeline_log_count_chain_vs_db_bundle_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_seed" != "200" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: seed indexer-reconcile HTTP ${code_seed} (expected 200)" >&2
  head -c 1200 "$seed" >&2 || true
  echo >&2
  exit 2
fi

code_rec="$(
  curl -sS -o "$rec" -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}" \
    -X POST \
    -d "{\"persist\":true,\"include_revenue_pipeline_bundle_cross_snapshot_observability\":true}" \
    "${BASE}/api/v1/internal/indexer-reconcile"
)"

if [[ "$code_rec" != "200" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: indexer-reconcile HTTP ${code_rec} (expected 200)" >&2
  head -c 1200 "$rec" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".${OBS_KEY} != null" "$rec" >/dev/null 2>&1; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: missing ${OBS_KEY} in reconcile body" >&2
  exit 3
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.${OBS_KEY}.anchor == \$a)" "$rec" >/dev/null \
  || {
    echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: unexpected anchor in reconcile leg" >&2
    jq ".${OBS_KEY}.anchor" "$rec" >&2
    exit 3
  }

code_adm="$(
  curl -sS -o "$adm" -w "%{http_code}" \
    -H "Authorization: Bearer ${ADMIN_BEARER_TOKEN}" \
    "${BASE}/api/v1/admin/observability/overview"
)"

if [[ "$code_adm" != "200" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: admin observability overview HTTP ${code_adm} (expected 200)" >&2
  head -c 1200 "$adm" >&2 || true
  echo >&2
  exit 2
fi

if ! jq -e ".overview.${OBS_KEY} != null" "$adm" >/dev/null 2>&1; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: missing overview.${OBS_KEY}" >&2
  exit 4
fi

jq -e --arg a "$ANCHOR_EXPECT" \
  "(.overview.${OBS_KEY}.anchor == \$a)" "$adm" >/dev/null \
  || {
    echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: unexpected anchor in overview leg" >&2
    jq ".overview.${OBS_KEY}.anchor" "$adm" >&2
    exit 4
  }

eq="$(jq -n --slurpfile r "$rec" --slurpfile a "$adm" \
  "(\$r[0].${OBS_KEY}) == (\$a[0].overview.${OBS_KEY})")"
if [[ "$eq" != "true" ]]; then
  echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: reconcile vs admin overview JSON mismatch" >&2
  echo "reconcile_obs:" >&2
  jq ".${OBS_KEY}" "$rec" >&2
  echo "overview_obs:" >&2
  jq ".overview.${OBS_KEY}" "$adm" >&2
  exit 5
fi

mk="$(jq -r ".overview.${OBS_KEY}.marker // empty" "$adm")"
rd="$(jq -r ".overview.${OBS_KEY}.rollup_marker_delta // empty" "$adm")"
echo "b387-revenue-pipeline-bundle-cross-snapshot-reconcile-admin-overview-smoke.sh: ok (marker=${mk}; rollup_marker_delta=${rd}; anchor=${ANCHOR_EXPECT}; reconcile == admin overview)"
exit 0
