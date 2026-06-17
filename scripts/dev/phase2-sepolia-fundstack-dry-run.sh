#!/usr/bin/env bash
# Phase ② · Sepolia FundStack dry-run（DeployFundStackUnderTimelock · 无 --broadcast）
#
#   bash scripts/dev/phase2-sepolia-fundstack-dry-run.sh
#   # → evidence/GO_phase2_chain_sepolia/fundstack-dry-run/latest/precheck.json
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_FUNDSTACK_DRY_RUN_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/fundstack-dry-run/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"

fail() { echo "phase2-sepolia-fundstack-dry-run: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-fundstack-dry-run: OK $*"; }

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
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]] || fail "TIMELOCK_ADMIN_ADDRESS unset"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "TIMELOCK_SAFE_OWNER_KEYS unset — required for Safe Phase B"
fi

TL_ADMIN="$(cast call "$TIMELOCK_ADDRESS" "admin()(address)" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x0")"
[[ "$TL_ADMIN" == "$TIMELOCK_ADMIN_ADDRESS" ]] || fail "TIMELOCK admin mismatch: on-chain=$TL_ADMIN env=$TIMELOCK_ADMIN_ADDRESS"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
NONCE="$(cast nonce "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "unknown")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-11155111}")"
[[ "$CHAIN_ID" == "11155111" ]] || fail "chain_id=$CHAIN_ID (required Sepolia 11155111)"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-fundstack-dry-run-${TS}.log"
REPORT="$EVIDENCE/precheck.json"

(
  cd "$ROOT/contracts"
  forge script script/DeployFundStackUnderTimelock.s.sol:DeployFundStackUnderTimelock \
    --rpc-url "$CHAIN_RPC_URL" \
    --slow \
    -vv 2>&1 | tee "$LOG"
) || fail "DeployFundStackUnderTimelock dry-run failed"

grep -q "FUNDSTACK_BINDING_CHECK: OK" "$LOG" || fail "missing FUNDSTACK_BINDING_CHECK: OK in forge log"
grep -q "safeAdminPath true" "$LOG" || fail "expected safeAdminPath true (Sepolia Safe admin)"
grep -q "Phase B safeOwner" "$LOG" || fail "missing Phase B Safe owner simulation"

bash "$ROOT/scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh" --from-log "$LOG" --timelock "$TIMELOCK_ADDRESS" \
  || fail "fundstack binding verification failed"

GAS_EST="$(grep -E 'Estimated total gas|Estimated amount required' "$LOG" | tail -6 | tr '\n' ' ' || echo "see log")"

FEE_ROUTER="$(grep -E '^  FeeRouter ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"
REGION_VAULT="$(grep -E '^  RegionVault ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"
TREASURY="$(grep -E '^  GovernanceTreasury ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"
RESERVE="$(grep -E '^  ReserveVault_fee_track ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"
FACTORY="$(grep -E '^  EscrowFactory ' "$LOG" | head -1 | awk '{print $2}' || echo null)"
GUIDE_POOL="$(grep -E '^  GuideIdentityStakingPool ' "$LOG" | tail -1 | awk '{print $2}' || echo null)"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_fundstack_dry_run_precheck.v1",
  "timestamp_utc": "$TS",
  "chain_id": $CHAIN_ID,
  "deployer": "$DEPLOYER",
  "deployer_nonce": "$NONCE",
  "deployer_balance_wei": "$BAL_WEI",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "timelock_admin_address": "$TIMELOCK_ADMIN_ADDRESS",
  "safe_admin_path": true,
  "broadcast": false,
  "simulated_addresses": {
    "fee_router_address": "$FEE_ROUTER",
    "region_vault_address": "$REGION_VAULT",
    "treasury_address": "$TREASURY",
    "reserve_vault_address": "$RESERVE",
    "escrow_factory_address": "$FACTORY",
    "guide_staking_pool_address": "$GUIDE_POOL"
  },
  "binding_check": "FUNDSTACK_BINDING_CHECK: OK",
  "gas_estimate_note": "$GAS_EST",
  "forge_log": "$(basename "$LOG")",
  "ssot": "docs/runbook/TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST.md"
}
EOF

ok "dry-run log → $LOG"
ok "precheck → $REPORT"
echo "TT_PHASE2_SEPOLIA_FUNDSTACK_DRY_RUN: OK (no broadcast)"
