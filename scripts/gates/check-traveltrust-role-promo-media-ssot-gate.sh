#!/usr/bin/env bash
# Role promo Media Asset SSOT gate — Git LFS binaries + registry checksums.
# Fail-closed for clean bake. ≠ Production GO.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
REG="registry/traveltrust-role-promo-media-assets.v1.yaml"
MANIFEST="frontend/public/media/traveltrust/roles/PROMO-MANIFEST.json"

echo "TT_ROLE_PROMO_MEDIA_SSOT_GATE: start"
[[ -f "$REG" ]] || { echo "FAIL missing $REG"; exit 1; }
[[ -f "$MANIFEST" ]] || { echo "FAIL missing $MANIFEST"; exit 1; }
grep -q 'machine_key: TT_ROLE_PROMO_MEDIA_ASSETS' "$REG" || { echo "FAIL machine_key"; exit 1; }

node scripts/dev/sync-traveltrust-role-promo-videos.cjs --verify
echo "TT_ROLE_PROMO_MEDIA_SSOT_GATE: PASS"
exit 0
