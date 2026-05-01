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
export BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"

bash "$_HERE/vertical-slice-02-main-spine.sh"

GUIDES_JSON=$(curl -sfS "${BASE%/}/api/v1/guides")
echo "$GUIDES_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$GUIDES_JSON" | jq -e '.items | type == "array"' >/dev/null
NG=$(echo "$GUIDES_JSON" | jq '.items | length')
echo "GET /api/v1/guides items.length=$NG"

echo "pass: vertical-slice-03 market hub public smoke (02 + GET /api/v1/guides)"
exit 0
