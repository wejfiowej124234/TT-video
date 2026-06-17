#!/usr/bin/env bash
# Phase ② · 以 staging onboarding 环境重启 traveltrust-api（G4/G5）
# 覆盖 ① 根 .env 中的 TRAVELTRUST_ONBOARDING_LOCAL_DEV 与 DATABASE_URL。
#
# 用法（仓库根）：
#   bash scripts/dev/start-api-staging-onboarding.sh
#   bash scripts/dev/start-api-staging-onboarding.sh --foreground
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

FOREGROUND=0
[[ "${1:-}" == "--foreground" ]] && FOREGROUND=1

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"
stripe_lib_load_staging_env

# G4/G5 本机 tunnel 路径：Docker PG · 勿用 .env 内 flycast DATABASE_URL
if [[ "${STAGING_ONBOARDING_USE_LOCAL_PG:-0}" == "1" ]]; then
  export DATABASE_URL="${STAGING_ONBOARDING_DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"
  export TRAVELTRUST_ONBOARDING_STRIPE_AMOUNT_MINOR="${TRAVELTRUST_ONBOARDING_STRIPE_AMOUNT_MINOR:-29900}"
fi

# P0-03 · Sepolia 序 1～5（staging API 读链 · 不含 deployer 私钥）
CHAIN_ENV="${PHASE2_CHAIN_DEPLOY_ENV:-$STRIPE_LIB_ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
if [[ -f "$CHAIN_ENV" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    [[ -z "$line" || "$line" != *=* ]] && continue
    key="${line%%=*}"
    case "$key" in
      PRIVATE_KEY|TIMELOCK_SAFE_OWNER_KEYS|TIMELOCK_SAFE_THRESHOLD) continue ;;
      CHAIN_RPC_URL|CHAIN_ID|TIMELOCK_*|GOVERNANCE_*|GOVERNOR_*|FUND_STACK_*|ESCROW_*|FEE_*|REGION_*|TREASURY_*|RESERVE_*|GUIDE_*|PROVIDER_*|REGISTRY_*|STEWARD_*|REDEMPTION_*|COUNTRY_*)
        export "$line"
        ;;
    esac
  done < "$CHAIN_ENV"
fi

export PORT="${PORT:-8080}"
LOG_DIR="${PHASE2_EVIDENCE_DIR:-evidence/GO_phase2_testnet_20260526}/closing-gap/G4-stripe-g4"
mkdir -p "$ROOT/$LOG_DIR"
API_LOG="$ROOT/$LOG_DIR/api-staging-${PORT}.log"
PID_FILE="$ROOT/$LOG_DIR/api-staging.pid"

export DATABASE_URL="${DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"
export TRAVELTRUST_ONBOARDING_STRIPE_ENABLED="${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED:-1}"
export SEED_TEST_ACCOUNTS="${SEED_TEST_ACCOUNTS:-1}"
export API_RATE_LIMIT_PER_MINUTE="${API_RATE_LIMIT_PER_MINUTE:-0}"
export CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE="${CRITICAL_WRITE_RATE_LIMIT_PER_MINUTE:-0}"
unset TRAVELTRUST_ONBOARDING_LOCAL_DEV || true
export TRAVELTRUST_ONBOARDING_LOCAL_DEV=0

[[ -n "${TRAVELTRUST_STRIPE_SECRET_KEY:-}" ]] || stripe_lib_fail "TRAVELTRUST_STRIPE_SECRET_KEY unset"
[[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] || stripe_lib_fail "TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset"

stop_existing() {
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$ROOT/scripts/dev/stop-api-thorough.ps1" -ApiPort "$PORT" 2>/dev/null || true
  else
    npx --yes kill-port "$PORT" 2>/dev/null || true
  fi
  sleep 2
}

wait_health() {
  local i=0
  while (( i < 90 )); do
    if curl -sS -o /dev/null -w "%{http_code}" --max-time 2 "http://127.0.0.1:${PORT}/health" 2>/dev/null | grep -q 200; then
      return 0
    fi
    sleep 2
    i=$((i + 1))
  done
  return 1
}

stop_existing

if [[ "$FOREGROUND" == "1" ]]; then
  echo "start-api-staging-onboarding: foreground PORT=$PORT DATABASE_URL=$DATABASE_URL"
  exec cargo run -p traveltrust-api 2>&1 | tee -a "$API_LOG"
fi

echo "start-api-staging-onboarding: starting PORT=$PORT (log=$API_LOG)"
nohup cargo run -p traveltrust-api >>"$API_LOG" 2>&1 &
echo $! >"$PID_FILE"

if ! wait_health; then
  echo "start-api-staging-onboarding: FAIL — /health not 200 within 180s — tail $API_LOG" >&2
  tail -40 "$API_LOG" >&2 || true
  exit 2
fi

echo "start-api-staging-onboarding: OK pid=$(cat "$PID_FILE") health=200"
