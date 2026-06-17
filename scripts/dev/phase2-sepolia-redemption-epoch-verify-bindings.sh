#!/usr/bin/env bash
# Phase ② · CountryPoolRedemptionEpochV0 owner / Timelock / SSOT params / registry·API 对拍
#
#   bash scripts/dev/phase2-sepolia-redemption-epoch-verify-bindings.sh
#   bash scripts/dev/phase2-sepolia-redemption-epoch-verify-bindings.sh --from-log evidence/.../forge-*.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"

fail() { echo "phase2-sepolia-redemption-epoch-verify-bindings: FAIL $*" >&2; exit 2; }
pass() { echo "  VERIFY PASS: $*"; }
ok() { echo "phase2-sepolia-redemption-epoch-verify-bindings: OK $*"; }

FROM_LOG=""
LOG_FILE=""
TIMELOCK=""
DEPLOYER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-log) FROM_LOG=1; LOG_FILE="${2:-}"; shift 2 ;;
    --timelock) TIMELOCK="${2:-}"; shift 2 ;;
    --deployer) DEPLOYER="${2:-}"; shift 2 ;;
    *) fail "unknown arg: $1" ;;
  esac
done

load_env() {
  [[ -f "$ENV_FILE" ]] || return 0
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

load_env
TIMELOCK="${TIMELOCK:-${TIMELOCK_ADDRESS:-}}"
[[ -n "$TIMELOCK" && "$TIMELOCK" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"

RPC="${PHASE2_VERIFY_RPC_URL:-${CHAIN_RPC_URL:-https://1rpc.io/sepolia}}"

check_registry_api_parity() {
  [[ -f "$REGISTRY" ]] || fail "missing $REGISTRY"
  grep -q "COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS: country_pool_redemption_epoch_cn_address" "$REGISTRY" \
    || fail "registry missing env_to_registry COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS"
  grep -q 'redemption/quote' "$ROOT/crates/api/src/routes/redemption.rs" \
    || fail "API missing /api/v1/redemption/quote"
  grep -q 'redemption_max_nav_pct_bps' "$ROOT/crates/api/src/chain_off/steward_application.rs" \
    || fail "API redemption_quote_json missing SSOT fields"
  pass "registry env_to_registry ↔ API redemption/quote SSOT"
}

if [[ -n "$FROM_LOG" ]]; then
  [[ -f "$LOG_FILE" ]] || fail "log not found: $LOG_FILE"
  grep -q "REDEMPTION_BINDING_CHECK: OK" "$LOG_FILE" || fail "log missing REDEMPTION_BINDING_CHECK: OK"
  grep -q "epoch_owner_is_timelock true" "$LOG_FILE" || fail "expected epoch_owner_is_timelock true"
  grep -q "epoch_owner_not_deployer true" "$LOG_FILE" || fail "expected epoch_owner_not_deployer true (R-02)"

  _expect_binding() {
    local key="$1" expected="$2"
    local line actual
    line="$(grep -E "BINDING ${key} " "$LOG_FILE" | tail -1 || true)"
    [[ -n "$line" ]] || fail "missing BINDING $key in log"
    actual="$(echo "$line" | awk '{print $NF}')"
    [[ "${actual,,}" == "${expected,,}" ]] || fail "BINDING $key: got $actual want $expected"
    pass "$key → $expected"
  }

  EPOCH="$(grep -E '^  COUNTRY_POOL_REDEMPTION_EPOCH_CN ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  ASSET="$(grep -E '^  REDEMPTION_ASSET ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  [[ -n "$EPOCH" && -n "$ASSET" ]] || fail "could not parse epoch/asset from log"

  _expect_binding "epoch.owner" "$TIMELOCK"
  _expect_binding "epoch.owner_is_timelock" "true"
  _expect_binding "epoch.owner_not_deployer" "true"
  _expect_binding "epoch.asset" "$ASSET"
  _expect_binding "epoch.maxNavPctBps" "1000"
  _expect_binding "epoch.windowSeconds" "1296000"
  # CN bytes2 = 0x434e = 17230 decimal
  _expect_binding "epoch.jurisdiction" "17230"

  check_registry_api_parity

  REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'country_pool_redemption_epoch_cn_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
  if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
    EPOCH_ENV="${COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:-}"
    [[ -n "$EPOCH_ENV" ]] || fail "registry has epoch but env unset"
    [[ "${EPOCH_ENV,,}" == "${REG_VAL,,}" ]] || fail "env/registry epoch mismatch"
    pass "env COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS ↔ registry"
  else
    pass "registry country_pool_redemption_epoch_cn_address null (pre-broadcast expected)"
  fi

  ok "dry-run log bindings ($LOG_FILE)"
  exit 0
fi

RPC="${PHASE2_VERIFY_RPC_URL:-${CHAIN_RPC_URL:-https://1rpc.io/sepolia}}"
EPOCH="${COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:-}"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] && DEPLOYER="${DEPLOYER:-$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null || true)}"
[[ -n "$EPOCH" && "$EPOCH" != *"..."* ]] || fail "COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS unset (broadcast first or use --from-log)"

_eq() {
  local label="$1" got="$2" want="$3"
  [[ "${got,,}" == "${want,,}" ]] || fail "$label: got $got want $want"
  pass "$label"
}

_eq_num() {
  local label="$1" got="$2" want="$3"
  [[ "$got" == "$want" ]] || fail "$label: got $got want $want"
  pass "$label"
}

OWNER="$(cast call "$EPOCH" "owner()(address)" --rpc-url "$RPC" 2>/dev/null || echo "")"
[[ -n "$OWNER" ]] || fail "cast owner() failed — try CHAIN_RPC_URL=https://1rpc.io/sepolia"

_eq "epoch.owner" "$OWNER" "$TIMELOCK"
if [[ -n "$DEPLOYER" ]]; then
  [[ "${OWNER,,}" != "${DEPLOYER,,}" ]] || fail "epoch.owner is deployer EOA"
  pass "epoch.owner_not_deployer"
fi
_eq_num "epoch.maxNavPctBps" "$(cast call "$EPOCH" "maxNavPctBps()(uint256)" --rpc-url "$RPC" | awk '{print $1}')" "1000"
_eq_num "epoch.windowSeconds" "$(cast call "$EPOCH" "windowSeconds()(uint256)" --rpc-url "$RPC" | awk '{print $1}')" "1296000"
# bytes2("CN") = 0x434e = 17230 — cast may return hex or decimal
JURIS="$(cast call "$EPOCH" "jurisdiction()(bytes2)" --rpc-url "$RPC" | awk '{print $1}')"
if [[ "$JURIS" == "17230" || "${JURIS,,}" == "0x434e" ]]; then
  pass "epoch.jurisdiction(CN)"
else
  fail "epoch.jurisdiction(CN): got $JURIS want 17230 or 0x434e"
fi
_eq "epoch.version" "$(cast call "$EPOCH" "version()(string)" --rpc-url "$RPC" | tr -d '"')" "country_pool_redemption_epoch_v0"

ASSET_ENV="${REDEMPTION_ASSET_ADDRESS:-}"
if [[ -n "$ASSET_ENV" && "$ASSET_ENV" != *"..."* ]]; then
  _eq "epoch.asset" "$(cast call "$EPOCH" "asset()(address)" --rpc-url "$RPC")" "$ASSET_ENV"
fi

check_registry_api_parity
REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'country_pool_redemption_epoch_cn_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
  _eq "env/registry epoch" "${COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS:-}" "$REG_VAL"
fi

ok "on-chain bindings (epoch=$EPOCH Timelock=$TIMELOCK)"
