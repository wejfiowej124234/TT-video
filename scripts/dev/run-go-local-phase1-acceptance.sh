#!/usr/bin/env bash
# ① 本地 · GO_local_phase1 总验收编排（Identity 波 1 / 96-18 / Hub / 命名 P3）
#
# 不含：Stripe · 测试网 PSP · 链上真质押（Anvil/testnet stake smoke）
#
# 用法（仓库根 · API 已起 · DATABASE_URL + INTERNAL_API_SECRET）：
#   bash scripts/dev/run-go-local-phase1-acceptance.sh
#
# 可选：
#   SKIP_CARGO=1              跳过 Rust PG 测试（无 DATABASE_URL 时）
#   SKIP_API_SMOKE=1          跳过 bash 烟测
#   SKIP_FRONTEND=1           跳过 vitest 绿集
#   MARK_PAID_MODE=local_dev  追加 local-dev mark-paid 全链路烟测（须 API TRAVELTRUST_ONBOARDING_LOCAL_DEV=1）
#
# SSOT：frontend/evidence/GO_local_phase1/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

load_dotenv_var() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    return 0
  fi
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

load_dotenv_var DATABASE_URL
load_dotenv_var INTERNAL_API_SECRET

fail() { echo "run-go-local-phase1-acceptance: FAIL $*" >&2; exit 1; }
ok() { echo "run-go-local-phase1-acceptance: OK $*"; }

echo "== GO_local_phase1 acceptance (① only; no Stripe/testnet/on-chain stake) =="

if [[ "${SKIP_CARGO:-0}" != "1" ]]; then
  if [[ -n "${DATABASE_URL:-}" ]]; then
    ok "cargo fee_schedule_v1 + PG alignment"
    cargo test -p traveltrust-api fee_schedule_v1
    cargo test -p traveltrust-api matrix_93_b_onb_008_f035_fee_schedule_v1
    cargo test -p traveltrust-api matrix_93_b_onb_009_f035_fee_schedule_v1
    cargo test -p traveltrust-api matrix_93_b_onb_010_f035_fee_schedule_v1
    cargo test -p traveltrust-api matrix_93_b_onb_011_f035_fee_schedule_v1_full_chain
  else
    ok "SKIP cargo PG tests (no DATABASE_URL)"
    cargo test -p traveltrust-api fee_schedule_v1
  fi
else
  ok "SKIP_CARGO=1"
fi

if [[ "${SKIP_API_SMOKE:-0}" != "1" ]]; then
  [[ -n "${DATABASE_URL:-}" ]] || fail "DATABASE_URL required for API smoke"
  bash "$ROOT/scripts/dev/smoke-onboarding-fee-schedule-v1-local.sh"
  bash "$ROOT/scripts/dev/smoke-onboarding-full-chain-local.sh"
  if [[ "${MARK_PAID_MODE:-}" == "local_dev" ]]; then
    MARK_PAID_MODE=local_dev bash "$ROOT/scripts/dev/smoke-onboarding-full-chain-local.sh"
  fi
  bash "$ROOT/scripts/dev/smoke-provider-onboarding-local.sh"
  bash "$ROOT/scripts/dev/smoke-steward-onboarding-local.sh"
else
  ok "SKIP_API_SMOKE=1"
fi

if [[ "${SKIP_FRONTEND:-0}" != "1" ]]; then
  ok "frontend vitest green set"
  (
    cd "$ROOT/frontend"
    npm run test:i18n:ci
    npm run test -- \
      accountNavNamingP3 loginPostAuthDefaultReturn \
      meOnboardingUiFreeze meOnboardingPage meOnboardingViewModel \
      meIdentitiesCoreCardModel meIdentitiesUiFreeze meIdentitiesL5 meIdentitiesPage \
      onboarding.http authLoginUiFreeze authRegisterUiFreeze loginPageL5 authRegisterL5 \
      authFlowL5 authRouteL5 authL5FullScore uiSystem \
      providerRegisterL5 stewardRegisterL5 stewardRegisterUiFreeze meTrust \
      --run
  )
else
  ok "SKIP_FRONTEND=1"
fi

echo ""
echo "TT_GO_LOCAL_PHASE1: OK (① local total gate · no Stripe · no testnet · no on-chain stake)"
echo "  SSOT: frontend/evidence/GO_local_phase1/README.md"
