#!/usr/bin/env bash
# Quick ① Anvil bytecode + semantic sanity for key contract addresses in root .env
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env}"
RPC="${ANVIL_RPC:-http://127.0.0.1:8545}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "verify-anvil-bytecode: skip (no .env)"
  exit 0
fi

get_val() {
  local k="$1" line v=""
  while IFS= read -r line || [[ -n "$line" ]]; do
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "$line" =~ ^[[:space:]]*${k}= ]]; then
      v="$(echo "$line" | sed "s/^[[:space:]]*${k}=//" | tr -d '\r' | sed 's/^"\(.*\)"$/\1/')"
    fi
  done <"$ENV_FILE"
  echo -n "$v"
}

has_code() {
  local addr="$1"
  [[ -n "$addr" && "$addr" == 0x* ]] || return 1
  local code
  code="$(cast code "$addr" --rpc-url "$RPC" 2>/dev/null || true)"
  [[ -n "$code" && "$code" != "0x" ]]
}

fail=0
check_addr() {
  local name="$1" addr="$2"
  if [[ -z "$addr" ]]; then
    echo "verify-anvil-bytecode: SKIP $name (empty)"
    return 0
  fi
  if has_code "$addr"; then
    echo "verify-anvil-bytecode: OK   $name=$addr"
  else
    echo "verify-anvil-bytecode: FAIL $name=$addr (no bytecode on $RPC)"
    fail=1
  fi
}

GUIDE="$(get_val GUIDE_STAKING_ADDRESS)"
PROVIDER="$(get_val STAKING_PROVIDER_ADDRESS)"
POOL="$(get_val REGION_STEWARD_STAKE_POOL_ADDRESS)"
TTG="$(get_val GOVERNANCE_TOKEN_ADDRESS)"
SETTLE="$(get_val SETTLEMENT_TOKEN)"
REG="$(get_val REGISTRY_ADDRESS)"
FACTORY="$(get_val ESCROW_FACTORY_ADDRESS)"

check_addr "GUIDE_STAKING_ADDRESS" "$GUIDE"
check_addr "STAKING_PROVIDER_ADDRESS" "$PROVIDER"
check_addr "REGION_STEWARD_STAKE_POOL_ADDRESS" "$POOL"
check_addr "GOVERNANCE_TOKEN_ADDRESS" "$TTG"
check_addr "SETTLEMENT_TOKEN" "$SETTLE"
check_addr "REGISTRY_ADDRESS" "$REG"
check_addr "ESCROW_FACTORY_ADDRESS" "$FACTORY"

# Semantic: pool must not equal settlement token; TTG must not equal escrow factory
if [[ -n "$POOL" && -n "$SETTLE" && "${POOL,,}" == "${SETTLE,,}" ]]; then
  echo "verify-anvil-bytecode: FAIL REGION_STEWARD_STAKE_POOL == SETTLEMENT_TOKEN (address collision)"
  fail=1
fi
if [[ -n "$TTG" && -n "$FACTORY" && "${TTG,,}" == "${FACTORY,,}" ]]; then
  echo "verify-anvil-bytecode: FAIL GOVERNANCE_TOKEN == ESCROW_FACTORY (address collision)"
  fail=1
fi
if [[ -n "$POOL" ]]; then
  pool_ttg="$(cast call "$POOL" "ttg()(address)" --rpc-url "$RPC" 2>/dev/null || true)"
  if [[ -z "$pool_ttg" || "$pool_ttg" != 0x* ]]; then
    echo "verify-anvil-bytecode: FAIL REGION_STEWARD_STAKE_POOL missing ttg() — not a stake pool"
    fail=1
  else
    echo "verify-anvil-bytecode: OK   pool.ttg()=$pool_ttg"
  fi
fi

if [[ "$fail" -ne 0 ]]; then
  echo "verify-anvil-bytecode: FAIL — run: bash scripts/dev/align-anvil-local-stack.sh"
  exit 1
fi
echo "verify-anvil-bytecode: all checks passed"
exit 0
