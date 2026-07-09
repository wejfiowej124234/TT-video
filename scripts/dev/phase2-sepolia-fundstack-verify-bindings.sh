#!/usr/bin/env bash
# Phase ② · FundStack owner / Timelock / FeeRouter legs / allowlist 验收
#
#   bash scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh
#   bash scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh --from-log evidence/.../forge-*.log --timelock 0x...
#
# 模式：
#   - 默认：读 env（FEE_ROUTER_ADDRESS 等已播地址）+ cast 链上验收
#   - --from-log：dry-run 日志 BINDING 行 + 模拟地址结构验收（无链上 cast）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"

fail() { echo "phase2-sepolia-fundstack-verify-bindings: FAIL $*" >&2; exit 2; }
pass() { echo "  VERIFY PASS: $*"; }
ok() { echo "phase2-sepolia-fundstack-verify-bindings: OK $*"; }

FROM_LOG=""
LOG_FILE=""
TIMELOCK=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --from-log) FROM_LOG=1; LOG_FILE="${2:-}"; shift 2 ;;
    --timelock) TIMELOCK="${2:-}"; shift 2 ;;
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

if [[ -n "$FROM_LOG" ]]; then
  [[ -f "$LOG_FILE" ]] || fail "log not found: $LOG_FILE"
  grep -q "FUNDSTACK_BINDING_CHECK: OK" "$LOG_FILE" || fail "log missing FUNDSTACK_BINDING_CHECK: OK"

  _expect_binding() {
    local key="$1" expected="$2"
    local line actual
    line="$(grep "BINDING $key" "$LOG_FILE" | tail -1 || true)"
    [[ -n "$line" ]] || fail "missing BINDING $key in log"
    actual="$(echo "$line" | awk '{print $NF}')"
    [[ "${actual,,}" == "${expected,,}" ]] || fail "BINDING $key: got $actual want $expected"
    pass "$key → $expected"
  }

  RV="$(grep -E '^  RegionVault ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  FR="$(grep -E '^  FeeRouter ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  GT="$(grep -E '^  GovernanceTreasury ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  RSV="$(grep -E '^  ReserveVault_fee_track ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  GIS="$(grep -E '^  GuideIdentityStakingPool ' "$LOG_FILE" | tail -1 | awk '{print $2}')"
  EF="$(grep -E '^  EscrowFactory ' "$LOG_FILE" | head -1 | awk '{print $2}')"

  [[ -n "$FR" && -n "$RV" && -n "$GT" && -n "$RSV" && -n "$GIS" ]] || fail "could not parse simulated contract addresses from log"

  _expect_binding "feeRouter.owner" "$TIMELOCK"
  _expect_binding "regionVault.owner" "$TIMELOCK"
  _expect_binding "treasury.owner" "$TIMELOCK"
  _expect_binding "treasury.spender" "$TIMELOCK"
  _expect_binding "reserveVault.timelock" "$TIMELOCK"
  _expect_binding "guidePool.slasher" "$TIMELOCK"
  _expect_binding "providerPool.slasher" "$TIMELOCK"
  _expect_binding "factory.guardian" "$TIMELOCK"
  _expect_binding "feeRouter.countryBucket" "$RV"
  _expect_binding "feeRouter.globalStakers" "$GIS"
  _expect_binding "feeRouter.globalReserve" "$RSV"
  _expect_binding "feeRouter.globalOps" "$GT"

  ok "dry-run log bindings ($LOG_FILE)"
  exit 0
fi

RPC="${PHASE2_VERIFY_RPC_URL:-${CHAIN_RPC_URL:-https://sepolia.drpc.org}}"

pick_rpc() {
  local r
  for r in "${PHASE2_VERIFY_RPC_URL:-}" "${CHAIN_RPC_URL:-}" "https://sepolia.drpc.org" "https://ethereum-sepolia-rpc.publicnode.com" "https://1rpc.io/sepolia"; do
    [[ -z "$r" ]] && continue
    if cast chain-id --rpc-url "$r" >/dev/null 2>&1; then
      echo "$r"
      return 0
    fi
  done
  return 1
}

cast_call() {
  local to="$1" sig="$2"
  shift 2
  local attempts=0 out=""
  while (( attempts < 5 )); do
    if out="$(cast call "$to" "$sig" "$@" --rpc-url "$RPC" 2>/dev/null)"; then
      echo "$out"
      return 0
    fi
    attempts=$((attempts + 1))
    RPC="$(pick_rpc)" || fail "no working Sepolia RPC"
    export PHASE2_VERIFY_RPC_URL="$RPC"
    sleep 2
  done
  fail "cast call failed: $to $sig"
}
FR="${FEE_ROUTER_ADDRESS:-}"
RV="${REGION_VAULT_ADDRESS:-}"
# FeeRouter globalOps leg → legacy GovernanceTreasury (not P4Cap)
LEGACY_GT="${LEGACY_TREASURY_ADDRESS:-}"
P4CAP_GT="${GOVERNANCE_TREASURY_P4CAP_ADDRESS:-${TREASURY_P4_CAP_ADDRESS:-}}"
RSV="${RESERVE_VAULT_ADDRESS:-}"
EF="${ESCROW_FACTORY_ADDRESS:-}"
GIS="${GUIDE_STAKING_POOL_ADDRESS:-${GUIDE_STAKING_ADDRESS:-}}"
PIS="${PROVIDER_STAKING_POOL_ADDRESS:-${STAKING_PROVIDER_ADDRESS:-}}"

[[ -n "$FR" && "$FR" != *"..."* ]] || fail "FEE_ROUTER_ADDRESS unset (broadcast first or use --from-log)"
[[ -n "$RV" && "$RV" != *"..."* ]] || fail "REGION_VAULT_ADDRESS unset"
[[ -n "$LEGACY_GT" && "$LEGACY_GT" != *"..."* ]] || fail "LEGACY_TREASURY_ADDRESS unset (FeeRouter globalOps / legacy GovernanceTreasury)"
[[ -n "$P4CAP_GT" && "$P4CAP_GT" != *"..."* ]] || fail "GOVERNANCE_TREASURY_P4CAP_ADDRESS unset"
[[ -n "$RSV" && "$RSV" != *"..."* ]] || fail "RESERVE_VAULT_ADDRESS unset"

_eq() {
  local label="$1" got="$2" want="$3"
  [[ "${got,,}" == "${want,,}" ]] || fail "$label: got $got want $want"
  pass "$label"
}

_eq "FeeRouter.owner" "$(cast_call "$FR" "owner()(address)")" "$TIMELOCK"
_eq "RegionVault.owner" "$(cast_call "$RV" "owner()(address)")" "$TIMELOCK"
_eq "Treasury.owner" "$(cast_call "$LEGACY_GT" "owner()(address)")" "$TIMELOCK"
_eq "Treasury.spender" "$(cast_call "$LEGACY_GT" "spender()(address)")" "$TIMELOCK"
_eq "ReserveVault.timelock" "$(cast_call "$RSV" "timelock()(address)")" "$TIMELOCK"
_eq "FeeRouter.countryBucket" "$(cast_call "$FR" "countryBucket()(address)")" "$RV"
_eq "FeeRouter.globalStakers" "$(cast_call "$FR" "globalStakers()(address)")" "$GIS"
_eq "FeeRouter.globalReserve" "$(cast_call "$FR" "globalReserve()(address)")" "$RSV"
_eq "FeeRouter.globalOps" "$(cast_call "$FR" "globalOps()(address)")" "$LEGACY_GT"
pass "GovernanceTreasuryP4Cap configured $P4CAP_GT (not FeeRouter globalOps leg)"

_allow() {
  local target="$1" name="$2"
  local v
  v="$(cast_call "$TIMELOCK" "allowedExecutionTarget(address)(bool)" "$target")"
  [[ "$v" == "true" ]] || fail "allowlist $name: false"
  pass "allowlist $name"
}

_allow "$FR" "FeeRouter"
_allow "$GT" "Treasury"
_allow "$RSV" "ReserveVault"
_allow "$RV" "RegionVault"

if [[ -n "$EF" && "$EF" != *"..."* ]]; then
  _eq "EscrowFactory.guardian" "$(cast_call "$EF" "guardian()(address)")" "$TIMELOCK"
fi
if [[ -n "$GIS" && "$GIS" != *"..."* ]]; then
  _eq "GuidePool.slasher" "$(cast_call "$GIS" "slasher()(address)")" "$TIMELOCK"
fi
if [[ -n "$PIS" && "$PIS" != *"..."* ]]; then
  _eq "ProviderPool.slasher" "$(cast_call "$PIS" "slasher()(address)")" "$TIMELOCK"
fi

ok "on-chain bindings (Timelock=$TIMELOCK)"
