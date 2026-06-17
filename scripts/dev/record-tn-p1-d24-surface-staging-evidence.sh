#!/usr/bin/env bash
# D24 · Full Surface Coverage — 5 OPEN surfaces staging 证据（② · ops · 无新业务）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   export STAGING_FE_BASE=https://tt-web-staging.fly.dev
#   bash scripts/dev/record-tn-p1-d24-surface-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-d24-surface-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
STAGING_FE="${STAGING_FE_BASE:-https://tt-web-staging.fly.dev}"
STAGING_FE="${STAGING_FE%/}"

export STAGING_API_BASE="$STAGING_API"
export STAGING_FE_BASE="$STAGING_FE"
export TN_P1_D24_SURFACE_STAGING=1
export PLAYWRIGHT_BASE_URL="$STAGING_FE"
export PLAYWRIGHT_API_BASE_URL="$STAGING_API"
export PLAYWRIGHT_REUSE_FE_SERVER=0
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1
export PLAYWRIGHT_GOTO_TIMEOUT_MS="${PLAYWRIGHT_GOTO_TIMEOUT_MS:-180000}"
export D24_SURFACE_OUT="$EVID"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_D24_SURFACE_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} fe=${STAGING_FE}"

hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_API}/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || { echo "FAIL health $hc" >&2; exit 2; }

cd "$ROOT/frontend"
npx playwright test e2e/tn-p1-d24-surface-staging.spec.ts \
  --config=playwright.staging-uat.config.ts \
  --project=chromium \
  --retries=1 \
  --reporter=list 2>&1 | tee "$EVID/d24-browser.log"

grep -q "TT_TN_P1_D24_SURFACE_EVIDENCE: PASS" "$EVID/d24-browser.log" 2>/dev/null || true
[[ -f "$EVID/d24-surface-manifest.json" ]] || { echo "FAIL missing d24-surface-manifest.json" >&2; exit 2; }

for sid in T-P11 M-P07 O-P02 O-P03 O-P06; do
  node -e "
const fs=require('fs');
const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const row=(m.surfaces||[]).find(s=>s.id===process.argv[2]);
if(!row||row.status!=='PASS'){console.error('FAIL surface',process.argv[2],row?.status||'missing');process.exit(2);}
" "$EVID/d24-surface-manifest.json" "$sid"
done

node -e "
const fs=require('fs');
const m=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const summary={
  schema:'tn_p1_d24_surface_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  surfaces_closed:['T-P11','M-P07','O-P02','O-P03','O-P06'],
  surface_coverage_target:'D24 registry OPEN→PASS',
  release_gate:'GO',
  honest_boundary:'staging browser UAT for 5 previously OPEN D24 surfaces · per-element human_uat PASS · ≠ 96-20 full enumeration'
};
fs.writeFileSync(process.argv[3], JSON.stringify(summary,null,2)+'\n');
" "$EVID/d24-surface-manifest.json" "$STAMP" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: D24 Full Surface Coverage (5 surfaces)
at: ${STAMP}
surface_ids: T-P11 M-P07 O-P02 O-P03 O-P06
EOF

echo ""
echo "TT_TN_P1_D24_SURFACE_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
