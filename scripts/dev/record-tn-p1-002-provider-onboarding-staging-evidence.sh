#!/usr/bin/env bash
# TN-P1-002 · 商家入驻 staging 主链验证（② · ops · 无新业务）
#
# register/login → profile/application → onboarding/fee schedule → admin approve → operable (listing)
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-002-provider-onboarding-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-002-provider-onboarding-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"

merge_env() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    [[ -n "${!key:-}" ]] && continue
    export "$key=$val"
  done < "$f"
}

merge_env "$ROOT/.env"
merge_env "$ROOT/scripts/dev/.env.staging-onboarding.local"

export STAGING_API_BASE="$STAGING_API"
export API_BASE="$STAGING_API"
export SMOKE_MERCHANT_EMAIL="${SMOKE_MERCHANT_EMAIL:-merchant@test.com}"
export SMOKE_ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-tourist@test.com}"
export NO_PROXY="${NO_PROXY:+$NO_PROXY,}tt-api-staging.fly.dev,.fly.dev,localhost,127.0.0.1"
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_002_PROVIDER_ONBOARDING_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} merchant=${SMOKE_MERCHANT_EMAIL}"

echo ""
echo "== Step 0: staging preflight =="
hc="$(curl --noproxy "*" -sS -o /dev/null -w '%{http_code}' "${STAGING_API}/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || { echo "FAIL health $hc" >&2; exit 2; }
[[ -n "${INTERNAL_API_SECRET:-}" ]] || { echo "FAIL: INTERNAL_API_SECRET unset (scripts/dev/.env.staging-onboarding.local)" >&2; exit 2; }
curl --noproxy "*" -sS "${STAGING_API}/meta" -o "$EVID/staging-meta.json"
echo "meta bytes=$(wc -c < "$EVID/staging-meta.json" | tr -d ' ')"

echo ""
echo "== Step 1: provider onboarding staging smoke =="
bash "$ROOT/scripts/dev/smoke-provider-onboarding-local.sh" 2>&1 | tee "$EVID/smoke.log"
grep -q "TT_SMOKE_PROVIDER_ONBOARDING: OK" "$EVID/smoke.log"

MERCHANT="${SMOKE_MERCHANT_EMAIL}"
LISTING_LINE="$(grep -E 'listing_id=|already provider|POST market/provider/listings' "$EVID/smoke.log" | tail -1 || true)"

node -e "
const fs=require('fs');
const log=fs.readFileSync(process.argv[1],'utf8');
const listingMatch=log.match(/listing_id=([0-9a-f-]{36})/i);
const report={
  schema:'tn_p1_002_provider_onboarding_staging.v1',
  stamp:process.argv[2],
  phase:'② testnet',
  api:process.argv[3],
  merchant_email:process.argv[4],
  admin_email:process.argv[5],
  listing_id:listingMatch?listingMatch[1]:null,
  final_marker:'TT_SMOKE_PROVIDER_ONBOARDING: OK',
  release_gate:'GO',
  honest_boundary:'② staging mock onboarding webhook + seed admin · merchant@test.com reuse path OK · ≠ ③ Production PSP/KYB GO'
};
fs.writeFileSync(process.argv[6], JSON.stringify(report,null,2)+'\n');
" "$EVID/smoke.log" "$STAMP" "$STAGING_API" "$MERCHANT" "${SMOKE_ADMIN_EMAIL}" "$EVID/report.json"

cat >"$EVID/STATUS.txt" <<EOF
status: PASS
phase: ②
artifact: TN-P1-002 Provider Onboarding
at: ${STAMP}
release_gate: GO
merchant: ${MERCHANT}
EOF

echo ""
echo "TT_TN_P1_002_PROVIDER_ONBOARDING_EVIDENCE: PASS ${STAMP}"
echo "evidence: ${EVID}"
