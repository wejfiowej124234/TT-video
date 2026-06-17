#!/usr/bin/env bash
# Phase ② · RegionStewardStakePool owner / Timelock / TTG / SSOT bps / registry·API 对拍
#
#   bash scripts/dev/phase2-sepolia-steward-pool-verify-bindings.sh
#   bash scripts/dev/phase2-sepolia-steward-pool-verify-bindings.sh --from-log evidence/.../forge-*.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"

fail() { echo "phase2-sepolia-steward-pool-verify-bindings: FAIL $*" >&2; exit 2; }
pass() { echo "  VERIFY PASS: $*"; }
ok() { echo "phase2-sepolia-steward-pool-verify-bindings: OK $*"; }

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
TTG="${STEWARD_TTG_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-}}"
[[ -n "$TIMELOCK" && "$TIMELOCK" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"
[[ -n "$TTG" && "$TTG" != *"..."* ]] || fail "STEWARD_TTG_ADDRESS or GOVERNANCE_TOKEN_ADDRESS unset"

check_registry_api_parity() {
  [[ -f "$REGISTRY" ]] || fail "missing $REGISTRY"
  grep -q "REGION_STEWARD_STAKE_POOL_ADDRESS: region_steward_stake_pool_address" "$REGISTRY" \
    || fail "registry missing env_to_registry REGION_STEWARD_STAKE_POOL_ADDRESS"
  grep -q 'region_steward_stake_pool_address' "$ROOT/crates/api/src/chain/steward_stake_pool.rs" \
    || fail "API missing REGION_STEWARD_STAKE_POOL_ADDRESS consumer"
  grep -q 'steward/stake-quote' "$ROOT/crates/api/src/routes/steward.rs" \
    || fail "API missing steward/stake-quote route"
  pass "registry env_to_registry ↔ API REGION_STEWARD_STAKE_POOL_ADDRESS"
  pass "API routes steward/stake-quote · stake-status declared"
}

if [[ -n "$FROM_LOG" ]]; then
  [[ -f "$LOG_FILE" ]] || fail "log not found: $LOG_FILE"
  grep -q "STEWARD_BINDING_CHECK: OK" "$LOG_FILE" || fail "log missing STEWARD_BINDING_CHECK: OK"
  grep -q "pool_owner_is_timelock true" "$LOG_FILE" || fail "expected pool_owner_is_timelock true"
  grep -q "pool_owner_not_deployer true" "$LOG_FILE" || fail "expected pool_owner_not_deployer true (R-02)"

  _expect_binding() {
    local key="$1" expected="$2"
    local line actual
    line="$(grep -E "BINDING ${key} " "$LOG_FILE" | tail -1 || true)"
    [[ -n "$line" ]] || fail "missing BINDING $key in log"
    actual="$(echo "$line" | awk '{print $NF}')"
    [[ "${actual,,}" == "${expected,,}" ]] || fail "BINDING $key: got $actual want $expected"
    pass "$key → $expected"
  }

  POOL="$(grep -E '^  REGION_STEWARD_STAKE_POOL ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  [[ -n "$POOL" ]] || fail "could not parse REGION_STEWARD_STAKE_POOL from log"

  _expect_binding "pool.owner" "$TIMELOCK"
  _expect_binding "pool.owner_is_timelock" "true"
  _expect_binding "pool.owner_not_deployer" "true"
  _expect_binding "pool.ttg" "$TTG"
  _expect_binding "pool.stewardStakeBps_CN" "400"

  EXPECT_MIN="$(grep -E '^  min_stake_CN ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  [[ -n "$EXPECT_MIN" ]] || fail "missing min_stake_CN in log"
  _expect_binding "pool.minStakeAmount_CN" "$EXPECT_MIN"

  check_registry_api_parity

  REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'region_steward_stake_pool_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
  if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
    POOL_ENV="${REGION_STEWARD_STAKE_POOL_ADDRESS:-}"
    [[ -n "$POOL_ENV" ]] || fail "registry has pool address but REGION_STEWARD_STAKE_POOL_ADDRESS unset in env"
    [[ "${POOL_ENV,,}" == "${REG_VAL,,}" ]] || fail "env/registry pool mismatch"
    pass "env REGION_STEWARD_STAKE_POOL_ADDRESS ↔ registry"
  else
    pass "registry region_steward_stake_pool_address null (pre-broadcast expected)"
  fi

  ok "dry-run log bindings ($LOG_FILE)"
  exit 0
fi

RPC="${PHASE2_VERIFY_RPC_URL:-${CHAIN_RPC_URL:-https://1rpc.io/sepolia}}"
POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-}"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] && DEPLOYER="${DEPLOYER:-$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null || true)}"
[[ -n "$POOL" && "$POOL" != *"..."* ]] || fail "REGION_STEWARD_STAKE_POOL_ADDRESS unset (broadcast first or use --from-log)"

_eq() {
  local label="$1" got="$2" want="$3"
  [[ "${got,,}" == "${want,,}" ]] || fail "$label: got $got want $want"
  pass "$label"
}

_eq_bool() {
  local label="$1" got="$2" want="$3"
  [[ "$got" == "$want" ]] || fail "$label: got $got want $want"
  pass "$label"
}

OWNER="$(cast call "$POOL" "owner()(address)" --rpc-url "$RPC" 2>/dev/null || echo "")"
[[ -n "$OWNER" ]] || fail "cast owner() failed — try CHAIN_RPC_URL=https://1rpc.io/sepolia"

_eq "pool.owner" "$OWNER" "$TIMELOCK"
if [[ -n "$DEPLOYER" ]]; then
  _eq_bool "pool.owner_not_deployer" "$([[ "${OWNER,,}" != "${DEPLOYER,,}" ]] && echo true || echo false)" "true"
fi
_eq "pool.ttg" "$(cast call "$POOL" "ttg()(address)" --rpc-url "$RPC")" "$TTG"
_eq "pool.stewardStakeBps_CN" "$(cast call "$POOL" "stewardStakeBps(bytes2)(uint256)" 0x434e --rpc-url "$RPC" | awk '{print $1}')" "400"
_eq "pool.version" "$(cast call "$POOL" "version()(string)" --rpc-url "$RPC" | tr -d '"')" "region_steward_stake_pool_v1"

MIN_CN="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" 0x434e --rpc-url "$RPC" | awk '{print $1}')"
EXPECT_MIN_WEI="$(node -e "console.log(String(10000000n*400n/10000n*10n**18n))")"
[[ "$MIN_CN" == "$EXPECT_MIN_WEI" ]] || fail "minStakeAmount CN: got $MIN_CN want $EXPECT_MIN_WEI"
pass "pool.minStakeAmount_CN → $MIN_CN"

check_registry_api_parity
REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'region_steward_stake_pool_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
  _eq "env/registry pool" "${REGION_STEWARD_STAKE_POOL_ADDRESS:-}" "$REG_VAL"
fi

ok "on-chain bindings (pool=$POOL Timelock=$TIMELOCK)"
