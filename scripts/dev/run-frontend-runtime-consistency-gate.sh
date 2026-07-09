#!/usr/bin/env bash
# Frontend Runtime Consistency Gate — every Production release mandatory.
# RC → DDG → OCS → FRONTEND_RUNTIME_CONSISTENCY → PI3 → GO
#
#   bash scripts/dev/run-frontend-runtime-consistency-gate.sh
#   bash scripts/dev/run-frontend-runtime-consistency-gate.sh --skip-staging   # local only (dev)
#   bash scripts/dev/run-frontend-runtime-consistency-gate.sh --skip-local     # staging only (CI)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="${FRC_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
EVID="$ROOT/evidence/GO_frontend_runtime_consistency_gate/${STAMP}"
LOCAL_WEB="${LOCAL_WEB_BASE:-http://127.0.0.1:3012}"
LOCAL_API="${LOCAL_API_BASE:-http://127.0.0.1:8080}"
STAGING_WEB="${STAGING_WEB_BASE:-https://tt-web-staging.fly.dev}"
STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
SKIP_LOCAL=0
SKIP_STAGING=0
for arg in "$@"; do
  [[ "$arg" == "--skip-local" ]] && SKIP_LOCAL=1
  [[ "$arg" == "--skip-staging" ]] && SKIP_STAGING=1
done

mkdir -p "$EVID/screenshots"
exec > >(tee -a "$EVID/gate-run.log") 2>&1

echo "== Frontend Runtime Consistency Gate · $STAMP =="
echo "pipeline: OCS → FRC → PI3"
echo "classification: frontend runtime — NOT OCS/DDG/SOPCP"

echo "== [1] source-truth + runtime marker audit =="
export AUDIT_STAMP="$STAMP"
export FRC_EVIDENCE_DIR="$EVID"
LOCAL_API_BASE="$LOCAL_API" STAGING_API_BASE="$STAGING_API" \
  node "$ROOT/scripts/dev/audit-frontend-runtime-consistency-gate.cjs" \
  2>&1 | tee "$EVID/runtime-audit.log"

PW_LOCAL_EXIT=0
PW_STAGING_EXIT=0

if [[ "$SKIP_LOCAL" -eq 0 ]]; then
  echo "== [2] Phase① browser · local_mirror =="
  if ! curl -sf "${LOCAL_API}/health" >/dev/null 2>&1; then
    echo "FAIL: local API unreachable at ${LOCAL_API} — start scripts/dev/start-api-local-staging-db-mirror.sh" >&2
    exit 1
  fi
  export MARKET_SUBSITE_RACE_TARGET=local
  export LOCAL_WEB_BASE="$LOCAL_WEB"
  export LOCAL_API_BASE="$LOCAL_API"
  export MARKET_SUBSITE_RACE_EVIDENCE_DIR="$EVID/screenshots"
  (cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts \
    --project=chromium --grep "@local_mirror" --workers=1) \
    2>&1 | tee "$EVID/playwright-local-mirror.log" || PW_LOCAL_EXIT=$?
else
  echo "== [2] skip local_mirror =="
fi

if [[ "$SKIP_STAGING" -eq 0 ]]; then
  echo "== [3] Phase② browser · staging =="
  export MARKET_SUBSITE_RACE_TARGET=staging
  export STAGING_WEB_BASE="$STAGING_WEB"
  export STAGING_API_BASE="$STAGING_API"
  export MARKET_SUBSITE_RACE_EVIDENCE_DIR="$EVID/screenshots"
  (cd "$ROOT/frontend" && npx playwright test e2e/market-subsite-catalog-race-regression.spec.ts \
    --project=chromium --grep "@staging" --workers=1) \
    2>&1 | tee "$EVID/playwright-staging.log" || PW_STAGING_EXIT=$?
else
  echo "== [3] skip staging =="
fi

if [[ "$PW_LOCAL_EXIT" -ne 0 || "$PW_STAGING_EXIT" -ne 0 ]]; then
  echo "FAIL: browser layer — local_exit=$PW_LOCAL_EXIT staging_exit=$PW_STAGING_EXIT" >&2
  exit 1
fi

echo "== [4] gate closure json =="
node -e "
const fs=require('fs');
const stamp='$STAMP';
const out={
  schema:'traveltrust.frontend_runtime_consistency_gate.v1',
  stamp,
  gate:'FRONTEND_RUNTIME_CONSISTENCY',
  status:'PASS',
  blocking_count:0,
  classification:'Frontend Runtime Consistency Gate',
  not_data_governance:true,
  governance_gates:{OCS:'CLOSED',DDG:'CLOSED',SOPCP:'CLOSED'},
  phase1:{label:'local_staging_mirror',web:'$LOCAL_WEB',api:'$LOCAL_API',playwright:'$EVID/playwright-local-mirror.log'},
  phase2:{label:'staging',web:'$STAGING_WEB',api:'$STAGING_API',playwright:'$EVID/playwright-staging.log'},
  runtime_audit:'$EVID/runtime-audit.json',
  registry:'registry/frontend-runtime-consistency-gate.v1.yaml',
  verdict:'PASS'
};
fs.writeFileSync('$EVID/gate-closure.json', JSON.stringify(out,null,2)+'\n');
console.log('GATE PASS · evidence/GO_frontend_runtime_consistency_gate/'+stamp+'/gate-closure.json');
"

echo "Frontend Runtime Consistency Gate: PASS"
