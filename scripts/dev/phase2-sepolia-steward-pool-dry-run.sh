#!/usr/bin/env bash
# Phase ② · Sepolia RegionStewardStakePool dry-run（无 --broadcast）
#
#   bash scripts/dev/phase2-sepolia-steward-pool-dry-run.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_STEWARD_DRY_RUN_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/steward-pool-dry-run/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "phase2-sepolia-steward-pool-dry-run: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-steward-pool-dry-run: OK $*"; }

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
[[ -n "${TIMELOCK_ADDRESS:-}" && "$TIMELOCK_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADDRESS unset — complete governance stack first"
[[ -n "${GOVERNANCE_TOKEN_ADDRESS:-}" && "$GOVERNANCE_TOKEN_ADDRESS" != *"..."* ]] \
  || fail "GOVERNANCE_TOKEN_ADDRESS unset — required as STEWARD_TTG on Sepolia"

export STEWARD_TTG_ADDRESS="${STEWARD_TTG_ADDRESS:-$GOVERNANCE_TOKEN_ADDRESS}"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
[[ "$TIMELOCK_ADDRESS" != "$DEPLOYER" ]] || fail "R-02: TIMELOCK_ADDRESS must not equal deployer EOA"

NONCE="$(cast nonce "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "unknown")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-11155111}")"
[[ "$CHAIN_ID" == "11155111" ]] || fail "chain_id=$CHAIN_ID (required Sepolia 11155111)"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-steward-dry-run-${TS}.log"
REPORT="$EVIDENCE/precheck.json"

echo "phase2-sepolia-steward-pool-dry-run: protocol quote parity..."
bash "$ROOT/scripts/gates/check-protocol-quote-parity.sh" >/dev/null \
  || fail "check-protocol-quote-parity.sh failed"

(
  cd "$ROOT/contracts"
  forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
    --rpc-url "$CHAIN_RPC_URL" \
    --slow \
    -vv 2>&1 | tee "$LOG"
) || fail "DeployRegionStewardStakePool dry-run failed"

grep -q "STEWARD_BINDING_CHECK: OK" "$LOG" || fail "missing STEWARD_BINDING_CHECK: OK in forge log"
grep -q "pool_owner_is_timelock true" "$LOG" || fail "expected pool_owner_is_timelock true"
grep -q "pool_owner_not_deployer true" "$LOG" || fail "expected pool_owner_not_deployer true (R-02)"

bash "$ROOT/scripts/dev/phase2-sepolia-steward-pool-verify-bindings.sh" \
  --from-log "$LOG" --timelock "$TIMELOCK_ADDRESS" --deployer "$DEPLOYER" \
  || fail "steward pool binding verification failed"

GAS_EST="$(grep -E 'Estimated total gas|Estimated amount required' "$LOG" | tail -6 | tr '\n' ' ' || echo "see log")"
POOL="$(grep -E '^  REGION_STEWARD_STAKE_POOL ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"
MIN_CN="$(grep -E '^  min_stake_CN ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_steward_pool_dry_run_precheck.v1",
  "timestamp_utc": "$TS",
  "chain_id": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "deployer_nonce": "$NONCE",
  "deployer_balance_wei": "$BAL_WEI",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "steward_ttg_address": "$STEWARD_TTG_ADDRESS",
  "pool_owner_must_be_timelock": true,
  "pool_owner_must_not_be_deployer": true,
  "broadcast": false,
  "simulated_addresses": {
    "region_steward_stake_pool_address": "$POOL"
  },
  "binding_check": "STEWARD_BINDING_CHECK: OK",
  "min_stake_cn_wei": "$MIN_CN",
  "gas_estimate_note": "$GAS_EST",
  "forge_log": "$(basename "$LOG")",
  "ssot": "docs/runbook/TT-PHASE2-STEWARD-POOL-SEPOLIA-BROADCAST-CHECKLIST.md"
}
EOF

ok "dry-run log → $LOG"
ok "precheck → $REPORT"
echo "TT_PHASE2_SEPOLIA_STEWARD_POOL_DRY_RUN: OK (no broadcast)"
