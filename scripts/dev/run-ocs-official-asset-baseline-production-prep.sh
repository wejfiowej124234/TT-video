#!/usr/bin/env bash
# Official Asset Baseline V1 · Production cutover PREP (③ prep — not VERIFIED).
#
#   bash scripts/dev/run-ocs-official-asset-baseline-production-prep.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${OCS_PROD_PREP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
PREP="$ROOT/evidence/GO_production_readiness/G3-01/preparation/ocs-production-baseline-prep-${STAMP}"
mkdir -p "$PREP"

node "$ROOT/scripts/dev/generate-g3-cdn-implementation-artifacts.cjs" "$ROOT/evidence/GO_production_readiness/G3-01/preparation" >/dev/null

URL_MAP="$ROOT/evidence/GO_production_readiness/G3-01/preparation/production-cdn-url-map.v1.json"
STAGING_SIGN="$ROOT/evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z/ocs-official-asset-baseline-signoff.json"

[[ -f "$URL_MAP" ]] || { echo "FAIL: missing production-cdn-url-map"; exit 1; }
[[ -f "$STAGING_SIGN" ]] || { echo "FAIL: missing staging asset baseline signoff"; exit 1; }

cp "$URL_MAP" "$PREP/production-cdn-url-map.v1.json"
cp "$STAGING_SIGN" "$PREP/staging-asset-baseline-signoff-ref.json"

cat >"$PREP/ocs-production-baseline-prep.json" <<EOF
{
  "schema": "traveltrust.ocs_production_baseline_prep.v1",
  "stamp": "${STAMP}",
  "baseline": "Official Asset Baseline V1",
  "staging_verified": "evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z",
  "production_target": "https://cdn.traveltrust.app/official-cold-start/v1/",
  "asset_count": 60,
  "cutover_scripts": [
    "scripts/dev/bootstrap-ocs-official-assets-to-r2.cjs --apply",
    "scripts/dev/configure-production-media-r2-cdn.sh",
    "scripts/dev/remediate-ocs-official-media-bindings-staging.cjs (production DATABASE_URL + CDN URLs)"
  ],
  "machine_keys": {
    "TT_OCS_OFFICIAL_ASSET_BASELINE_V1": "VERIFIED",
    "TT_OCS_OFFICIAL_ASSET_BASELINE_PRODUCTION": "PLANNED",
    "TT_G3_PRODUCTION_CDN_VERIFIED": "PLANNED"
  },
  "honest_boundary": "Staging VERIFIED + prep map ≠ Production asset delivery on CDN edge"
}
EOF

echo "TT_OCS_OFFICIAL_ASSET_BASELINE_PRODUCTION: PLANNED" >"$PREP/STATUS.txt"
echo "staging_ref=20260704T085638Z" >>"$PREP/STATUS.txt"
echo "evidence=$PREP"
echo "OCS_PRODUCTION_BASELINE_PREP: OK"
