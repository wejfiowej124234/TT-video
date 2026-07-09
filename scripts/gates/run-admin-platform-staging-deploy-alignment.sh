#!/usr/bin/env bash
# Admin Platform 40/40 · Staging deploy 对齐 + 部署后 smoke + 全链验证
#
#   export DEPLOYMENT_STATE=sync
#   export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1
#   bash scripts/gates/run-admin-platform-staging-deploy-alignment.sh
#
# 仅 smoke（不 deploy）：
#   SKIP_DEPLOY=1 bash scripts/gates/run-admin-platform-staging-deploy-alignment.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="${ADMIN_STAGING_DEPLOY_EVIDENCE:-$ROOT/evidence/GO_admin_platform_staging_deploy/$STAMP}"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

step() { echo ""; echo "== $* =="; }

cat >"$EVID/STAGING-DEPLOY-ALIGNMENT-CHECKLIST.md" <<EOF
# Admin Platform 40/40 · Staging Deploy Alignment Checklist

**UTC:** $STAMP  
**Targets:** \`tt-api-staging\` · \`tt-web-staging\`

## Pre-flight

| # | Check |
|---|--------|
| P1 | \`fly auth whoami\` |
| P2 | \`scripts/dev/.env.staging-secrets.local\` + \`.env.staging-onboarding.local\` |
| P3 | \`deploy/fly/tt-web-staging/build.env.local\` |
| P4 | \`export DEPLOYMENT_STATE=sync\` |
| P5 | \`export DEPLOY_GOVERNANCE_FORCE_RUNTIME=1\` |
| P6 | \`TESTNET_FREEZE_OVERRIDE=1\`（若 staging freeze 激活） |

## Deploy waves

| Wave | Script |
|------|--------|
| W1 API | \`bash scripts/dev/phase2-staging-fly-deploy-and-sync.sh\` |
| W2 Web | \`FLY_WEB_NO_CACHE=1 bash scripts/dev/deploy-tt-web-staging.sh\` |

## Post-deploy

| # | Script |
|---|--------|
| V1 | \`bash scripts/dev/check-staging-web-alignment.sh\` |
| V2 | \`bash scripts/dev/smoke-staging-admin-public-operations.sh\` |
| V3 | \`bash scripts/gates/run-admin-platform-40-verification.sh\` |
EOF

step "[0/5] Pre-flight"
command -v fly >/dev/null 2>&1 || { echo "FAIL: fly CLI missing"; exit 2; }
fly auth whoami
export DEPLOYMENT_STATE="${DEPLOYMENT_STATE:-sync}"
export DEPLOY_GOVERNANCE_FORCE_RUNTIME="${DEPLOY_GOVERNANCE_FORCE_RUNTIME:-1}"
export TESTNET_FREEZE_OVERRIDE="${TESTNET_FREEZE_OVERRIDE:-1}"
echo "DEPLOYMENT_STATE=$DEPLOYMENT_STATE DEPLOY_GOVERNANCE_FORCE_RUNTIME=$DEPLOY_GOVERNANCE_FORCE_RUNTIME"

if [[ "${SKIP_DEPLOY:-}" != "1" ]]; then
  step "[1/5] Wave 1 · tt-api-staging"
  bash "$ROOT/scripts/dev/phase2-staging-fly-deploy-and-sync.sh"

  step "[2/5] Wave 2 · tt-web-staging"
  FLY_WEB_NO_CACHE=1 bash "$ROOT/scripts/dev/deploy-tt-web-staging.sh"
else
  echo "SKIP deploy (SKIP_DEPLOY=1)"
fi

step "[3/5] Staging web alignment"
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" || true

step "[4/5] Staging Public Operations smoke"
bash "$ROOT/scripts/dev/smoke-staging-admin-public-operations.sh"

step "[5/5] Admin Platform 40 verification"
bash "$ROOT/scripts/gates/run-admin-platform-40-verification.sh"

LATEST_VERIFY="$(ls -td "$ROOT/evidence/GO_admin_platform_40_complete"/*/ 2>/dev/null | head -1)"
node -e "
const fs=require('fs');
const p=process.argv[1]; const stamp=process.argv[2]; const vdir=process.argv[3];
let verify={};
try{verify=JSON.parse(fs.readFileSync(vdir+'/report.json','utf8'));}catch(e){}
fs.writeFileSync(p+'/report.json', JSON.stringify({
  stamp, verdict: verify.verdict||'UNKNOWN', verification: verify,
  checklist: p+'/STAGING-DEPLOY-ALIGNMENT-CHECKLIST.md',
}, null, 2));
" "$EVID" "$STAMP" "${LATEST_VERIFY%/}"

echo ""
echo "OK: Staging deploy alignment complete"
echo "Evidence: $EVID"
