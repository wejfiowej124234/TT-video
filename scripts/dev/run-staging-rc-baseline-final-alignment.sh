#!/usr/bin/env bash
# Staging Runtime ↔ SSOT final alignment · Release Candidate baseline (② only · no new features).
#
# Unifies Official Catalog + Official Asset + Public Surface under OCS SSOT.
# SSOT: registry/staging-rc-ssot-alignment.v1.yaml
#
#   bash scripts/dev/run-staging-rc-baseline-final-alignment.sh
#   SKIP_STAGING_DEPLOY=1 bash scripts/dev/run-staging-rc-baseline-final-alignment.sh
set -euo pipefail

export STAGING_RC_BASELINE_ALIGNING=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${RC_BASELINE_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_staging_rc_baseline/$STAMP"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"
SKIP_DEPLOY="${SKIP_STAGING_DEPLOY:-0}"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"

fail() { echo "RC_BASELINE: FAIL $*" | tee "$EVID/STATUS.txt"; exit 1; }

echo "== RC Baseline · SSOT alignment cleanup (12 steps) =="
SSOT_CLEANUP_STAMP="${STAMP}" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" SKIP_STAGING_DEPLOY="$SKIP_DEPLOY" \
  bash "$ROOT/scripts/dev/run-staging-rc-ssot-alignment-cleanup.sh" 2>&1 | tee "$EVID/ssot-cleanup.log" || fail "ssot cleanup"

STATE="$(grep '^ocs_state=' "$ROOT/evidence/GO_staging_rc_ssot_alignment/$STAMP/target.txt" 2>/dev/null | cut -d= -f2- || true)"
[[ -z "$STATE" ]] && STATE="$(find "$ROOT/evidence" -name state.json 2>/dev/null | while read -r f; do
  c="$(node -e "try{process.stdout.write(String(Object.keys(require(process.argv[1]).community_posts||{}).length))}catch(e){process.stdout.write('0')}" "$f" 2>/dev/null || echo 0)"
  echo "$c $f"
done | sort -rn | head -1 | awk '{print $2}')"
[[ -n "$STATE" && -f "$STATE" ]] || fail "missing OCS state"

echo "== OCS Surface Expansion · 11-check re-validate =="
STATE="$STATE" OUT="$EVID/ocs-surface-expansion-signoff.json" API_BASE="$API_BASE" \
  node "$ROOT/scripts/dev/validate-ocs-surface-expansion-staging.cjs" 2>&1 | tee "$EVID/ocs-surface-expansion.log" || fail "ocs surface"

echo "== Display Data Governance · full-site audit =="
OCS_DDG_REMEDIATION_MODE=1 FS_DG_JSON="$EVID/fs-dg-audit.json" API_BASE="$API_BASE" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg-audit.log" || fail "ddg audit"

if [[ ! -f "$EVID/fs-dg-audit.json" ]]; then
  fail "missing fs-dg-audit.json"
fi
BLOCKING="$(python -c "import json,sys; r=json.load(open(sys.argv[1],encoding='utf-8')); c=r.get('issue_counts',{}); print(0 if r.get('verdict')=='PASS' else c.get('PRODUCT_DATA_DEFECT',0)+c.get('TEST_DATA_LEAKAGE',0))" "$EVID/fs-dg-audit.json" 2>/dev/null || echo 999)"
[[ "$BLOCKING" == "0" ]] || fail "ddg blocking=$BLOCKING"

cat >"$EVID/staging-rc-baseline-signoff.json" <<EOF
{
  "schema": "traveltrust.staging_rc_baseline.signoff.v1",
  "stamp": "${STAMP}",
  "environment": "staging",
  "recorded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verdict": "BASELINE_READY",
  "machine_keys": {
    "TT_STAGING_RC_BASELINE": "READY",
    "TT_STAGING_RC_SSOT_PARITY": "ALIGNED",
    "TT_OCS_SURFACE_EXPANSION": "VERIFIED",
    "TT_OCS_OFFICIAL_ASSET_BASELINE_V1": "VERIFIED",
    "TT_PRODUCTION_GO": "NO_GO",
    "TT_G3_PRODUCTION_CDN_VERIFIED": "PLANNED"
  },
  "ssot_unified": {
    "official_catalog": "data/official-cold-start/dataset.v1.json",
    "official_asset": "data/official-cold-start/assets.v1.json + media/",
    "public_surface": "governed views + OCS publish queue",
    "release_candidate": "evidence/manual-uat/signoff/RELEASE-CANDIDATE-SIGNOFF-20260702T144513Z.md",
    "ocs_state": "${STATE#$ROOT/}"
  },
  "expected_runtime": {
    "community_feed": 10,
    "public_guides": 10,
    "market_provider": 10,
    "market_acquisition": 10,
    "official_guides_published": 10,
    "campaigns_deployed": 10,
    "smoke_posts": 0,
    "official_assets": 60
  },
  "unified_baseline": "scripts/dev/lib/staging-rc-public-surface-unified.cjs",
  "evidence": {
    "ssot_alignment": "evidence/GO_staging_rc_ssot_alignment/${STAMP}",
    "ocs_surface": "${EVID#$ROOT/}/ocs-surface-expansion-signoff.json",
    "ddg_audit": "${EVID#$ROOT/}/fs-dg-audit.json"
  },
  "honest_boundary": "Staging RC baseline READY — not Production GO — not public release",
  "forbidden_claims": ["Production GO", "Release published", "G3 CDN VERIFIED"]
}
EOF

ACTIVE="$ROOT/evidence/GO_staging_rc_baseline/ACTIVE.json"
mkdir -p "$(dirname "$ACTIVE")"
cat >"$ACTIVE" <<EOF
{
  "schema": "traveltrust.staging_rc_baseline.active.v1",
  "machine_key": "TT_STAGING_RC_BASELINE",
  "status": "READY",
  "stamp": "${STAMP}",
  "recorded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "git_sha": "$(git rev-parse HEAD)",
  "evidence": "evidence/GO_staging_rc_baseline/${STAMP}",
  "ssot_alignment": "evidence/GO_staging_rc_ssot_alignment/${STAMP}",
  "ocs_state": "${STATE#$ROOT/}",
  "registry": "registry/staging-rc-baseline.v1.yaml",
  "forbidden": ["smoke_data", "non_ocs_public_rows", "legacy_volume_media", "new_business_features"],
  "allowed": ["deployment_sync", "production_cutover_prep"]
}
EOF

echo "TT_STAGING_RC_BASELINE: READY" >"$EVID/STATUS.txt"
echo "TT_STAGING_RC_SSOT_PARITY: ALIGNED" >>"$EVID/STATUS.txt"

unset STAGING_RC_BASELINE_ALIGNING
# shellcheck source=lib/staging-rc-baseline-gate.sh
source "$ROOT/scripts/dev/lib/staging-rc-baseline-gate.sh"
export STAGING_RC_BASELINE_ROOT="$ROOT"
staging_rc_baseline_gate_post_change post-baseline || fail "post-baseline enforcement"

echo "evidence=$EVID"
echo "RC_BASELINE: OK"
