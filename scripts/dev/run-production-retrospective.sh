#!/usr/bin/env bash
# Production Retrospective — freeze V1 launch baseline (after TT_PRODUCTION_GO: GO).
#
#   bash scripts/dev/run-production-retrospective.sh
#
# Prerequisites:
#   TT_PRODUCTION_READINESS_G3_GATE: PASS
#   TT_PRODUCTION_GO: GO (via Production GO Decision Package only)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/production-retrospective/${STAMP}"

fail() { echo "PRODUCTION-RETROSPECTIVE: FAIL $*"; exit 1; }
ok() { echo "PRODUCTION-RETROSPECTIVE: OK $*"; }
step() { echo ""; echo "=== $* ==="; }

mkdir -p "$EVID"
exec > >(tee -a "$EVID/run.log") 2>&1

echo "=== Production Retrospective · ${STAMP} ==="

step "0 · Preflight"
rg -q 'TT_PRODUCTION_READINESS_G3_GATE: PASS' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_PRODUCTION_READINESS_G3_GATE not PASS"
rg -q 'TT_PRODUCTION_GO: GO' registry/production-readiness-master-matrix.v1.yaml \
  || fail "TT_PRODUCTION_GO not GO — use Production GO Decision Package validator first"
ok "Preflight satisfied"

step "1 · Generate baseline artifacts"
node -e "
const { generate } = require('./scripts/dev/lib/production-retrospective.cjs');
const r = generate({ evidenceDir: '${EVID}', stamp: '${STAMP}' });
if (!r.pass) {
  console.error('Blocked:', r.signoff.verdict);
  process.exit(1);
}
"

step "2 · Validate"
node scripts/dev/validate-production-retrospective.cjs --evidence-dir "$EVID"

step "3 · Matrix machine key"
node -e "
const fs=require('fs');
const p='registry/production-readiness-master-matrix.v1.yaml';
let y=fs.readFileSync(p,'utf8');
if (/TT_PRODUCTION_RETROSPECTIVE:/.test(y)) y=y.replace(/TT_PRODUCTION_RETROSPECTIVE: \\w+/, 'TT_PRODUCTION_RETROSPECTIVE: COMPLETE');
else y=y.replace(/(machine_keys:\\r?\\n)/, '\$1  TT_PRODUCTION_RETROSPECTIVE: COMPLETE\\n');
fs.writeFileSync(p,y);
"

mkdir -p evidence/GO_production_readiness/production-retrospective/latest
cp -f "$EVID/production-retrospective-signoff.json" evidence/GO_production_readiness/production-retrospective/latest/

ok "Production Retrospective COMPLETE"
echo "Evidence: $EVID"
echo "TT_PRODUCTION_RETROSPECTIVE: COMPLETE"
