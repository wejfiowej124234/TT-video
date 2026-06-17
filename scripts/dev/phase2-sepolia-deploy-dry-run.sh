#!/usr/bin/env bash
# Phase ② · Sepolia 部署 dry-run（无 --broadcast）· gas/nonce/owner 预检
#
#   bash scripts/dev/phase2-sepolia-deploy-dry-run.sh
#   # 输出 → evidence/GO_phase2_chain_sepolia/dry-run/latest/precheck.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_DRY_RUN_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/dry-run/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "phase2-sepolia-deploy-dry-run: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-deploy-dry-run: OK $*"; }

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE — run provision-phase2-timelock-admin-safe.sh first"

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
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]] \
  || fail "TIMELOCK_ADMIN_ADDRESS unset — provision Safe first"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "TIMELOCK_SAFE_OWNER_KEYS unset — required for Safe admin Phase B (see TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md)"
fi

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
NONCE="$(cast nonce "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "unknown")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-11155111}")"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-dry-run-${TS}.log"
REPORT="$EVIDENCE/precheck.json"

# §5 序 1 · Governance（dry-run / simulate only）
(
  cd "$ROOT/contracts"
  forge script script/DeployGovernanceStack.s.sol:DeployGovernanceStack \
    --rpc-url "$CHAIN_RPC_URL" \
    --slow \
    -vv 2>&1 | tee "$LOG"
) || fail "DeployGovernanceStack dry-run failed"

# 粗估 gas（forge 输出 Gas used 行求和）
GAS_EST="$(grep -E 'Gas used:|Estimated total gas' "$LOG" | tail -5 | tr '\n' ' ' || echo "see log")"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_dry_run_precheck.v1",
  "timestamp_utc": "$TS",
  "chain_id": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "deployer_nonce": "$NONCE",
  "deployer_balance_wei": "$BAL_WEI",
  "timelock_admin_address": "$TIMELOCK_ADMIN_ADDRESS",
  "timelock_admin_is_contract": $([ "$ADMIN_CODE" != "0x" ] && echo true || echo false),
  "timelock_address_env": "${TIMELOCK_ADDRESS:-null}",
  "broadcast": false,
  "deploy_order_simulated": [
    "DeployGovernanceStack.s.sol (Phase A deploy + Phase B Safe admin via Phase2SafeExec)"
  ],
  "deploy_order_pending": [
    "DeployFundStackUnderTimelock.s.sol",
    "DeployRegionStewardStakePool.s.sol",
    "DeployCountryPoolRedemptionEpochV0.s.sol"
  ],
  "gas_estimate_note": "$GAS_EST",
  "owner_bindings": {
    "governance_timelock_admin": "$TIMELOCK_ADMIN_ADDRESS",
    "escrow_factory_guardian_expected": "TIMELOCK_ADDRESS post step 1",
    "p2_pool_owner_expected": "TIMELOCK_ADDRESS post step 1"
  },
  "forge_log": "$(basename "$LOG")",
  "ssot": "docs/runbook/TT-PHASE2-GOVERNANCE-SAFE-EXECUTION-PLAN.md"
}
EOF

ok "dry-run log → $LOG"
ok "precheck → $REPORT"
echo "TT_PHASE2_SEPOLIA_DRY_RUN: OK (no broadcast)"
