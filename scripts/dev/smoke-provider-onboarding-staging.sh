#!/usr/bin/env bash
# Phase ③ · P0-1 · Merchant 闭环 staging 烟测（RP-002 / RP-005）
# 复用 ① 全链路脚本 · 仅改 API_BASE + 固定种子账号
#
#   export HTTPS_PROXY=http://127.0.0.1:15715  # 若本机需代理
#   bash scripts/dev/smoke-provider-onboarding-staging.sh
#
# 边界：staging 数据/流程证据 · ≠ Production GO · 不新增产品功能
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/merchant-closure-${STAMP}}"
mkdir -p "$OUT"

ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
if [[ -f "$ENV_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    export "$key=$val"
  done < "$ENV_FILE"
fi

export API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export SMOKE_MERCHANT_EMAIL="${PHASE3_MERCHANT_EMAIL:-merchant@test.com}"
export SMOKE_ADMIN_EMAIL="${PHASE3_ADMIN_EMAIL:-tourist@test.com}"
export SMOKE_SKIP_DOCKER_ADMIN="${SMOKE_SKIP_DOCKER_ADMIN:-0}"
# Staging API 为公网 HTTPS；本机直连时勿让 Windows schannel 走错误代理
unset HTTPS_PROXY HTTP_PROXY ALL_PROXY http_proxy https_proxy all_proxy

echo "== smoke-provider-onboarding-staging API=${API_BASE} merchant=${SMOKE_MERCHANT_EMAIL} ==" | tee "$OUT/smoke.log"

if bash "$ROOT/scripts/dev/smoke-provider-onboarding-local.sh" 2>&1 | tee -a "$OUT/smoke.log"; then
  echo "TT_PHASE3_MERCHANT_CLOSURE: OK" | tee "$OUT/STATUS.txt"
  echo "Evidence: ${OUT}"
  exit 0
fi

echo "TT_PHASE3_MERCHANT_CLOSURE: FAIL" | tee "$OUT/STATUS.txt"
exit 2
