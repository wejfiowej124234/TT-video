#!/usr/bin/env bash
# TN-P1-003 · PD-009 收购 staging 全链验证（② · ops · 无新业务）
#
# create → match → accept → escrow(mock-pay) → complete
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-003-acquisition-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-003-acquisition-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"
SUMMARY_JSON="$EVID/summary.json"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
export STAGING_API_BASE="$STAGING_API"
export API_BASE="$STAGING_API"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1,publicnode.com"
export ACQ_STAGING_SUMMARY_JSON="$SUMMARY_JSON"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_003_ACQUISITION_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API}"

echo ""
echo "== Step 0: staging preflight =="
hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_API}/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || { echo "FAIL health $hc" >&2; exit 2; }
curl --noproxy "*" -sS "${STAGING_API}/api/v1/market/acquisition/listings?limit=1" | tee "$EVID/catalog-probe.json" | grep -q 'listings\|"items"\|\[\]' || true
ok_meta="$(curl --noproxy "*" -sS "${STAGING_API}/meta" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const j=JSON.parse(s);console.log(JSON.stringify({chain_id:j.chain?.chain_id,api:j.environment?.name||'staging'},null,2))})")"
echo "$ok_meta" | tee "$EVID/preflight.json"

echo ""
echo "== Step 1: PD-009 full chain smoke =="
bash "$ROOT/scripts/dev/smoke-acquisition-pd009-staging.sh" 2>&1 | tee "$EVID/smoke.log"
grep -q "TT_SMOKE_ACQUISITION_PD009_STAGING: OK" "$EVID/smoke.log"
[[ -f "$SUMMARY_JSON" ]] || { echo "FAIL: missing summary.json" >&2; exit 2; }

node -e "
const fs=require('fs');
const summary=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));
const report={
  schema:'tn_p1_003_acquisition_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  api:process.argv[3],
  listing_id:summary.listing_id,
  order_id:summary.order_id,
  owner_email:summary.owner_email,
  carrier_email:summary.carrier_email,
  final_status:summary.final_status,
  payment_mode:summary.payment_mode,
  release_gate:'GO',
  honest_boundary:'② staging mock bond + mock-pay escrow · ≠ ③ mainnet acquisition bond/PSP · reviews/trust parity optional'
};
fs.writeFileSync(process.argv[4], JSON.stringify(report,null,2)+'\n');
" "$SUMMARY_JSON" "$STAMP" "$STAGING_API" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-003 PD-009 Acquisition
at: ${STAMP}
release_gate: GO
EOF

echo ""
echo "TT_TN_P1_003_ACQUISITION_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
