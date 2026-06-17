#!/usr/bin/env bash
# ①.5 · 本地可演示链 seed 烟测（guide + provider + steward · 非 ② staging GO）
#
# 覆盖 PHASE1_5 §6「本地 seed」与 identity-unified-model S1–S4 烟测编排：
#   S1 注册 + 绑主钱包（guide 路径内）
#   S2 guide POST /guides
#   S3 provider 全链（smoke-provider-onboarding-local）
#   S4 steward 全链（smoke-steward-onboarding-local）
#
# 用法（API + DATABASE_URL + INTERNAL_API_SECRET）：
#   bash scripts/dev/smoke-phase15-identity-demo-local.sh
#
# SSOT: docs/runbook/PHASE1_5-DATA-LINK-MODEL-GATE.md §6
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
STAMP="$(date +%s)"
PASSWORD="Test123!"
WALLET="0x4a62316623ad457F02cDC5D997deD67a383EC569"

fail() { echo "smoke-phase15-identity-demo: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-phase15-identity-demo: OK $*"; }

curl_json() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}"
  local args=(-sS -w "|%{http_code}" -X "$method" "$url" -H "Content-Type: application/json")
  [[ -n "$token" ]] && args+=(-H "Authorization: Bearer $token")
  [[ -n "$body" ]] && args+=(-d "$body")
  local out
  out="$(curl "${args[@]}")"
  printf '%s|%s' "${out##*|}" "${out%|*}"
}

hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
[[ "$hc" == "200" ]] || fail "/health not 200"

ok "S3 provider path via smoke-provider-onboarding-local"
bash "$ROOT/scripts/dev/smoke-provider-onboarding-local.sh"

ok "S4 steward path via smoke-steward-onboarding-local"
bash "$ROOT/scripts/dev/smoke-steward-onboarding-local.sh"

email="ph15-guide-${STAMP}@traveltrust.test"
reg="$(curl_json POST "$API_BASE/auth/register" "{\"email\":\"$email\",\"password\":\"$PASSWORD\"}")"
[[ "${reg%%|*}" == "200" || "${reg%%|*}" == "201" ]] || fail "traveler register HTTP ${reg%%|*}"
token="$(node -e "console.log(JSON.parse(process.argv[1]).token||'')" "${reg#*|}")"
[[ -n "$token" ]] || fail "guide token missing"

me_put="$(curl_json PUT "$API_BASE/api/v1/me" "{\"default_wallet_address\":\"$WALLET\"}" "$token")"
[[ "${me_put%%|*}" == "200" ]] || fail "PUT /me wallet HTTP ${me_put%%|*}"
ok "S1 register + bind default_wallet_address"

guide="$(curl_json POST "$API_BASE/api/v1/guides" '{"display_name":"Phase15 Demo Guide","city":"Shanghai","country_code":"CN"}' "$token")"
[[ "${guide%%|*}" == "200" || "${guide%%|*}" == "201" ]] || fail "POST /guides HTTP ${guide%%|*} body=${guide#*|}"
ok "S2 guide register row created"

echo ""
echo "TT_SMOKE_PHASE15_IDENTITY_DEMO: OK (①.5 local seed slice · S1–S4 smoke orchestration · not ② GO)"
echo "  Also run: cargo test -p traveltrust-api role_identity_dual_write"
