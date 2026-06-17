#!/usr/bin/env bash
# Phase ② · Sepolia · TTG-TOKENOMICS-FREEZE-V1 部署 + 链上对拍 + 证据包
#
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#   bash scripts/dev/phase2-sepolia-broadcast-gov-freeze-v1.sh
#
# SSOT: docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md
# 诚实边界: ② Sepolia test ETH · ≠ ③ Production GO
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVID_ROOT="$ROOT/evidence/GO_phase2_gov_freeze_v1_sepolia"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$EVID_ROOT/${TS}"
SEPOLIA_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-gov-freeze-v1: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-gov-freeze-v1: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner ② Sepolia authorize)"
fi

[[ -f "$ENV_FILE" ]] || fail "missing $ENV_FILE"

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

export USDC_TOKEN_ADDRESS="${USDC_TOKEN_ADDRESS:-${FUND_STACK_TOKEN_ADDRESS:-}}"
[[ -n "${USDC_TOKEN_ADDRESS:-}" ]] || fail "USDC_TOKEN_ADDRESS or FUND_STACK_TOKEN_ADDRESS required"
[[ -n "${GOVERNANCE_TOKEN_ADDRESS:-}" ]] || fail "GOVERNANCE_TOKEN_ADDRESS required"
[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL required"
[[ -n "${PRIVATE_KEY:-}" ]] || fail "PRIVATE_KEY required"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" ]] || fail "TIMELOCK_ADMIN_ADDRESS required"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "")"
[[ "$CHAIN_ID" == "$SEPOLIA_CHAIN_ID" ]] || fail "chain_id=$CHAIN_ID (need Sepolia $SEPOLIA_CHAIN_ID)"

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo 0)"
MIN_WEI=$((200000000000000000))
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.20 ETH"
fi

mkdir -p "$EVID"
LOG="$EVID/forge-broadcast-${TS}.log"

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
if [[ "$TIMELOCK_ADMIN_ADDRESS" == "$DEPLOYER" ]]; then
  fail "R-02: TIMELOCK_ADMIN_ADDRESS must not equal deployer on Sepolia"
fi
[[ "$ADMIN_CODE" != "0x" ]] || fail "TIMELOCK_ADMIN_ADDRESS has no code on chain"
if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "TIMELOCK_SAFE_OWNER_KEYS unset — Phase B Safe exec required"
fi

echo "phase2-sepolia-broadcast-gov-freeze-v1: G24-P-05～09 pregate..."
bash "$ROOT/scripts/gates/check-g24-p-prerequisites-05-09-gov-freeze-sepolia.sh"

echo "phase2-sepolia-broadcast-gov-freeze-v1: G24-P-UPGRADE-01 pregate..."
bash "$ROOT/scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh"

echo "phase2-sepolia-broadcast-gov-freeze-v1: pregate..."

echo "phase2-sepolia-broadcast-gov-freeze-v1: dry-run simulate..."
(
  cd "$ROOT/contracts"
  forge script script/DeployGovFreezeV1Stack.s.sol:DeployGovFreezeV1Stack \
    --rpc-url "$CHAIN_RPC_URL" -vv 2>&1 | tee "$EVID/dry-run-${TS}.log"
)

echo "phase2-sepolia-broadcast-gov-freeze-v1: broadcasting..."
(
  cd "$ROOT/contracts"
  forge script script/DeployGovFreezeV1Stack.s.sol:DeployGovFreezeV1Stack \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployGovFreezeV1Stack.s.sol/${SEPOLIA_CHAIN_ID}/run-latest.json"

extract_addr() {
  local key="$1"
  if [[ -f "$BROADCAST_JSON" ]] && command -v python3 >/dev/null 2>&1; then
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
}

GOV_FREEZE_V1_GOVERNOR="$(extract_addr TimelockUpgradeableProxy | head -1 || true)"
GOV_FROM_LOG=""
TREASURY_FROM_LOG=""
MARKET_FROM_LOG=""
SEAT_FROM_LOG=""
STAKE_FROM_LOG=""
TIMELOCK_FROM_LOG=""
if [[ -f "$LOG" ]]; then
  GOV_FROM_LOG="$(grep -o 'GOV_FREEZE_V1_GOVERNOR_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
  TREASURY_FROM_LOG="$(grep -o 'TREASURY_P4_CAP_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
  MARKET_FROM_LOG="$(grep -o 'PRIMARY_MARKET_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
  SEAT_FROM_LOG="$(grep -o 'SEAT_REGISTRY_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
  STAKE_FROM_LOG="$(grep -o 'REGION_STEWARD_STAKE_POOL_PROXY 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
  TIMELOCK_FROM_LOG="$(grep -o 'GOV_FREEZE_V1_TIMELOCK 0x[a-fA-F0-9]\{40\}' "$LOG" | awk '{print $2}' | tail -1 || true)"
fi

GOV_FREEZE_V1_TIMELOCK="${TIMELOCK_FROM_LOG:-$(extract_addr GovernanceTimelock)}"
GOV_FREEZE_V1_GOVERNOR="${GOV_FROM_LOG:-$GOV_FREEZE_V1_GOVERNOR}"
TREASURY_P4_CAP_ADDRESS="${TREASURY_FROM_LOG:-}"
PRIMARY_MARKET_ADDRESS="${MARKET_FROM_LOG:-}"
SEAT_REGISTRY_ADDRESS="${SEAT_FROM_LOG:-}"
REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS="${STAKE_FROM_LOG:-}"

[[ -n "$GOV_FREEZE_V1_GOVERNOR" ]] || fail "could not parse GOV_FREEZE_V1_GOVERNOR from broadcast json"
[[ -n "$GOV_FREEZE_V1_TIMELOCK" ]] || fail "could not parse GOV_FREEZE_V1_TIMELOCK from broadcast json"

# Fund primary market with TTG inventory (2M)
TTG_FUND="${GOV_FREEZE_V1_PRIMARY_MARKET_TTG_FUND:-2000000000000000000000000}"
if [[ -n "$PRIMARY_MARKET_ADDRESS" ]]; then
  cast send "$GOVERNANCE_TOKEN_ADDRESS" \
    "transfer(address,uint256)" "$PRIMARY_MARKET_ADDRESS" "$TTG_FUND" \
    --rpc-url "$CHAIN_RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    >>"$EVID/post-deploy-${TS}.log" 2>&1 || true
fi

export GOVERNOR_ADDRESS="$GOV_FREEZE_V1_GOVERNOR"
export TIMELOCK_ADDRESS="$GOV_FREEZE_V1_TIMELOCK"
export TREASURY_P4_CAP_ADDRESS
export PRIMARY_MARKET_ADDRESS
export SEAT_REGISTRY_ADDRESS
export REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS
export GOV_FREEZE_V1_EVID_DIR="$EVID"

bash "$ROOT/scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh" || {
  bash "$ROOT/scripts/dev/finalize-gov-freeze-v1-sepolia-evidence.sh" "$TS" "$LOG"
  exit $?
}

# Append env block for Owner (no secrets)
ENV_APPEND="$EVID/phase2-env-append-${TS}.env"
cat >"$ENV_APPEND" <<EOF
# TTG-TOKENOMICS-FREEZE-V1 · Sepolia ${TS} · append to scripts/dev/.env.phase2-chain-deploy.local
GOV_FREEZE_V1_TIMELOCK_ADDRESS=${GOV_FREEZE_V1_TIMELOCK}
GOV_FREEZE_V1_GOVERNOR_ADDRESS=${GOV_FREEZE_V1_GOVERNOR}
TREASURY_P4_CAP_ADDRESS=${TREASURY_P4_CAP_ADDRESS}
PRIMARY_MARKET_ADDRESS=${PRIMARY_MARKET_ADDRESS}
SEAT_REGISTRY_ADDRESS=${SEAT_REGISTRY_ADDRESS}
REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS=${REGION_STEWARD_STAKE_POOL_PROXY_ADDRESS}
EOF

cat >"$EVID/PHASE2-GOV-FREEZE-V1-SEPOLIA-BASELINE.md" <<EOF
# Phase ② · TTG-TOKENOMICS-FREEZE-V1 · Sepolia 正式审计基线

**Stamp:** ${TS}  
**Chain:** Sepolia (${SEPOLIA_CHAIN_ID})  
**SSOT:** docs/spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md  
**Verify:** GOV_FREEZE_V1_SEPOLIA_ONCHAIN_VERIFY: PASS

| 组件 | 地址 |
|------|------|
| Governor (GOV-02/03) | ${GOV_FREEZE_V1_GOVERNOR} |
| Timelock (GOV-02) | ${GOV_FREEZE_V1_TIMELOCK} |
| Treasury P4 Cap (GOV-01) | ${TREASURY_P4_CAP_ADDRESS} |
| Seat Registry (GOV-03) | ${SEAT_REGISTRY_ADDRESS} |
| Primary Market (GOV-04) | ${PRIMARY_MARKET_ADDRESS} |

**Reuse:** GOVERNANCE_TOKEN_ADDRESS=${GOVERNANCE_TOKEN_ADDRESS} · FundStack Timelock 未替换

**诚实边界:** ② Sepolia 测试网审计基线 · ≠ ③ Production GO · Legal ☐
EOF

ln -sfn "$TS" "$EVID_ROOT/latest"

ok "evidence → $EVID"
echo "TT_PHASE2_GOV_FREEZE_V1_SEPOLIA_BASELINE: OK stamp=${TS}"
echo "TT_GOV_FREEZE_V1_SEPOLIA_ADDRESSES: governor=${GOV_FREEZE_V1_GOVERNOR} timelock=${GOV_FREEZE_V1_TIMELOCK} treasury_p4=${TREASURY_P4_CAP_ADDRESS} primary_market=${PRIMARY_MARKET_ADDRESS} seat_registry=${SEAT_REGISTRY_ADDRESS}"
