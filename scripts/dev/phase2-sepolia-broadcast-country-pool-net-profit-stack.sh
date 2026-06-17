#!/usr/bin/env bash
# Phase ② · Sepolia · DeployCountryPoolNetProfitStack（G24-P-07 · DE pilot triplet）
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-country-pool-net-profit-stack.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
SEPOLIA_CHAIN_ID=11155111
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/country-pool-net-profit-stack/${TS}"

fail() { echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: FAIL $*" >&2; exit 2; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

while IFS= read -r line || [[ -n "$line" ]]; do
  line="${line%%#*}"
  line="$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
  [[ -z "$line" || "$line" != *=* ]] && continue
  key="${line%%=*}"
  val="${line#*=}"
  val="${val%\"}"; val="${val#\"}"
  export "$key=$val"
done < "$ENV_FILE"

export SETTLEMENT_TOKEN_ADDRESS="${SETTLEMENT_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"
export STEWARD_STAKE_POOL_ADDRESS="${STEWARD_STAKE_POOL_ADDRESS:-${REGION_STEWARD_STAKE_POOL_ADDRESS:-}}"
export GLOBAL_TREASURY_ADDRESS="${GLOBAL_TREASURY_ADDRESS:-${TIMELOCK_ADDRESS:-}}"
export SETTLEMENT_JURISDICTION="${SETTLEMENT_JURISDICTION:-DE}"

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL required"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY required"
[[ -n "${TIMELOCK_ADDRESS:-}" ]] || fail "TIMELOCK_ADDRESS required"
[[ -n "${SETTLEMENT_TOKEN_ADDRESS:-}" ]] || fail "SETTLEMENT_TOKEN_ADDRESS required"
[[ -n "${STEWARD_STAKE_POOL_ADDRESS:-}" ]] || fail "STEWARD_STAKE_POOL_ADDRESS required"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID"

# Skip if triplet already deployed and readable
if [[ -n "${COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS:-}" ]]; then
  if cast call "$COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS" "stewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" >/dev/null 2>&1; then
    echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: skip existing $COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS"
    exit 0
  fi
fi

# Skip if latest broadcast already on chain (avoid duplicate stack on repeated pregate)
BROADCAST_JSON="$ROOT/contracts/broadcast/DeployCountryPoolNetProfitStack.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
if [[ -f "$BROADCAST_JSON" ]]; then
  CAND="$(python - "$BROADCAST_JSON" <<'PY'
import json, sys
with open(sys.argv[1], encoding="utf-8") as f:
    data = json.load(f)
for tx in reversed(data.get("transactions") or []):
    if tx.get("contractName") == "CountryPoolNetProfitLedger" and tx.get("contractAddress"):
        print(tx["contractAddress"])
        break
PY
)"
  if cast call "$CAND" "stewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" >/dev/null 2>&1; then
    echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: skip on-chain $CAND"
    STEWARD_V="$(cast call "$CAND" "stewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
    UNALLOC_V="$(cast call "$CAND" "unallocatedStewardPathVault()(address)" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
    ENV_APPEND="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia/country-pool-net-profit-stack/latest-skip.env"
    mkdir -p "$(dirname "$ENV_APPEND")"
    cat >"$ENV_APPEND" <<EOF
COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=${CAND}
COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS=${STEWARD_V}
COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS=${UNALLOC_V}
COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS=${SETTLEMENT_TOKEN_ADDRESS}
EOF
    exit 0
  fi
fi

mkdir -p "$EVID"
LOG="$EVID/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: dry-run..."
(
  cd "$ROOT/contracts"
  forge script script/DeployCountryPoolNetProfitStack.s.sol:DeployCountryPoolNetProfitStack \
    --rpc-url "$CHAIN_RPC_URL" -vv 2>&1 | tee "$EVID/dry-run-${TS}.log"
)

echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployCountryPoolNetProfitStack.s.sol:DeployCountryPoolNetProfitStack \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

LEDGER="$(grep -o 'COUNTRY_POOL_NET_PROFIT_LEDGER 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
STEWARD_V="$(grep -o 'COUNTRY_POOL_STEWARD_PATH_VAULT 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
UNALLOC_V="$(grep -o 'COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"

[[ -n "$LEDGER" ]] || fail "could not parse ledger from broadcast log"

ENV_APPEND="$EVID/phase2-env-append-${TS}.env"
cat >"$ENV_APPEND" <<EOF
# G24-P-07 · CountryPoolNetProfitStack · Sepolia ${TS}
COUNTRY_POOL_NET_PROFIT_LEDGER_ADDRESS=${LEDGER}
COUNTRY_POOL_STEWARD_PATH_VAULT_ADDRESS=${STEWARD_V}
COUNTRY_POOL_UNALLOCATED_STEWARD_VAULT_ADDRESS=${UNALLOC_V}
COUNTRY_POOL_NET_PROFIT_SETTLEMENT_TOKEN_ADDRESS=${SETTLEMENT_TOKEN_ADDRESS}
EOF

echo "phase2-sepolia-broadcast-country-pool-net-profit-stack: OK ledger=${LEDGER}"
echo "TT_COUNTRY_POOL_NET_PROFIT_STACK: OK ledger=${LEDGER} steward_vault=${STEWARD_V} unalloc_vault=${UNALLOC_V}"
