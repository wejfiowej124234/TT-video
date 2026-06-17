#!/usr/bin/env bash
# Phase ② Closing Gap · G4 (Stripe 真收单) + G5 (Onboarding testnet smoke)
#
# ② 验收：真实 staging HTTPS · Stripe Test Mode（非 Mock）· 真实 webhook 链路
# quote → payment-intent → webhook → entitlement → role-confirm
#
# 证据：
#   evidence/GO_phase2_testnet_20260526/closing-gap/G4-stripe-g4/
#   evidence/GO_phase2_testnet_20260526/onboarding-smoke/
#
# 用法（仓库根 · 须先填 scripts/dev/.env.staging-secrets.local 真实 sk_test/whsec）：
#   bash scripts/dev/record-phase2-closing-gap-g4-g5-evidence.sh
#
# 可选：
#   SKIP_API_RESTART=1          使用持久 Fly/staging HTTPS（须 hooks 路由 + whsec 已同步）
#   SKIP_TUNNEL=1               同 SKIP_API_RESTART=1（legacy alias）
#   STRIPE_SKIP_WEBHOOK_ENSURE=1  whsec 已与 Dashboard 对齐
set -euo pipefail

# Legacy: SKIP_TUNNEL=1 ≡ 持久 Fly/staging（不启 localtunnel）
[[ "${SKIP_TUNNEL:-0}" == "1" ]] && export SKIP_API_RESTART=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/stripe-onboarding-testnet-lib.sh
source "$ROOT/scripts/dev/stripe-onboarding-testnet-lib.sh"

EVID_ROOT="${PHASE2_EVIDENCE_DIR:-evidence/GO_phase2_testnet_20260526}"
G4_DIR="$ROOT/$EVID_ROOT/closing-gap/G4-stripe-g4"
G5_DIR="$ROOT/$EVID_ROOT/onboarding-smoke"
mkdir -p "$G4_DIR" "$G5_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$G4_DIR/run.log"
PAY_LOG="$G4_DIR/payment-flow.log"
WH_LOG="$G4_DIR/webhook.log"
SMOKE_LOG="$G5_DIR/smoke-onboarding.log"
G4_STATUS="$G4_DIR/STATUS.txt"
G5_STATUS="$G5_DIR/STATUS.txt"

: >"$PAY_LOG"
: >"$WH_LOG"
: >"$SMOKE_LOG"

fail_record() {
  local msg="$1"
  {
    echo "status: FAIL"
    echo "last_run: ${STAMP}"
    echo "api_base: ${API_BASE:-unknown}"
    echo "note: ${msg}"
    echo "phase: ② testnet closing gap"
  } >"$G4_STATUS"
  cp -f "$G4_STATUS" "$G5_STATUS"
  echo "record-phase2-closing-gap-g4-g5: FAIL $msg" >&2
  exit 2
}

{
  echo "TT_CLOSING_GAP_G4_G5: START ${STAMP}"
  echo "EVID_ROOT=$EVID_ROOT"

  stripe_lib_load_staging_env

  # --- G-2 HTTPS reachability ---
  # SKIP_API_RESTART=1 → 持久 Fly/staging 主机（须已 deploy hooks + whsec 同步）
  # 默认 → 本机 staging onboarding API + localtunnel（与 webhook 同源）
  API_BASE="${API_BASE:-}"
  if [[ "${SKIP_API_RESTART:-0}" == "1" ]]; then
    if [[ -z "$API_BASE" ]] || stripe_lib_is_placeholder "$API_BASE" || [[ "$(stripe_lib_curl_health "${API_BASE%/}")" != "200" ]]; then
      fail_record "SKIP_API_RESTART=1 but API_BASE unreachable: ${API_BASE:-empty}"
    fi
  else
    echo "--- local staging onboarding API + HTTPS tunnel ---"
    export STAGING_ONBOARDING_USE_LOCAL_PG=1
    export STAGING_ONBOARDING_DATABASE_URL="${STAGING_ONBOARDING_DATABASE_URL:-postgresql://traveltrust:traveltrust@127.0.0.1:5432/traveltrust_staging}"
    if [[ "$(curl -sS -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:8080/health 2>/dev/null || echo 000)" != "200" ]]; then
      echo "starting staging onboarding API..."
      bash "$ROOT/scripts/dev/start-api-staging-onboarding.sh"
    fi
    echo "--- start localtunnel ---"
    API_BASE="$(stripe_lib_start_localtunnel 8080)"
    stripe_lib_patch_onboarding_env "$API_BASE"
    stripe_lib_load_staging_env
  fi
  API_BASE="${API_BASE%/}"
  echo "API_BASE=$API_BASE"

  if ! stripe_lib_validate_stripe_secret_key; then
    fail_record "Stripe sk_test key invalid or placeholder — edit scripts/dev/.env.staging-secrets.local"
  fi

  HOOK_URL="${API_BASE}/api/v1/hooks/stripe/onboarding"
  if [[ "${STRIPE_SKIP_WEBHOOK_ENSURE:-0}" != "1" ]]; then
    echo "--- ensure Stripe webhook endpoint ---"
    WHSEC="$(stripe_lib_ensure_webhook_endpoint "$HOOK_URL" | tail -1)"
    export TRAVELTRUST_STRIPE_WEBHOOK_SECRET="$WHSEC"
    stripe_lib_patch_onboarding_env "$API_BASE" "$WHSEC"
    echo "whsec configured (len=${#WHSEC})" | tee -a "$WH_LOG"
  fi

  if [[ "${SKIP_API_RESTART:-0}" != "1" ]]; then
    echo "--- restart API with staging Stripe env ---"
    bash "$ROOT/scripts/dev/start-api-staging-onboarding.sh"
    if [[ "${STAGING_ONBOARDING_USE_LOCAL_PG:-0}" == "1" ]]; then
      sleep 3
      hc="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "http://127.0.0.1:${PORT:-8080}/health" 2>/dev/null || echo 000)"
    else
      hc="$(stripe_lib_curl_health "$API_BASE")"
    fi
    [[ "$hc" == "200" ]] || fail_record "${API_BASE}/health HTTP $hc after API restart"
  fi

  echo "--- check-phase2-onboarding-staging-ready ---"
  STAGING_ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
  export STAGING_ENV_FILE
  bash "$ROOT/scripts/dev/check-phase2-onboarding-staging-ready.sh"

  export SMOKE_PAYMENT_FLOW_LOG="$PAY_LOG"
  export SMOKE_WEBHOOK_LOG="$WH_LOG"
  export MARK_PAID_MODE=stripe_webhook
  export STRIPE_AUTO_CONFIRM=1

  if [[ "${STAGING_ONBOARDING_USE_LOCAL_PG:-0}" == "1" ]]; then
    export ONBOARDING_SMOKE_API_BASE="http://127.0.0.1:${PORT:-8080}"
    export TRAVELTRUST_ALLOW_INSECURE_HTTP_BASE=1
  fi

  echo "--- smoke-onboarding-testnet (Stripe test · auto confirm) ---"
  bash "$ROOT/scripts/dev/smoke-onboarding-testnet.sh" 2>&1 | tee "$SMOKE_LOG"
  grep -q "TT_SMOKE_ONBOARDING_TESTNET: OK" "$SMOKE_LOG" || fail_record "smoke-onboarding-testnet did not exit OK"

  # G4 STATUS
  {
    echo "status: PASS"
    echo "last_run: ${STAMP}"
    echo "api_base: ${API_BASE}"
    echo "stripe_mode: test"
    echo "webhook_url: ${HOOK_URL}"
    echo "note: G-4 Stripe real test PI + webhook + non-zero amount (LOCAL_DEV=0)"
    echo "phase: ② testnet closing gap"
    echo "artifacts: payment-flow.log webhook.log run.log"
  } >"$G4_STATUS"

  # G5 STATUS
  {
    echo "status: PASS"
    echo "last_run: ${STAMP}"
    echo "api_base: ${API_BASE}"
    echo "note: ONB-P2-006 quote→PI→webhook→entitlement→role-confirm exit 0"
    echo "phase: ② testnet closing gap"
    echo "artifacts: smoke-onboarding.log run.log (G4 dir payment-flow.log webhook.log)"
  } >"$G5_STATUS"

  cp -f "$SMOKE_LOG" "$G5_DIR/run.log"
  ln -sfn "../closing-gap/G4-stripe-g4/payment-flow.log" "$G5_DIR/payment-flow.log" 2>/dev/null || \
    cp -f "$PAY_LOG" "$G5_DIR/payment-flow.log"
  ln -sfn "../closing-gap/G4-stripe-g4/webhook.log" "$G5_DIR/webhook.log" 2>/dev/null || \
    cp -f "$WH_LOG" "$G5_DIR/webhook.log"

  echo "TT_CLOSING_GAP_G4_G5: OK"
} 2>&1 | tee "$RUN_LOG"

bash "$ROOT/scripts/dev/record-phase2-closing-gap-status.sh"

echo "record-phase2-closing-gap-g4-g5: done — G4/G5 STATUS.txt written"
