#!/usr/bin/env bash
# Phase ② · Sepolia · DeployFundStackUnderTimelock --broadcast（Agent/Owner 统一入口）
#
# ② ONLY · chain_id 11155111 · 测试 ETH · ≠ ③ Production GO
#
# Owner 或 Agent 代跑前须显式授权：
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#
#   bash scripts/dev/phase2-sepolia-broadcast-fundstack.sh
#
# 纪律：
#   - 须 pregate + FundStack dry-run exit 0 后才 broadcast
#   - Phase A deployer + Phase B Safe owner（R-02）
#   - 禁止 CI 默认调用（无 Owner 会话授权 env）
#
# SSOT: docs/runbook/TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_FUNDSTACK_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/fundstack-broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-fundstack: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-fundstack: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner explicit ② Sepolia authorize) — see TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST §4"
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
  || fail "TIMELOCK_ADDRESS unset — complete governance stack (序 1) first"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]] \
  || fail "TIMELOCK_ADMIN_ADDRESS unset"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-}")"
[[ -n "$CHAIN_ID" ]] || fail "cannot read chain-id from CHAIN_RPC_URL"
if [[ "$CHAIN_ID" != "$SEPOLIA_CHAIN_ID" ]]; then
  fail "refusing broadcast: chain_id=$CHAIN_ID (required Sepolia $SEPOLIA_CHAIN_ID)"
fi

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
MIN_WEI=$((700000000000000000)) # 0.70 ETH (dry-run ~0.653 + buffer)
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.70 ETH — fund Sepolia deployer first"
fi

TL_CODE="$(cast code "$TIMELOCK_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
[[ "$TL_CODE" != "0x" ]] || fail "TIMELOCK_ADDRESS has no code on chain"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
[[ "$ADMIN_CODE" != "0x" ]] || fail "TIMELOCK_ADMIN_ADDRESS has no code on chain"
if [[ "$TIMELOCK_ADMIN_ADDRESS" == "$DEPLOYER" ]]; then
  fail "R-02: TIMELOCK_ADMIN_ADDRESS must not equal deployer on Sepolia"
fi

TL_ADMIN="$(cast call "$TIMELOCK_ADDRESS" "admin()(address)" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x0")"
[[ "$TL_ADMIN" == "$TIMELOCK_ADMIN_ADDRESS" ]] || fail "TIMELOCK admin mismatch: on-chain=$TL_ADMIN env=$TIMELOCK_ADMIN_ADDRESS"

if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "TIMELOCK_SAFE_OWNER_KEYS unset — Phase B Safe exec required"
fi

echo "phase2-sepolia-broadcast-fundstack: pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh"

echo "phase2-sepolia-broadcast-fundstack: dry-run..."
bash "$ROOT/scripts/dev/phase2-sepolia-fundstack-dry-run.sh"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-fundstack: broadcasting DeployFundStackUnderTimelock (Phase A+B)..."
(
  cd "$ROOT/contracts"
  forge script script/DeployFundStackUnderTimelock.s.sol:DeployFundStackUnderTimelock \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

grep -q "FUNDSTACK_BINDING_CHECK: OK" "$LOG" || fail "broadcast log missing FUNDSTACK_BINDING_CHECK: OK"

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployFundStackUnderTimelock.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"
REPORT="$EVIDENCE/broadcast-${TS}.json"

extract_addr() {
  local key="$1"
  if [[ -f "$BROADCAST_JSON" ]]; then
    if command -v node >/dev/null 2>&1; then
      node - "$BROADCAST_JSON" "$key" <<'NODE' 2>/dev/null || true
const fs = require("fs");
const [path, key] = process.argv.slice(2);
const data = JSON.parse(fs.readFileSync(path, "utf8"));
const txs = data.transactions || [];
for (let i = txs.length - 1; i >= 0; i--) {
  const tx = txs[i];
  if (tx.contractName === key && tx.contractAddress) {
    console.log(tx.contractAddress);
    break;
  }
}
NODE
    elif command -v python3 >/dev/null 2>&1; then
      python3 - "$BROADCAST_JSON" "$key" <<'PY' 2>/dev/null || true
import json, sys
path, key = sys.argv[1], sys.argv[2]
with open(path, encoding="utf-8") as f:
    data = json.load(f)
txs = data.get("transactions") or []
for tx in reversed(txs):
    if tx.get("contractName") == key and tx.get("contractAddress"):
        print(tx["contractAddress"])
        break
PY
    fi
  fi
}

FEE_ROUTER="$(extract_addr FeeRouter)"
REGION_VAULT="$(extract_addr RegionVault)"
TREASURY="$(extract_addr GovernanceTreasury)"
RESERVE="$(extract_addr ReserveVault)"
FACTORY="$(extract_addr EscrowFactory)"
GUIDE_POOL="$(extract_addr GuideIdentityStakingPool)"
PROVIDER_POOL="$(extract_addr ProviderIdentityStakingPool)"

[[ -n "$FEE_ROUTER" && -n "$REGION_VAULT" && -n "$TREASURY" && -n "$RESERVE" ]] \
  || fail "could not extract core addresses from $BROADCAST_JSON — fill env manually then run verify-bindings"

export FEE_ROUTER_ADDRESS="$FEE_ROUTER"
export REGION_VAULT_ADDRESS="$REGION_VAULT"
export TREASURY_ADDRESS="$TREASURY"
export RESERVE_VAULT_ADDRESS="$RESERVE"
export ESCROW_FACTORY_ADDRESS="${FACTORY:-}"
export GUIDE_STAKING_POOL_ADDRESS="${GUIDE_POOL:-}"
export PROVIDER_STAKING_POOL_ADDRESS="${PROVIDER_POOL:-}"

echo "phase2-sepolia-broadcast-fundstack: on-chain binding verification..."
bash "$ROOT/scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh" \
  || fail "post-broadcast on-chain verification failed"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_fundstack_broadcast.v1",
  "timestamp_utc": "$TS",
  "chain_id": $SEPOLIA_CHAIN_ID,
  "deployer": "$DEPLOYER",
  "timelock_address": "$TIMELOCK_ADDRESS",
  "broadcast": true,
  "agent_proxy_ok_env": "TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1",
  "addresses": {
    "fee_router_address": "${FEE_ROUTER:-null}",
    "region_vault_address": "${REGION_VAULT:-null}",
    "treasury_address": "${TREASURY:-null}",
    "reserve_vault_address": "${RESERVE:-null}",
    "escrow_factory_address": "${FACTORY:-null}",
    "guide_staking_pool_address": "${GUIDE_POOL:-null}",
    "provider_staking_pool_address": "${PROVIDER_POOL:-null}"
  },
  "forge_log": "$(basename "$LOG")",
  "broadcast_json": "${BROADCAST_JSON#$ROOT/}",
  "next_owner_actions": [
    "Update scripts/dev/.env.phase2-chain-deploy.local FEE_ROUTER_ADDRESS REGION_VAULT_ADDRESS TREASURY_ADDRESS RESERVE_VAULT_ADDRESS ESCROW_FACTORY_ADDRESS",
    "Update registry/protocol-convergence-deployments.v1.yaml environments.sepolia.addresses.*",
    "bash scripts/dev/phase2-sepolia-fundstack-verify-bindings.sh"
  ],
  "ssot": "docs/runbook/TT-PHASE2-FUND-STACK-SEPOLIA-BROADCAST-CHECKLIST.md §5"
}
EOF

ok "broadcast log → $LOG"
ok "report → $REPORT"
if [[ -n "$FEE_ROUTER" && -n "$REGION_VAULT" ]]; then
  echo "TT_PHASE2_SEPOLIA_BROADCAST_ADDRESSES: feeRouter=$FEE_ROUTER regionVault=$REGION_VAULT treasury=$TREASURY reserve=$RESERVE"
fi
echo "TT_PHASE2_SEPOLIA_FUNDSTACK_BROADCAST: OK"
