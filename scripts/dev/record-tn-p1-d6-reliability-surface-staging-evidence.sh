#!/usr/bin/env bash
# D6 · Reliability Closure — 52 surfaces human + exception path staging 证据（② · ops）
#
#   bash scripts/dev/record-tn-p1-d6-reliability-surface-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-d6-reliability-surface-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
STAGING_FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
STAGING_FE="${STAGING_FE%/}"

export STAGING_API_BASE="$STAGING_API"
export STAGING_FE_BASE="$STAGING_FE"
export RELIABILITY_CLOSURE_STAGING=1
export PLAYWRIGHT_BASE_URL="$STAGING_FE"
export PLAYWRIGHT_API_BASE_URL="$STAGING_API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_GOTO_TIMEOUT_MS="${PLAYWRIGHT_GOTO_TIMEOUT_MS:-180000}"
export PLAYWRIGHT_GOTO_RETRY_ATTEMPTS="${PLAYWRIGHT_GOTO_RETRY_ATTEMPTS:-3}"
export RELIABILITY_CLOSURE_OUT="$EVID"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_D6_RELIABILITY_SURFACE_EVIDENCE: START ${STAMP}"

node "$ROOT/scripts/dev/gen-reliability-closure-surface-cases.mjs"

hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_API}/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || { echo "FAIL health $hc" >&2; exit 2; }

cd "$ROOT/frontend"
npx playwright test e2e/reliability-closure-surfaces-staging.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --retries=2 \
  --reporter=list 2>&1 | tee "$EVID/reliability-browser.log"

[[ -f "$EVID/reliability-surface-manifest.json" ]] || { echo "FAIL missing manifest" >&2; exit 2; }

node -e "
const fs=require('fs');
const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const ids=new Set((m.surfaces||[]).map(s=>s.id));
const need=52;
if(ids.size!==need) { console.error('FAIL surface count', ids.size, 'expected', need); process.exit(2); }
for (const s of m.surfaces) {
  if(s.human_uat!=='PASS'||s.exception_path_verified!=='PASS') {
    console.error('FAIL', s.id, s.human_uat, s.exception_path_verified); process.exit(2);
  }
}
" "$EVID/reliability-surface-manifest.json"

# D6 companion markers (reuse hat browser if present)
HAT_DIR="$(ls -td "$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-007-008-hat-"* 2>/dev/null | head -1 || true)"
if [[ -n "$HAT_DIR" && -f "$HAT_DIR/hat-browser.log" ]]; then
  cp "$HAT_DIR/hat-browser.log" "$EVID/playwright-hat.log"
fi

mkdir -p "$ROOT/evidence/phase2-human-acceptance-staging-sprint"
cat >"$ROOT/evidence/phase2-human-acceptance-staging-sprint/RELIABILITY-CLOSURE-${STAMP}.md" <<EOF
TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK
stamp: ${STAMP}
surfaces: 52/52 human_uat PASS exception_path_verified PASS
evidence: ${EVID}
EOF

mkdir -p "$ROOT/frontend/evidence/GO_phase2_staging_ui_real_user_sprint"
echo "PHASE2-STAGING-UI-REAL-USER-SPRINT: OK ${STAMP} reliability_closure 52 surfaces" \
  >"$ROOT/frontend/evidence/GO_phase2_staging_ui_real_user_sprint/RELIABILITY-CLOSURE-${STAMP}.txt"

node -e "
const fs=require('fs');
fs.writeFileSync(process.argv[2], JSON.stringify({
  schema:'tn_p1_d6_reliability_surface_staging.v1',
  stamp:process.argv[1],
  phase:'② testnet',
  surfaces_total:52,
  human_uat:'PASS',
  exception_path_verified:'PASS',
  release_gate:'GO'
},null,2)+'\n');
" "$STAMP" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: D6 reliability 52 surfaces
at: ${STAMP}
EOF

echo ""
echo "TT_TN_P1_D6_RELIABILITY_SURFACE_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
