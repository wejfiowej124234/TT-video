#!/usr/bin/env bash
# TN-P1-005 · Stripe PSP onboarding staging 验证（② · ops · 无新业务）
#
#   export STAGING_API_BASE=https://tt-api-staging.fly.dev
#   bash scripts/dev/record-tn-p1-005-stripe-onboarding-staging-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_testnet_perfect_validation/tn-p1-005-stripe-onboarding-${STAMP}"
mkdir -p "$EVID"
RUN_LOG="$EVID/run-${STAMP}.log"

STAGING_API="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
STAGING_API="${STAGING_API%/}"
BASELINE_SHA="${PHASE2_REVALIDATION_BASELINE_SHA:-${PHASE2_EXPECT_GIT_SHA:-$(git rev-parse HEAD 2>/dev/null || echo '')}}"

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
merge_env "$ROOT/scripts/dev/.env.staging-secrets.local"

export STAGING_API_BASE="$STAGING_API"
export SKIP_API_RESTART=1
export SKIP_TUNNEL=1
export MARK_PAID_MODE="${MARK_PAID_MODE:-stripe_webhook}"
export STRIPE_AUTO_CONFIRM="${STRIPE_AUTO_CONFIRM:-1}"

exec > >(tee -a "$RUN_LOG") 2>&1

echo "TT_TN_P1_005_STRIPE_ONBOARDING_EVIDENCE: START ${STAMP}"
echo "api=${STAGING_API} baseline_sha=${BASELINE_SHA}"

bash "$ROOT/scripts/dev/smoke-onboarding-testnet.sh" 2>&1 | tee "$EVID/smoke-onboarding.log"
grep -q 'TT_SMOKE_ONBOARDING_TESTNET: OK' "$EVID/smoke-onboarding.log"

node -e "
const fs=require('fs');
const p=process.argv[1];
fs.writeFileSync(p, JSON.stringify({
  stamp: process.argv[2],
  baseline_git_sha: process.argv[3],
  marker: 'TT_TN_P1_005_STRIPE_ONBOARDING_EVIDENCE: PASS',
  api: process.argv[4],
}, null, 2)+'\n');
" "$EVID/meta.json" "$STAMP" "$BASELINE_SHA" "$STAGING_API"

echo "TT_TN_P1_005_STRIPE_ONBOARDING_EVIDENCE: PASS"
echo "evidence: ${EVID}"
