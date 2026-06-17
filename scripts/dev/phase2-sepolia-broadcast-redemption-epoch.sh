#!/usr/bin/env bash
# Phase ② · Sepolia · DeployCountryPoolRedemptionEpochV0 --broadcast
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-redemption-epoch.sh
#
# SSOT: docs/runbook/TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_REDEMPTION_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/redemption-epoch-broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-redemption-epoch: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-redemption-epoch: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 — see TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST §4"
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
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"
command -v node >/dev/null 2>&1 || fail "node not found"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "refusing broadcast: chain_id=$CHAIN_ID"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$TIMELOCK_ADDRESS" != "$DEPLOYER" ]] || fail "R-02: TIMELOCK_ADDRESS must not equal deployer EOA"

BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
MIN_WEI=$((50000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.05 ETH"
fi

echo "phase2-sepolia-broadcast-redemption-epoch: pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh"

echo "phase2-sepolia-broadcast-redemption-epoch: dry-run (skip spine · ISSUED path)..."
export PHASE2_SKIP_SPINE_AUDIT=1
bash "$ROOT/scripts/dev/phase2-sepolia-redemption-epoch-dry-run.sh"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-redemption-epoch: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployCountryPoolRedemptionEpochV0.s.sol:DeployCountryPoolRedemptionEpochV0 \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

grep -q "REDEMPTION_BINDING_CHECK: OK" "$LOG" || fail "broadcast log missing REDEMPTION_BINDING_CHECK: OK"

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployCountryPoolRedemptionEpochV0.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
REPORT="$EVIDENCE/broadcast-${TS}.json"

EPOCH="$(node - "$BROADCAST_JSON" <<'NODE'
const fs = require("fs");
const path = process.argv[2];
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const txs = data.transactions || [];
for (let i = txs.length - 1; i >= 0; i--) {
  const tx = txs[i];
  if (tx.contractName === "CountryPoolRedemptionEpochV0" && tx.contractAddress) {
    console.log(tx.contractAddress);
    break;
  }
}
NODE
)"

ASSET="$(grep -E '^  REDEMPTION_ASSET ' "$LOG" | tail -1 | awk '{print $2}')"
[[ -n "$EPOCH" && "$EPOCH" == 0x* ]] || fail "could not extract CountryPoolRedemptionEpochV0 address"
[[ -n "$ASSET" && "$ASSET" == 0x* ]] || fail "could not parse REDEMPTION_ASSET from log"

export COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS="$EPOCH"
export REDEMPTION_ASSET_ADDRESS="$ASSET"

VERIFY_RPC="${PHASE2_VERIFY_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}"
export PHASE2_VERIFY_RPC_URL="$VERIFY_RPC"
export CHAIN_RPC_URL="$VERIFY_RPC"
bash "$ROOT/scripts/dev/phase2-sepolia-redemption-epoch-verify-bindings.sh" --deployer "$DEPLOYER" \
  || fail "post-broadcast verification failed"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_redemption_epoch_broadcast.v1",
  "timestamp_utc": "$TS",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "deployer": "$DEPLOYER",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "broadcast": true,
  "addresses": {
    "country_pool_redemption_epoch_cn_address": "$EPOCH",
    "redemption_asset_address": "$ASSET"
  },
  "redemption_rules": {
    "jurisdiction": "CN",
    "max_nav_pct_bps": 1000,
    "window_seconds": 1296000
  },
  "forge_log": "$(basename "$LOG")",
  "broadcast_json": "${BROADCAST_JSON#$ROOT/}",
  "ssot": "docs/runbook/TT-PHASE2-REDEMPTION-EPOCH-SEPOLIA-BROADCAST-CHECKLIST.md §5"
}
EOF

ok "broadcast log → $LOG"
ok "report → $REPORT"
echo "TT_PHASE2_SEPOLIA_BROADCAST_ADDRESSES: redemptionEpochCN=$EPOCH redemptionAsset=$ASSET"
echo "TT_PHASE2_SEPOLIA_REDEMPTION_EPOCH_BROADCAST: OK"
