#!/usr/bin/env bash
# Production Readiness Master Reality Audit — last whole-project truth check before G3-01.
#
#   bash scripts/dev/run-production-readiness-master-reality-audit.sh
#
# Prerequisites:
#   TT_G2_RETROSPECTIVE: COMPLETE
#   TT_PRODUCTION_READINESS_G2_GATE: PASS
#
# Does NOT add platform capabilities · tri-state: VERIFIED | PLANNED | DRIFT
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/master-reality-audit/${STAMP}"

fail() { echo "MASTER-REALITY-AUDIT: FAIL $*"; exit 1; }
ok() { echo "MASTER-REALITY-AUDIT: OK $*"; }
step() { echo ""; echo "=== $* ==="; }

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

echo "=== Production Readiness Master Reality Audit · ${STAMP} ==="

step "0 · Preflight"
rg -q 'TT_G2_RETROSPECTIVE: COMPLETE' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_G2_RETROSPECTIVE not COMPLETE"
rg -q 'TT_PRODUCTION_READINESS_G2_GATE: PASS' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_PRODUCTION_READINESS_G2_GATE not PASS"
ok "G2 baseline frozen — ready for master reality audit"

step "1 · Run six-category audit"
node -e "
const { runMasterRealityAudit, writeAuditEvidence } = require('./scripts/dev/lib/production-readiness-master-reality-audit.cjs');
const report = runMasterRealityAudit({ stamp: '${STAMP}' });
writeAuditEvidence('${EVID}', report);
console.log('VERIFIED:', report.gate.verified_count);
console.log('PLANNED:', report.gate.planned_count);
console.log('DRIFT:', report.gate.drift_count);
console.log('G3-01 entry allowed:', report.gate.g3_entry_allowed);
if (!report.gate.g3_entry_allowed) process.exit(2);
"

step "2 · Validate signoff"
node scripts/dev/validate-production-readiness-master-reality-audit.cjs --evidence-dir "$EVID"

step "3 · Matrix machine key"
node -e "
const fs=require('fs');
const p='registry/production-readiness-master-matrix.v1.yaml';
let y=fs.readFileSync(p,'utf8');
const val='PASS';
if (/TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT:/.test(y)) {
  y=y.replace(/TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: \\w+/, 'TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: '+val);
} else {
  y=y.replace(/(machine_keys:\\r?\\n)/, '\$1  TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: '+val+'\\n');
}
y=y.replace(/updated_utc: \"[^\"]+\"/, 'updated_utc: \"' + new Date().toISOString().replace(/\\.\\d{3}Z\$/, 'Z') + '\"');
fs.writeFileSync(p,y);
"

mkdir -p evidence/GO_production_readiness/master-reality-audit/latest
cp -f "$EVID/master-reality-audit.json" evidence/GO_production_readiness/master-reality-audit/latest/master-reality-audit.json

ok "Master Reality Audit PASS"
echo "Evidence: $EVID"
echo "TT_PRODUCTION_READINESS_MASTER_REALITY_AUDIT: PASS"
echo "Next: G3-01 Production Network Reality Verification"
