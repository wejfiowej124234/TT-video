#!/usr/bin/env bash
# TT_STAGING_RC_BASELINE · full public surface audit orchestrator (read-only · ②).
#
#   bash scripts/dev/run-staging-rc-baseline-full-surface-audit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="${RC_BASELINE_AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_staging_rc_baseline/audit/$STAMP"
API_BASE="${API_BASE:-https://tt-api-staging.fly.dev}"
WEB_BASE="${WEB_BASE:-https://tt-web-staging.fly.dev}"

mkdir -p "$EVID"
git rev-parse HEAD >"$EVID/local-git-sha.txt"

fail() { echo "RC_BASELINE_AUDIT: FAIL $*" | tee "$EVID/STATUS.txt"; exit 1; }

echo "== [1/5] Public surface checklist audit =="
RC_BASELINE_AUDIT_DIR="$EVID" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" \
  node "$ROOT/scripts/dev/audit-staging-rc-baseline-public-surfaces.cjs" "$EVID" 2>&1 | tee "$EVID/public-surface.log" || AUDIT_RC=$?
AUDIT_RC=${AUDIT_RC:-0}

echo "== [2/5] SSOT parity =="
OCS_STATE="${OCS_STATE:-}" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" SSOT_EVIDENCE_DIR="$EVID/parity" \
  node "$ROOT/scripts/dev/validate-staging-rc-ssot-parity.cjs" "$EVID/parity" 2>&1 | tee "$EVID/parity.log" || PARITY_RC=$?
PARITY_RC=${PARITY_RC:-0}

echo "== [3/5] Baseline enforcement =="
RC_BASELINE_EVIDENCE_DIR="$EVID/enforcement" API_BASE="$API_BASE" WEB_BASE="$WEB_BASE" \
  node "$ROOT/scripts/dev/validate-staging-rc-baseline-enforcement.cjs" "$EVID/enforcement" 2>&1 | tee "$EVID/enforcement.log" || ENF_RC=$?
ENF_RC=${ENF_RC:-0}

echo "== [4/5] Display Data Governance (full-site) =="
OCS_DDG_REMEDIATION_MODE=1 FS_DG_JSON="$EVID/fs-dg-audit.json" API_BASE="$API_BASE" \
  node "$ROOT/scripts/dev/staging-full-site-display-governance-audit.cjs" 2>&1 | tee "$EVID/fs-dg.log" || DDG_RC=$?
DDG_RC=${DDG_RC:-0}

echo "== [5/5] Signoff =="
VERDICT="PASS"
for rc in "$AUDIT_RC" "$PARITY_RC" "$ENF_RC" "$DDG_RC"; do
  [[ "$rc" -eq 0 ]] || VERDICT="FAIL"
done

cat >"$EVID/staging-rc-baseline-full-audit-signoff.json" <<EOF
{
  "schema": "traveltrust.staging_rc_baseline.full_audit.signoff.v1",
  "stamp": "${STAMP}",
  "environment": "staging",
  "recorded_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verdict": "${VERDICT}",
  "machine_keys": {
    "TT_STAGING_RC_BASELINE_AUDIT": "${VERDICT}",
    "TT_STAGING_RC_BASELINE": "$([ "$ENF_RC" -eq 0 ] && echo READY || echo DRIFT)",
    "TT_STAGING_RC_SSOT_PARITY": "$([ "$PARITY_RC" -eq 0 ] && echo ALIGNED || echo FAIL)"
  },
  "steps": {
    "public_surface_audit_rc": ${AUDIT_RC},
    "ssot_parity_rc": ${PARITY_RC},
    "baseline_enforcement_rc": ${ENF_RC},
    "display_governance_rc": ${DDG_RC}
  },
  "ssot_chain": "RC → dataset.v1.json → assets.v1.json → Public Surface",
  "honest_boundary": "Audit PASS ≠ Production GO",
  "remediation": "bash scripts/dev/run-staging-rc-baseline-final-alignment.sh"
}
EOF

if [[ "$VERDICT" != "PASS" ]]; then
  echo "TT_STAGING_RC_BASELINE_AUDIT: FAIL" >"$EVID/STATUS.txt"
  fail "see $EVID"
fi

echo "TT_STAGING_RC_BASELINE_AUDIT: PASS" >"$EVID/STATUS.txt"
echo "evidence=$EVID"
echo "RC_BASELINE_AUDIT: OK"
