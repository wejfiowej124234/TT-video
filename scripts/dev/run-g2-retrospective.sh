#!/usr/bin/env bash
# G2 Retrospective — freeze immutable G2 baseline before G3 (release process only).
#
#   bash scripts/dev/run-g2-retrospective.sh
#
# Prerequisites:
#   TT_PRODUCTION_READINESS_G2_GATE: PASS
#   TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE
#   TT_G2_REALITY_VERIFICATION: COMPLETE
#
# Does NOT: re-run probes · add platform capabilities · modify G2 sign-offs
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g2-retrospective/${STAMP}"

fail() { echo "G2-RETROSPECTIVE: FAIL $*"; exit 1; }
ok() { echo "G2-RETROSPECTIVE: OK $*"; }
step() { echo ""; echo "=== $* ==="; }

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

echo "=== G2 Retrospective · ${STAMP} ==="

step "0 · Preflight (G2 Gate PASS · Formal COMPLETE)"
rg -q 'TT_PRODUCTION_READINESS_G2_GATE: PASS' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_PRODUCTION_READINESS_G2_GATE not PASS"
rg -q 'TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_WAVE2_FORMAL_ACCEPTANCE not COMPLETE"
rg -q 'TT_G2_REALITY_VERIFICATION: COMPLETE' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_G2_REALITY_VERIFICATION not COMPLETE"
ok "Preflight satisfied — G2 closed, ready to freeze baseline"

step "1 · Generate retrospective artifacts"
node -e "
const { generate } = require('./scripts/dev/lib/g2-retrospective.cjs');
const r = generate({ evidenceDir: '${EVID}', stamp: '${STAMP}' });
if (!r.pass) {
  console.error('Generate blocked:', r.signoff.verdict);
  process.exit(1);
}
console.log('TT_G2_RETROSPECTIVE:', r.machineKeys.TT_G2_RETROSPECTIVE);
"

step "2 · Validate signoff + artifacts"
node scripts/dev/validate-g2-retrospective.cjs --evidence-dir "$EVID"

step "3 · Matrix machine key (G2 baseline frozen)"
node -e "
const fs=require('fs');
const p='registry/production-readiness-master-matrix.v1.yaml';
let y=fs.readFileSync(p,'utf8');
if (/TT_G2_RETROSPECTIVE:/.test(y)) y=y.replace(/TT_G2_RETROSPECTIVE: \\w+/, 'TT_G2_RETROSPECTIVE: COMPLETE');
else y=y.replace(/(machine_keys:\\r?\\n)/, '\$1  TT_G2_RETROSPECTIVE: COMPLETE\\n');
y=y.replace(/updated_utc: \"[^\"]+\"/, 'updated_utc: \"' + new Date().toISOString().replace(/\\.\\d{3}Z\$/, 'Z') + '\"');
fs.writeFileSync(p,y);
"

mkdir -p evidence/GO_production_readiness/g2-retrospective/latest
cp -f "$EVID/g2-retrospective-signoff.json" evidence/GO_production_readiness/g2-retrospective/latest/g2-retrospective-signoff.json
cp -f "$EVID/g3-entry-checklist.json" evidence/GO_production_readiness/g2-retrospective/latest/g3-entry-checklist.json

ok "G2 Retrospective COMPLETE"
echo "Evidence: $EVID"
echo "TT_G2_RETROSPECTIVE: COMPLETE"
echo "G3 entry checklist: $EVID/g3-entry-checklist.json"
echo "Honest boundary: G2 baseline frozen · next work = G3 production go-live only"
