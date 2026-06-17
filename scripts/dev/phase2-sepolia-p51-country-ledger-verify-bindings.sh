#!/usr/bin/env bash
# Phase ② · CountryPoolLedgerV0 owner / Timelock / pilot DE / registry·API 对拍
#
#   bash scripts/dev/phase2-sepolia-p51-country-ledger-verify-bindings.sh
#   bash scripts/dev/phase2-sepolia-p51-country-ledger-verify-bindings.sh --from-log evidence/.../forge-*.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
REGISTRY="$ROOT/registry/protocol-convergence-deployments.v1.yaml"
PILOT_HEX="${PILOT_JURISDICTION_HEX:-0x4445}"

fail() { echo "phase2-sepolia-p51-country-ledger-verify-bindings: FAIL $*" >&2; exit 2; }
pass() { echo "  VERIFY PASS: $*"; }
ok() { echo "phase2-sepolia-p51-country-ledger-verify-bindings: OK $*"; }

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

check_registry_api_parity() {
  [[ -f "$REGISTRY" ]] || fail "missing $REGISTRY"
  grep -q "COUNTRY_POOL_LEDGER_PILOT_ADDRESS: country_pool_ledger_pilot_address" "$REGISTRY" \
    || fail "registry missing env_to_registry COUNTRY_POOL_LEDGER_PILOT_ADDRESS"
  grep -q 'governance/country-ledger' "$ROOT/crates/api/src/routes/governance_country_ledger.rs" \
    || fail "API missing GET /api/v1/governance/country-ledger/:jurisdiction"
  grep -q 'country_ledger_ssot_v0' "$ROOT/crates/api/src/routes/governance_country_ledger.rs" \
    || fail "API country_ledger rule_version drift"
  grep -q 'country_pool_ledger_address' "$ROOT/crates/api/src/chain/mod.rs" \
    || fail "ChainConfig missing country_pool_ledger_address (COUNTRY_POOL_LEDGER_ADDRESS)"
  pass "registry env_to_registry ↔ API governance/country-ledger SSOT"
}

if [[ -n "$FROM_LOG" ]]; then
  [[ -f "$LOG_FILE" ]] || fail "log not found: $LOG_FILE"
  grep -q "LEDGER_BINDING_CHECK: OK" "$LOG_FILE" || fail "log missing LEDGER_BINDING_CHECK: OK"
  grep -q "ledger_owner_is_timelock true" "$LOG_FILE" || fail "expected ledger_owner_is_timelock true"
  grep -q "ledger_owner_not_deployer true" "$LOG_FILE" || fail "expected ledger_owner_not_deployer true (R-02)"

  _expect_binding() {
    local key="$1" expected="$2"
    local line actual
    line="$(grep -E "BINDING ${key} " "$LOG_FILE" | tail -1 || true)"
    [[ -n "$line" ]] || fail "missing BINDING $key in log"
    actual="$(echo "$line" | awk '{print $NF}')"
    [[ "${actual,,}" == "${expected,,}" ]] || fail "BINDING $key: got $actual want $expected"
    pass "$key → $expected"
  }

  LEDGER="$(grep -E '^  COUNTRY_POOL_LEDGER_PILOT ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  [[ -n "$LEDGER" ]] || fail "could not parse COUNTRY_POOL_LEDGER_PILOT from log"

  _expect_binding "ledger.owner" "$TIMELOCK"
  _expect_binding "ledger.owner_is_timelock" "true"
  _expect_binding "ledger.owner_not_deployer" "true"
  # DE bytes2 = 0x4445 = 17477 decimal
  _expect_binding "ledger.pilot_jurisdiction" "17477"
  _expect_binding "ledger.version" "country_ledger_ssot_v0"

  check_registry_api_parity

  REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'country_pool_ledger_pilot_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
  if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
    LEDGER_ENV="${COUNTRY_POOL_LEDGER_PILOT_ADDRESS:-}"
    [[ -n "$LEDGER_ENV" ]] || fail "registry has ledger but env COUNTRY_POOL_LEDGER_PILOT_ADDRESS unset"
    [[ "${LEDGER_ENV,,}" == "${REG_VAL,,}" ]] || fail "env/registry ledger mismatch"
    pass "env COUNTRY_POOL_LEDGER_PILOT_ADDRESS ↔ registry"
  else
    pass "registry country_pool_ledger_pilot_address null (pre-broadcast expected)"
  fi

  ok "dry-run log bindings ($LOG_FILE)"
  exit 0
fi

RPC="${PHASE2_VERIFY_RPC_URL:-${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}}"
LEDGER="${COUNTRY_POOL_LEDGER_PILOT_ADDRESS:-}"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] && DEPLOYER="${DEPLOYER:-$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null || true)}"
[[ -n "$LEDGER" && "$LEDGER" != *"..."* ]] || fail "COUNTRY_POOL_LEDGER_PILOT_ADDRESS unset (broadcast first or use --from-log)"

_eq() {
  local label="$1" got="$2" want="$3"
  [[ "${got,,}" == "${want,,}" ]] || fail "$label: got $got want $want"
  pass "$label"
}

OWNER="$(cast call "$LEDGER" "owner()(address)" --rpc-url "$RPC" 2>/dev/null || echo "")"
[[ -n "$OWNER" ]] || fail "cast owner() failed — try PHASE2_VERIFY_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com"

_eq "ledger.owner" "$OWNER" "$TIMELOCK"
if [[ -n "$DEPLOYER" ]]; then
  [[ "${OWNER,,}" != "${DEPLOYER,,}" ]] || fail "ledger.owner is deployer EOA"
  pass "ledger.owner_not_deployer"
fi

PILOT="$(cast call "$LEDGER" "pilotJurisdiction()(bytes2)" --rpc-url "$RPC" | awk '{print $1}')"
if [[ "$PILOT" == "17477" || "${PILOT,,}" == "0x4445" ]]; then
  pass "ledger.pilot_jurisdiction(DE)"
else
  fail "ledger.pilot_jurisdiction(DE): got $PILOT want 17477 or 0x4445"
fi

_eq "ledger.version" "$(cast call "$LEDGER" "version()(string)" --rpc-url "$RPC" | tr -d '"')" "country_ledger_ssot_v0"

check_registry_api_parity
REG_VAL="$(grep -A30 '  sepolia:' "$REGISTRY" | grep 'country_pool_ledger_pilot_address' | head -1 | awk '{print $2}' | tr -d '"' || true)"
if [[ "$REG_VAL" != "null" && -n "$REG_VAL" ]]; then
  _eq "env/registry ledger" "${COUNTRY_POOL_LEDGER_PILOT_ADDRESS:-}" "$REG_VAL"
fi

API_LEDGER="${COUNTRY_POOL_LEDGER_ADDRESS:-}"
if [[ -n "$API_LEDGER" && "$API_LEDGER" != *"..."* ]]; then
  _eq "API alias COUNTRY_POOL_LEDGER_ADDRESS" "$API_LEDGER" "$LEDGER"
fi

ok "on-chain bindings (ledger=$LEDGER Timelock=$TIMELOCK pilot=DE)"
