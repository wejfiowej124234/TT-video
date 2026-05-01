#!/usr/bin/env bash
# Vertical slice 02: TT-9625 main spine — public / read-only half (① smoke).
# Covers: GET /health, GET /meta, GET /meta/build, GET /api/v1/discover/orders (market list API behind /market).
# Does NOT replace: POST /auth/*, POST /api/v1/orders, GET /api/v1/orders/:id + escrow UI — use E2E or manual evidence (TT-9625 §2, TT-9627 §1).
#
# Usage (API must be listening):
#   bash scripts/gates/vertical-slice-02-main-spine.sh
# Optional:
#   BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-02-main-spine.sh

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/gates/_http_smoke_retry.sh
source "$_HERE/_http_smoke_retry.sh"

BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"
BASE="${BASE%/}"

echo "vertical-slice-02-main-spine: BASE=$BASE"

if ! command -v curl >/dev/null 2>&1; then
  echo "error: curl required" >&2
  exit 1
fi
if ! command -v jq >/dev/null 2>&1; then
  echo "error: jq required" >&2
  exit 1
fi

curl -sfS "$BASE/health" >/dev/null
echo "ok: GET /health"

META_JSON=$(http_get_with_retry "$BASE/meta" "/meta")
echo "$META_JSON" | jq -e '.service == "traveltrust-api"' >/dev/null
echo "$META_JSON" | jq -e '.order_messages | type == "object"' >/dev/null
echo "$META_JSON" | jq -e 'has("order_messages") and (.order_messages | has("chain_off_mounted"))' >/dev/null
MOUNTED=$(echo "$META_JSON" | jq -r '.order_messages.chain_off_mounted')
echo "meta.order_messages.chain_off_mounted=$MOUNTED"

BUILD_JSON=$(http_get_with_retry "$BASE/meta/build" "/meta/build")
echo "$BUILD_JSON" | jq -e '.git_sha | type == "string"' >/dev/null
echo "$BUILD_JSON" | jq -e 'has("build_top_keys")' >/dev/null
echo "ok: GET /meta/build (git_sha + build_top_keys)"

DISCOVER_JSON=$(http_get_with_retry "$BASE/api/v1/discover/orders" "/api/v1/discover/orders")
echo "$DISCOVER_JSON" | jq -e '.status == "ok"' >/dev/null
echo "$DISCOVER_JSON" | jq -e '.items | type == "array"' >/dev/null
N=$(echo "$DISCOVER_JSON" | jq '.items | length')
echo "GET /api/v1/discover/orders items.length=$N"

if [[ "$MOUNTED" != "true" ]]; then
  echo "note: chain_off not mounted — discover list is empty-by-design; segment-1 full spine still needs DB+chain_off or ② evidence (TT-9627 §0.a)."
fi

if [[ -n "${VS02_CHAIN_OFF_STATE_FILE:-}" ]]; then
  printf '%s\n' "$MOUNTED" >"$VS02_CHAIN_OFF_STATE_FILE"
fi

echo "pass: vertical-slice-02 main spine public smoke (health + meta + meta/build + discover/orders)"
exit 0
