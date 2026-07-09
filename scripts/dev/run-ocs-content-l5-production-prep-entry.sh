#!/usr/bin/env bash
# OCS Content L5 CLOSED → Production Preparation entry (② staging asset rebootstrap).
#
#   bash scripts/dev/run-ocs-content-l5-production-prep-entry.sh
#   SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-ocs-content-l5-production-prep-entry.sh  # local prep only
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${OCS_PP_ENTRY_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
API_BASE="${API_BASE:-${API:-https://tt-api-staging.fly.dev}}"
EVID_PP="$ROOT/evidence/GO_production_preparation"
EVID_ENTRY="$EVID_PP/OCS-CONTENT-L5-PRODUCTION-PREP-ENTRY-${STAMP}"
EVID_ASSET="$ROOT/evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/${STAMP}"
mkdir -p "$EVID_ENTRY"

echo "== OCS Content L5 · Production Preparation entry @ ${STAMP} ==" | tee "$EVID_ENTRY/entry.log"

echo "== Preconditions: OCS Content L5 four-key CLOSED ==" | tee -a "$EVID_ENTRY/entry.log"
node "$ROOT/scripts/dev/validate-ocs-content-production-matrix.cjs" --require-ready 2>&1 | tee "$EVID_ENTRY/matrix-require-ready.log"
node "$ROOT/scripts/dev/validate-ocs-content-l5-brief.cjs" 2>&1 | tee "$EVID_ENTRY/brief-validate.log"

echo "== Refresh assets manifest (preserve existing real JPEGs) ==" | tee -a "$EVID_ENTRY/entry.log"
node "$ROOT/scripts/dev/generate-ocs-official-media-assets.cjs" 2>&1 | tee "$EVID_ENTRY/generate-assets.log"

ASSET_BASELINE_RC=0
if [[ "${SKIP_STAGING_BASELINE:-0}" != "1" && "${SKIP_STAGING_DEPLOY:-0}" != "1" ]]; then
  echo "== Staging Official Asset Baseline V1 rebootstrap (real Content L5 media) ==" | tee -a "$EVID_ENTRY/entry.log"
  export API_BASE API="$API_BASE"
  export OCS_STAMP="$STAMP"
  export OCS_ASSET_EVIDENCE_DIR="$EVID_ASSET"
  export TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE="${TRAVELTRUST_STAGING_RC_BASELINE_OVERRIDE:-1}"
  export STAGING_RC_BASELINE_AUTHORIZED="${STAGING_RC_BASELINE_AUTHORIZED:-1}"
  bash "$ROOT/scripts/dev/run-ocs-official-asset-baseline.sh" 2>&1 | tee "$EVID_ENTRY/asset-baseline.log" || ASSET_BASELINE_RC=$?
elif [[ "${SKIP_STAGING_DEPLOY:-0}" == "1" ]]; then
  echo "SKIP_STAGING_DEPLOY=1 — local manifest refresh only" | tee -a "$EVID_ENTRY/entry.log"
  ASSET_BASELINE_RC=2
else
  echo "SKIP_STAGING_BASELINE=1 — evidence-only (baseline already VERIFIED)" | tee -a "$EVID_ENTRY/entry.log"
fi

BYTES_MATCH=0
if node "$ROOT/scripts/dev/check-ocs-staging-media-bytes-parity.cjs" --quiet; then BYTES_MATCH=1; fi

node "$ROOT/scripts/dev/write-ocs-content-l5-production-prep-entry.cjs" \
  --stamp "$STAMP" \
  --asset-baseline-rc "$ASSET_BASELINE_RC" \
  --asset-evidence-dir "evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/${STAMP}" \
  --api "$API_BASE" \
  --staging-bytes-match "$BYTES_MATCH"

if [[ "$ASSET_BASELINE_RC" -ne 0 ]]; then
  echo "WARN: asset baseline rc=$ASSET_BASELINE_RC — entry evidence written; retry without SKIP_STAGING_DEPLOY when staging ready" | tee -a "$EVID_ENTRY/entry.log"
  exit "$ASSET_BASELINE_RC"
fi

echo "TT_OCS_CONTENT_L5_PRODUCTION_PREP_ENTRY: OK evidence=$EVID_ENTRY" | tee -a "$EVID_ENTRY/entry.log"
