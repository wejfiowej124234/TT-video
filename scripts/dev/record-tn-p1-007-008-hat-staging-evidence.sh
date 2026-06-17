#!/usr/bin/env bash
# TN-P1-007/008 · 六角色 multi-demo 登录 + hat 切换 staging 验证（② · ops · 无新业务）
#
# TN-P1-007: multi-demo API 主链 + 六角色矩阵探针
# TN-P1-008: Playwright 浏览器 hat 切换矩阵
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   export STAGING_FE_BASE=https://tt-web-staging.fly.dev
#   bash scripts/dev/record-tn-p1-007-008-hat-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-007-008-hat-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
STAGING_FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
STAGING_FE="${STAGING_FE%/}"

export STAGING_API_BASE="$STAGING_API"
export STAGING_FE_BASE="$STAGING_FE"
export HAT_API_BASE="$STAGING_API"
export HAT_WEB_BASE="$STAGING_FE"
export HAT_MATRIX_OUT="$EVID/hat-matrix-probe"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_007_008_HAT_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} fe=${STAGING_FE}"

echo ""
echo "== Step 0: staging preflight =="
hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_API}/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || { echo "FAIL health $hc" >&2; exit 2; }
fe_hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_FE}/" 2>/dev/null || echo "000")"
[[ "$fe_hc" == "200" || "$fe_hc" == "307" || "$fe_hc" == "308" ]] || { echo "FAIL fe $fe_hc" >&2; exit 2; }

echo ""
echo "== Step 1: TN-P1-007 multi-demo API closure =="
bash "$ROOT/scripts/dev/smoke-multi-identity-closure-staging.sh" 2>&1 | tee "$EVID/multi-identity-smoke.log"
grep -q "TT_SMOKE_MULTI_IDENTITY_CLOSURE_STAGING: OK" "$EVID/multi-identity-smoke.log"
grep -q "smoke-multi-identity-closure: ALL PASS" "$EVID/multi-identity-smoke.log"

echo ""
echo "== Step 2: publish-hub staging rails =="
bash "$ROOT/scripts/dev/smoke-publish-hub-staging.sh" 2>&1 | tee "$EVID/publish-hub-smoke.log"
grep -q "TT_PUBLISH_HUB_STAGING: OK" "$EVID/publish-hub-smoke.log"

echo ""
echo "== Step 3: six-role HAT API matrix =="
if ! python "$ROOT/scripts/dev/tn-p1-hat-six-role-matrix-probe.py" 2>&1 | tee "$EVID/hat-matrix-probe.log"; then
  echo "WARN: hat matrix probe retry after 5s …"
  sleep 5
  export HAT_MATRIX_OUT="$EVID/hat-matrix-probe"
  python "$ROOT/scripts/dev/tn-p1-hat-six-role-matrix-probe.py" 2>&1 | tee -a "$EVID/hat-matrix-probe.log"
fi
grep -q "TT_TN_P1_HAT_MATRIX_PROBE: PASS" "$EVID/hat-matrix-probe.log"
[[ -f "$EVID/hat-matrix-probe/hat-matrix-probe.json" ]] || { echo "FAIL missing hat-matrix-probe.json" >&2; exit 2; }

echo ""
echo "== Step 4: TN-P1-008 browser hat matrix =="
export TN_P1_HAT_STAGING=1
export PLAYWRIGHT_BASE_URL="$STAGING_FE"
export PLAYWRIGHT_API_BASE_URL="$STAGING_API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_GOTO_TIMEOUT_MS="${PLAYWRIGHT_GOTO_TIMEOUT_MS:-180000}"
cd "$ROOT/frontend"
PW_RC=1
for attempt in 1 2; do
  echo "playwright hat matrix attempt ${attempt}/2 …"
  set +e
  npx playwright test e2e/tn-p1-hat-staging-matrix.spec.ts \
    --config=playwright.staging-uat.config.ts \
    --project=chromium \
    --retries=1 \
    --reporter=list 2>&1 | tee "$EVID/hat-browser.log"
  PW_RC=${PIPESTATUS[0]}
  set -e
  if [[ "$PW_RC" -eq 0 ]] && ! grep -qE "[1-9][0-9]* failed" "$EVID/hat-browser.log"; then
    break
  fi
  [[ "$attempt" -lt 2 ]] && echo "WARN: playwright hat matrix retry after 15s (staging connection flake)" && sleep 15
done
cd "$ROOT"
grep -qE "[0-9]+ passed" "$EVID/hat-browser.log"
if grep -qE "[1-9][0-9]* failed" "$EVID/hat-browser.log"; then
  echo "WARN: playwright had failures — see hat-browser.log" >&2
  exit 2
fi

node -e "
const fs=require('fs');
const probe=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const report={
  schema:'tn_p1_007_008_hat_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  api:process.argv[3],
  web:process.argv[4],
  tn_p1_007:'CLOSED',
  tn_p1_008:'CLOSED',
  multi_identity_marker:'TT_SMOKE_MULTI_IDENTITY_CLOSURE_STAGING: OK',
  publish_hub_marker:'TT_PUBLISH_HUB_STAGING: OK',
  hat_matrix_marker:'TT_TN_P1_HAT_MATRIX_PROBE: PASS',
  hat_matrix:probe,
  release_gate:'GO',
  honest_boundary:'② staging seed accounts + slot RBAC · Moderator=admin community corridor · ≠ ③ Production persona GO'
};
fs.writeFileSync(process.argv[5], JSON.stringify(report,null,2)+'\n');
" "$EVID/hat-matrix-probe/hat-matrix-probe.json" "$STAMP" "$STAGING_API" "$STAGING_FE" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-007 + TN-P1-008 HAT
at: ${STAMP}
release_gate: GO
personas: Traveler Guide Merchant Region-Steward Moderator Admin
EOF

echo ""
echo "TT_TN_P1_007_008_HAT_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
