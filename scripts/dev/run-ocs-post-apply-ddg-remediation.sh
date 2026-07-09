#!/usr/bin/env bash
# OCS Post-Apply DDG Remediation · OCS Surface Expansion 收尾（非 G3 · 非新平台能力）
#
#   bash scripts/dev/run-ocs-post-apply-ddg-remediation.sh
#
# Prerequisites: TT_OCS_SURFACE_EXPANSION=VERIFIED (Staging 10/10)
# Outcome: TT_OCS_POST_APPLY_DDG: PASS + independent DDG evidence
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${OCS_DDG_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
EVID="${OCS_DDG_EVIDENCE_DIR:-$ROOT/evidence/GO_official_cold_start_dataset/ocs-post-apply-ddg-remediation/$STAMP}"

export API_BASE API="$API_BASE"
export OCS_DDG_EVIDENCE_DIR="$EVID"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"

OCS_STATE="${OCS_STATE:-}"
if [[ -z "$OCS_STATE" ]]; then
  OCS_STATE="$(node -e "const {findLatestOcsStatePath}=require('$ROOT/scripts/dev/lib/smoke-data-heuristics.cjs'); console.log(findLatestOcsStatePath('$ROOT')||'');")"
fi
[[ -n "$OCS_STATE" && -f "$OCS_STATE" ]] || {
  echo "FAIL: missing OCS state — run OCS Surface Expansion Staging first" >&2
  exit 1
}

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"
echo "staging_api=$API_BASE" >"$EVID/staging-target.txt"
echo "ocs_state=$OCS_STATE" >>"$EVID/staging-target.txt"
echo "TT_OCS_POST_APPLY_DDG: IMPLEMENTING" >"$EVID/STATUS.txt"

echo "== OCS Post-Apply DDG · Official Avatar remediation =="
export STATE="$OCS_STATE"
export OUT="$EVID/ocs-official-avatar-remediation.json"
node "$ROOT/scripts/dev/remediate-ocs-official-avatars-staging.cjs" 2>&1 | tee "$EVID/avatar-remediation.log"

echo "== OCS Post-Apply DDG · staging-full-site-display-governance-audit =="
export OCS_STATE_PATH="$OCS_STATE"
export OCS_DDG_REMEDIATION_MODE=1
DDG_RC=0
API="$API_BASE" FS_DG_JSON="$EVID/fs-dg-audit.json" OCS_STATE="$OCS_STATE" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg-audit.log" || DDG_RC=$?

node "$ROOT/scripts/dev/write-ocs-post-apply-ddg-signoff.cjs" "$EVID" "$STAMP" "$API_BASE" "$OCS_STATE" \
  2>&1 | tee "$EVID/signoff-summary.log"

if [[ "$DDG_RC" -eq 0 ]]; then
  cat > "$EVID/STATUS.txt" <<EOF
TT_OCS_POST_APPLY_DDG: PASS
TT_OCS_OFFICIAL_CONTENT_BASELINE: READY
environment: staging
at=${STAMP}
api=${API_BASE}
signoff=ocs-post-apply-ddg-signoff.json
evidence=${EVID#"$ROOT/"}
note=OCS Surface Expansion 收尾 · DDG PASS · G3 Official Content Baseline input ready
EOF
  echo "Evidence: $EVID"
  echo "TT_OCS_POST_APPLY_DDG: PASS"
  exit 0
fi

cat > "$EVID/STATUS.txt" <<EOF
TT_OCS_POST_APPLY_DDG: READY_FOR_REMEDIATION
environment: staging
at=${STAMP}
api=${API_BASE}
ddg_rc=${DDG_RC}
evidence=${EVID#"$ROOT/"}
note=Fix REAL_LEAK / avatar remediation and re-run
EOF
echo "Evidence: $EVID"
echo "TT_OCS_POST_APPLY_DDG: READY_FOR_REMEDIATION (not PASS)"
exit 1
