#!/usr/bin/env bash
# Official-First · Staging clean rebuild (PRODUCT plane · DESTRUCTIVE staging only).
#
# Policy:
#   - Official Production = PRODUCT SSOT
#   - Wipe Staging DB schema / redeploy Official pin — NEVER touch Production MPG
#   - NO Production business data copy — sanitized seed only
#   - WEB3 Candidate labels remain ED on staging bake (plane-map)
#
#   TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1 \
#     bash scripts/dev/official-first-clean-rebuild-staging.sh
#
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EV="$ROOT/evidence/GO_official_product_reality_capture"

[[ "${TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK:-}" == "1" ]] \
  || { echo "official-first-clean-rebuild-staging: FAIL set TRAVELTRUST_OFFICIAL_FIRST_STAGING_CLEAN_REBUILD_OK=1" >&2; exit 2; }

echo "official-first-clean-rebuild-staging: Phase D — Owner-gated staging rebuild"
echo "official-first-clean-rebuild-staging: STOP scaffold — requires Owner Staging DSN + deploy auth"
echo ""
echo "Planned steps (not auto-executed):"
echo "  1. Staging DB schema drop/recreate (NOT Production)"
echo "  2. TRAVELTRUST_STAGING_V9_ALIGN_OK=1 bash scripts/dev/align-staging-www-official-v9.sh"
echo "  3. sqlx migrate run on Staging (Git 157)"
echo "  4. sanitized seed (no prod PII)"
echo "  5. bash scripts/dev/capture-env-schema-readonly.sh staging"
echo "  6. compare-official-prod-schema-layers.py --staging-capture ..."
echo ""
echo "official-first-clean-rebuild-staging: scaffold only — set Staging credentials and extend this script"
