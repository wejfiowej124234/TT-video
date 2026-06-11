#!/usr/bin/env bash
# Vertical slice 03: TT-9627 §2 — /market hub public read APIs (① smoke).
# Aligns with frontend useMarketPage: getDiscoverOrders + getGuides (04 routes.discoverOrders + routes.guides).
# Runs vertical-slice-02 first (health + meta + meta/build + discover + chain_off note), then GET /api/v1/guides.
# Do not re-fetch /meta here: 02 already validated it; a second GET caused intermittent 408s under load.
#
# Usage (API must be listening):
#   bash scripts/gates/vertical-slice-03-market-hub-public-smoke.sh
#   BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-03-market-hub-public-smoke.sh

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_ROOT="$(cd "$_HERE/../.." && pwd)"
export BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"

load_internal_api_secret() {
  if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
    return 0
  fi
  [[ -f "$_ROOT/.env" ]] || return 0
  local line
  line="$(grep -E '^INTERNAL_API_SECRET=' "$_ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export INTERNAL_API_SECRET="${line#INTERNAL_API_SECRET=}"
  INTERNAL_API_SECRET="${INTERNAL_API_SECRET%\"}"
  INTERNAL_API_SECRET="${INTERNAL_API_SECRET#\"}"
}

bash "$_HERE/vertical-slice-02-main-spine.sh"

GUIDES_JSON=$(curl -sfS "${BASE%/}/api/v1/guides")
echo "$GUIDES_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$GUIDES_JSON" | jq -e '.items | type == "array"' >/dev/null
NG=$(echo "$GUIDES_JSON" | jq '.items | length')
echo "GET /api/v1/guides items.length=$NG"

# 公众 catalog 数据分离（P3_CHAIN_OFF=1 或 TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 时默认开启）
if echo "$GUIDES_JSON" | jq -e '[.items[]? | select((.bio // "") | test("测试向导|用于联调"))] | length == 0' >/dev/null; then
  echo "guides: no seed/smoke bios in public catalog"
else
  echo "FAIL: guides public catalog contains seed/smoke bio (data_origin filter)" >&2
  exit 1
fi
DUP_USERS=$(echo "$GUIDES_JSON" | jq '[.items[]?.user_id] | map(select(. != null)) | group_by(.) | map(select(length > 1)) | length')
if [[ "$DUP_USERS" != "0" ]]; then
  echo "FAIL: guides public catalog has duplicate user_id rows (expected dedupe_latest_per_user)" >&2
  exit 1
fi
echo "guides: user_id dedupe OK"

load_internal_api_secret
STATS_CURL=(-sfS)
if [[ -n "${INTERNAL_API_SECRET:-}" ]]; then
  STATS_CURL+=(-H "X-Internal-Api-Secret: ${INTERNAL_API_SECRET}")
fi
STATS_JSON=$(curl "${STATS_CURL[@]}" "${BASE%/}/api/v1/internal/public-catalog-surface/stats")
echo "$STATS_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$STATS_JSON" | jq -e '.filter_enabled | type == "boolean"' >/dev/null
echo "GET /internal/public-catalog-surface/stats filter_enabled=$(echo "$STATS_JSON" | jq -r '.filter_enabled')"

echo "pass: vertical-slice-03 market hub public smoke (02 + GET /api/v1/guides + public-catalog ABI)"
exit 0
