#!/usr/bin/env bash
# Vertical slice 01: public guide catalog (GET /meta chain_off signal + GET /api/v1/guides).
# Usage: from repo root, with API up:
#   bash scripts/gates/vertical-slice-01-guides-catalog.sh
# Optional: BASE=http://127.0.0.1:8080 bash scripts/gates/vertical-slice-01-guides-catalog.sh

set -euo pipefail
_HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/gates/_http_smoke_retry.sh
source "$_HERE/_http_smoke_retry.sh"

BASE="${BASE:-${NEXT_PUBLIC_API_BASE_URL:-http://127.0.0.1:8080}}"
BASE="${BASE%/}"

echo "vertical-slice-01: BASE=$BASE"

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
echo "$META_JSON" | jq -e '.order_messages.chain_off_mounted' >/dev/null
MOUNTED=$(echo "$META_JSON" | jq -r '.order_messages.chain_off_mounted')
echo "meta.order_messages.chain_off_mounted=$MOUNTED"

GUIDES_JSON=$(http_get_with_retry "$BASE/api/v1/guides" "/api/v1/guides")
echo "$GUIDES_JSON" | jq -e '.status == "ok"' >/dev/null
COUNT=$(echo "$GUIDES_JSON" | jq '.items | length')
echo "GET /api/v1/guides items.length=$COUNT"

if [[ "$MOUNTED" != "true" ]]; then
  echo "warn: chain_off not mounted — catalog is empty-by-design in this mode; start API with DATABASE_URL + chain_off (see TT-9623)." >&2
  exit 2
fi

echo "pass: vertical-slice-01 guides catalog smoke (chain_off mounted)"
exit 0
