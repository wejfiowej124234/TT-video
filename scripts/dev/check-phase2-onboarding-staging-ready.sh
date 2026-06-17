#!/usr/bin/env bash
# Phase ② · onboarding 垂直 · G-0～G-4 + staging 预检（机读）
#
# exit 0 = 文档/环境变量层就绪，可尝试 smoke-onboarding-testnet.sh
# exit 2 = 缺参、占位 URL、或 ① local-dev 冒充 ②
#
# 用法：
#   cp scripts/dev/staging-onboarding.env.example scripts/dev/.env.staging-onboarding.local
#   bash scripts/dev/check-phase2-onboarding-staging-ready.sh
#
# 可选：
#   STAGING_ENV_FILE=scripts/dev/.env.staging-onboarding.local
#   SKIP_G0_ACCEPTANCE_LOG=1   # 仅本地开发跳过 G-0 日志检查
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${STAGING_ENV_FILE:-$ROOT/scripts/dev/.env.staging-onboarding.local}"
G0_LOG="${G0_ACCEPTANCE_LOG:-$ROOT/frontend/evidence/GO_local_phase1/acceptance.latest.log}"

fail() { echo "check-phase2-onboarding-staging-ready: FAIL $*" >&2; exit 2; }
ok() { echo "check-phase2-onboarding-staging-ready: OK $*"; }

load_env_file() {
  [[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — cp scripts/dev/staging-onboarding.env.example"
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
}

placeholder_url() {
  local b="${1,,}"
  case "$b" in
    *your-staging*|*your_staging*|*replace-me*|*changeme*|*staging-api.example*|*api.staging.example*)
      return 0 ;;
  esac
  return 1
}

load_env_file

API_BASE="${API_BASE:-}"
API_BASE="${API_BASE%/}"
[[ -n "$API_BASE" ]] || fail "API_BASE empty in $ENV_FILE"
placeholder_url "$API_BASE" && fail "API_BASE still placeholder in $ENV_FILE"

if [[ "${API_BASE}" != https://* ]]; then
  if [[ "${TRAVELTRUST_ALLOW_INSECURE_HTTP_BASE:-}" != "1" ]]; then
    fail "API_BASE must be HTTPS for ② (or set TRAVELTRUST_ALLOW_INSECURE_HTTP_BASE=1 explicitly)"
  fi
  ok "WARN: HTTP API_BASE allowed by TRAVELTRUST_ALLOW_INSECURE_HTTP_BASE=1"
fi

# G-4: operator attestation in env file
if grep -qE '^[[:space:]]*TRAVELTRUST_ONBOARDING_LOCAL_DEV[[:space:]]*=[[:space:]]*1' "$ENV_FILE" 2>/dev/null; then
  fail "TRAVELTRUST_ONBOARDING_LOCAL_DEV=1 in $ENV_FILE forbidden on staging (G-4)"
fi

# G-1 Stripe
[[ -n "${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED:-}" ]] || fail "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED unset"
[[ "${TRAVELTRUST_ONBOARDING_STRIPE_ENABLED}" == "1" ]] || fail "TRAVELTRUST_ONBOARDING_STRIPE_ENABLED must be 1"
[[ -n "${TRAVELTRUST_STRIPE_SECRET_KEY:-}" ]] || fail "TRAVELTRUST_STRIPE_SECRET_KEY unset"
[[ "${TRAVELTRUST_STRIPE_SECRET_KEY}" == sk_test_* ]] || fail "TRAVELTRUST_STRIPE_SECRET_KEY must be sk_test_*"
[[ -n "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET:-}" ]] || fail "TRAVELTRUST_STRIPE_WEBHOOK_SECRET unset (ONB-P2-003)"
[[ "${TRAVELTRUST_STRIPE_WEBHOOK_SECRET}" == whsec_* ]] || fail "TRAVELTRUST_STRIPE_WEBHOOK_SECRET must be whsec_*"

# G-0: recent acceptance log (evidence supplement)
if [[ "${SKIP_G0_ACCEPTANCE_LOG:-0}" != "1" ]]; then
  if [[ ! -f "$G0_LOG" ]]; then
    fail "G-0: missing $G0_LOG — run: bash scripts/dev/record-go-local-phase1-acceptance-log.sh"
  fi
  if ! grep -q "TT_GO_LOCAL_PHASE1: OK" "$G0_LOG"; then
    fail "G-0: $G0_LOG missing TT_GO_LOCAL_PHASE1: OK"
  fi
  ok "G-0 acceptance log present"
fi

# G-2 reachability (best-effort)
hc="$(curl -sS -o /dev/null -w "%{http_code}" -H "Bypass-Tunnel-Reminder: true" "${API_BASE}/health" 2>/dev/null || echo "000")"
if [[ "$hc" != "200" && "${STAGING_ONBOARDING_USE_LOCAL_PG:-0}" == "1" ]]; then
  local_port="${STAGING_ONBOARDING_LOCAL_API_PORT:-8080}"
  hc="$(curl -sS -o /dev/null -w "%{http_code}" --max-time 5 "http://127.0.0.1:${local_port}/health" 2>/dev/null || echo "000")"
  [[ "$hc" == "200" ]] || fail "G-2: local :${local_port}/health not 200 (got $hc) — staging API down"
  ok "G-2 local http://127.0.0.1:${local_port}/health=200 (tunnel ${API_BASE} for Stripe webhook)"
elif [[ "$hc" != "200" ]]; then
  fail "G-2: ${API_BASE}/health not 200 (got $hc) — staging host not reachable"
else
  ok "G-2 ${API_BASE}/health=200"
fi

echo ""
echo "TT_CHECK_PHASE2_ONBOARDING_STAGING: OK (G-0～G-4 pregate · ② onboarding vertical)"
echo "  Next: bash scripts/dev/smoke-onboarding-testnet.sh"
echo "  SSOT: docs/runbook/PHASE2-START-CHECKLIST.md · PHASE2-ENTERPRISE-GAP-AUDIT.md"
exit 0
