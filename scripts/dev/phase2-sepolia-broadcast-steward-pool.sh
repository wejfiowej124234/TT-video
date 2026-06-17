#!/usr/bin/env bash
# Phase ② · Sepolia · DeployRegionStewardStakePool --broadcast
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-steward-pool.sh
#
# SSOT: docs/runbook/TT-PHASE2-STEWARD-POOL-SEPOLIA-BROADCAST-CHECKLIST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_STEWARD_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/steward-pool-broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-steward-pool: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-steward-pool: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 — see TT-PHASE2-STEWARD-POOL-SEPOLIA-BROADCAST-CHECKLIST §4"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

RPC_URL_OVERRIDE="${CHAIN_RPC_URL:-}"

load_env() {
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

if [[ -n "$RPC_URL_OVERRIDE" ]]; then
  export CHAIN_RPC_URL="$RPC_URL_OVERRIDE"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] \
  || fail "TIMELOCK_ADDRESS unset"
[[ -n "${GOVERNANCE_TOKEN_ADDRESS:-}" && "$GOVERNANCE_TOKEN_ADDRESS" != *"..."* ]] \
  || fail "GOVERNANCE_TOKEN_ADDRESS unset"

export STEWARD_TTG_ADDRESS="${STEWARD_TTG_ADDRESS:-$GOVERNANCE_TOKEN_ADDRESS}"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"
command -v node >/dev/null 2>&1 || fail "node not found (broadcast address extract)"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=$CHAIN_ID (required Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$TIMELOCK_ADDRESS" != "$DEPLOYER" ]] || fail "R-02: TIMELOCK_ADDRESS must not equal deployer EOA"

BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
MIN_WEI=$((50000000000000000)) # 0.05 ETH
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.05 ETH — fund Sepolia deployer first"
fi

echo "phase2-sepolia-broadcast-steward-pool: pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh"

echo "phase2-sepolia-broadcast-steward-pool: dry-run..."
bash "$ROOT/scripts/dev/phase2-sepolia-steward-pool-dry-run.sh"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-steward-pool: broadcasting DeployRegionStewardStakePool..."
(
  cd "$ROOT/contracts"
  forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

grep -q "STEWARD_BINDING_CHECK: OK" "$LOG" || fail "broadcast log missing STEWARD_BINDING_CHECK: OK"

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployRegionStewardStakePool.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
REPORT="$EVIDENCE/broadcast-${TS}.json"

POOL="$(node - "$BROADCAST_JSON" <<'NODE'
const fs = require("fs");
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const txs = data.transactions || [];
for (let i = txs.length - 1; i >= 0; i--) {
  const tx = txs[i];
  if (tx.contractName === "RegionStewardStakePool" && tx.contractAddress) {
    console.log(tx.contractAddress);
    break;
  }
}
NODE
)"

[[ -n "$POOL" && "$POOL" == 0x* ]] || fail "could not extract RegionStewardStakePool from $BROADCAST_JSON"

export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"

VERIFY_RPC="${PHASE2_VERIFY_RPC_URL:-https://1rpc.io/sepolia}"
export CHAIN_RPC_URL="$VERIFY_RPC"
echo "phase2-sepolia-broadcast-steward-pool: on-chain verification via $VERIFY_RPC ..."
bash "$ROOT/scripts/dev/phase2-sepolia-steward-pool-verify-bindings.sh" \
  --deployer "$DEPLOYER" \
  || fail "post-broadcast on-chain verification failed"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_steward_pool_broadcast.v1",
  "timestamp_utc": "$TS",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "deployer": "$DEPLOYER",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "steward_ttg_address": "$STEWARD_TTG_ADDRESS",
  "broadcast": true,
  "agent_proxy_ok_env": "TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1",
  "addresses": {
    "region_steward_stake_pool_address": "$POOL"
  },
  "forge_log": "$(basename "$LOG")",
  "broadcast_json": "${BROADCAST_JSON#$ROOT/}",
  "next_owner_actions": [
    "Update scripts/dev/.env.phase2-chain-deploy.local REGION_STEWARD_STAKE_POOL_ADDRESS",
    "Update registry/protocol-convergence-deployments.v1.yaml environments.sepolia.addresses.region_steward_stake_pool_address",
    "Update root .env Sepolia section REGION_STEWARD_STAKE_POOL_ADDRESS"
  ],
  "ssot": "docs/runbook/TT-PHASE2-STEWARD-POOL-SEPOLIA-BROADCAST-CHECKLIST.md §5"
}
EOF

ok "broadcast log → $LOG"
ok "report → $REPORT"
echo "TT_PHASE2_SEPOLIA_BROADCAST_ADDRESSES: regionStewardStakePool=$POOL"
echo "TT_PHASE2_SEPOLIA_STEWARD_POOL_BROADCAST: OK"
