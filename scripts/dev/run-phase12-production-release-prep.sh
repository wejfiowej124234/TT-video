#!/usr/bin/env bash
# Phase ①② 发布前准备 + Phase ③ 切线准备（非 Production GO · 发布等一下）
#
#   bash scripts/dev/run-phase12-production-release-prep.sh
#
# SSOT: registry/production-release-prep.v1.yaml
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${RELEASE_PREP_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_production_readiness/phase12-release-prep/${STAMP}"
mkdir -p "$EVID"

fail() { echo "RELEASE_PREP: FAIL $*" >&2; exit 1; }

echo "== Phase ①②③ prep · G3 Production CDN =="
bash "$ROOT/scripts/dev/run-g3-production-cdn-prep.sh" 2>&1 | tee "$EVID/g3-cdn-prep.log" || fail "g3 cdn prep"

echo "== Phase ③ prep · OCS Production baseline map =="
bash "$ROOT/scripts/dev/run-ocs-official-asset-baseline-production-prep.sh" 2>&1 | tee "$EVID/ocs-production-baseline-prep.log" || fail "ocs production prep"

echo "== Phase ③ prep · Production GO entry checklist =="
bash "$ROOT/scripts/dev/run-production-go-prep.sh" 2>&1 | tee "$EVID/production-go-prep.log" || fail "production go prep"

git rev-parse HEAD >"$EVID/local-git-sha.txt"

cat >"$EVID/phase12-release-prep-signoff.json" <<EOF
{
  "schema": "traveltrust.phase12_release_prep.signoff.v1",
  "stamp": "${STAMP}",
  "recorded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verdict": "PREP_COMPLETE",
  "machine_keys": {
    "TT_PRODUCTION_RELEASE_PREP": "READY",
    "TT_G3_PRODUCTION_CDN_PREP": "READY",
    "TT_G3_PRODUCTION_CDN_VERIFIED": "PLANNED",
    "TT_OCS_OFFICIAL_ASSET_BASELINE_V1": "VERIFIED",
    "TT_PRODUCTION_GO_PREP": "READY",
    "TT_PRODUCTION_GO": "NO_GO"
  },
  "phase_status": {
    "phase1_local": "COMPLETE",
    "phase2_staging": "COMPLETE",
    "phase3_production_cutover": "DEFERRED",
    "production_go": "DEFERRED"
  },
  "enterprise_chain": [
    "SSOT",
    "Official Catalog",
    "Official Asset",
    "Feed",
    "Guide",
    "Provider",
    "Community",
    "Campaign",
    "Acquisition"
  ],
  "evidence_refs": {
    "staging_asset_baseline": "evidence/GO_official_cold_start_dataset/ocs-official-asset-baseline/20260704T085638Z",
    "g3_cdn_prep": "evidence/GO_production_readiness/G3-01/preparation",
    "production_go_prep": "evidence/GO_production_readiness/G3-06/preparation"
  },
  "honest_boundary": "Prep complete — publish deferred — NOT Production GO — NOT G3 CDN VERIFIED",
  "forbidden_claims": ["Production GO", "G3 Production CDN VERIFIED", "Phase ③ GO"]
}
EOF

cat >"$EVID/STATUS.txt" <<EOF
TT_PRODUCTION_RELEASE_PREP: READY
TT_G3_PRODUCTION_CDN_PREP: READY
TT_G3_PRODUCTION_CDN_VERIFIED: PLANNED
TT_PRODUCTION_GO: NO_GO
at=${STAMP}
note=Phase ①② prep complete · Phase ③ cutover deferred · 发布等一下
honest_boundary=NOT Production GO
EOF

echo ""
cat "$EVID/STATUS.txt"
echo "evidence=$EVID"
echo "PHASE12_RELEASE_PREP: OK"
