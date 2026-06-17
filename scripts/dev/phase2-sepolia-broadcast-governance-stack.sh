#!/usr/bin/env bash
# Phase ② · Sepolia · DeployGovernanceStack --broadcast（Agent/Owner 统一入口）
#
# ② ONLY · chain_id 11155111 · 测试 ETH · ≠ ③ Production GO
#
# Owner 或 Agent 代跑前须显式授权：
#   export TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1
#
#   bash scripts/dev/phase2-sepolia-broadcast-governance-stack.sh
#
# 纪律：
#   - 须 pregate + dry-run exit 0 后才 broadcast
#   - 禁止 CI 默认调用（无 Owner 会话授权 env）
#   - ③ 主网 / 非 Sepolia chain_id → 脚本硬拒绝
#
# SSOT: docs/runbook/TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ENV_FILE="${PHASE2_CHAIN_DEPLOY_ENV:-$ROOT/scripts/dev/.env.phase2-chain-deploy.local}"
EVIDENCE="${PHASE2_BROADCAST_EVIDENCE:-$ROOT/evidence/GO_phase2_chain_sepolia/broadcast/latest}"
TS="$(date -u +%Y%m%dT%H%M%SZ)"
SEPolia_CHAIN_ID=11155111

fail() { echo "phase2-sepolia-broadcast-governance-stack: FAIL $*" >&2; exit 2; }
ok() { echo "phase2-sepolia-broadcast-governance-stack: OK $*"; }

is_truthy() {
  case "${1:-}" in
    1 | true | TRUE | yes | YES | on | ON) return 0 ;;
    *) return 1 ;;
  esac
}

if ! is_truthy "${TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK:-}"; then
  fail "set TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 (Owner explicit ② Sepolia authorize) — see TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST §4"
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

# 命令行/会话已 export CHAIN_RPC_URL 时优先于 env 文件（便于 RPC 故障切换）
if [[ -n "$RPC_URL_OVERRIDE" ]]; then
  export CHAIN_RPC_URL="$RPC_URL_OVERRIDE"
fi

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL unset"
[[ -n "${PRIVATE_KEY:-}" && "$PRIVATE_KEY" != *"..."* ]] || fail "PRIVATE_KEY unset"
[[ -n "${TIMELOCK_ADMIN_ADDRESS:-}" && "$TIMELOCK_ADMIN_ADDRESS" != *"..."* ]] \
  || fail "TIMELOCK_ADMIN_ADDRESS unset"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

CHAIN_ID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "${CHAIN_ID:-}")"
[[ -n "$CHAIN_ID" ]] || fail "cannot read chain-id from CHAIN_RPC_URL"
if [[ "$CHAIN_ID" != "$SEPolia_CHAIN_ID" ]]; then
  fail "refusing broadcast: chain_id=$CHAIN_ID (required Sepolia $SEPolia_CHAIN_ID) — ③/mainnet must use Owner manual process"
fi

DEPLOYER="$(cast wallet address --private-key "$PRIVATE_KEY")"
BAL_WEI="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0")"
MIN_WEI=$((200000000000000000)) # 0.20 ETH
if [[ "$BAL_WEI" =~ ^[0-9]+$ ]] && (( BAL_WEI < MIN_WEI )); then
  fail "deployer balance ${BAL_WEI} wei < 0.20 ETH — fund Sepolia deployer first"
fi

ADMIN_CODE="$(cast code "$TIMELOCK_ADMIN_ADDRESS" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "0x")"
[[ "$ADMIN_CODE" != "0x" ]] || fail "TIMELOCK_ADMIN_ADDRESS has no code on chain"
if [[ "$TIMELOCK_ADMIN_ADDRESS" == "$DEPLOYER" ]]; then
  fail "R-02: TIMELOCK_ADMIN_ADDRESS must not equal deployer on Sepolia"
fi

if [[ "$ADMIN_CODE" != "0x" ]]; then
  [[ -n "${TIMELOCK_SAFE_OWNER_KEYS:-}" && "$TIMELOCK_SAFE_OWNER_KEYS" != *"..."* ]] \
    || fail "TIMELOCK_SAFE_OWNER_KEYS unset — Phase B Safe exec required"
fi

echo "phase2-sepolia-broadcast-governance-stack: pregate..."
bash "$ROOT/scripts/gates/check-phase2-chain-broadcast-pregate.sh"

echo "phase2-sepolia-broadcast-governance-stack: dry-run..."
bash "$ROOT/scripts/dev/phase2-sepolia-deploy-dry-run.sh"

mkdir -p "$EVIDENCE"
LOG="$EVIDENCE/forge-broadcast-${TS}.log"

echo "phase2-sepolia-broadcast-governance-stack: broadcasting DeployGovernanceStack (Phase A+B)..."
(
  cd "$ROOT/contracts"
  forge script script/DeployGovernanceStack.s.sol:DeployGovernanceStack \
    --rpc-url "$CHAIN_RPC_URL" \
    --broadcast \
    --slow \
    -vv 2>&1 | tee "$LOG"
)

BROADCAST_JSON="$ROOT/contracts/broadcast/DeployGovernanceStack.s.sol/${SEPolia_CHAIN_ID}/run-latest.json"
REPORT="$EVIDENCE/broadcast-${TS}.json"

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

GOV_TOKEN="$(extract_addr GovernanceVotesToken)"
TIMELOCK="$(extract_addr GovernanceTimelock)"
GOVERNOR="$(extract_addr TravelTrustGovernor)"

cat > "$REPORT" <<EOF
{
  "schema": "phase2_sepolia_governance_broadcast.v1",
  "timestamp_utc": "$TS",
  "chain_id": $SEPolia_CHAIN_ID,
  "deployer": "$DEPLOYER",
  "broadcast": true,
  "agent_proxy_ok_env": "TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1",
  "addresses": {
    "governance_token_address": "${GOV_TOKEN:-null}",
    "timelock_address": "${TIMELOCK:-null}",
    "governor_address": "${GOVERNOR:-null}"
  },
  "forge_log": "$(basename "$LOG")",
  "broadcast_json": "${BROADCAST_JSON#$ROOT/}",
  "next_owner_actions": [
    "Update scripts/dev/.env.phase2-chain-deploy.local TIMELOCK_ADDRESS GOVERNANCE_TOKEN_ADDRESS GOVERNOR_ADDRESS",
    "Update registry/protocol-convergence-deployments.v1.yaml environments.sepolia.addresses.*",
    "cast call admin/governor/allowedExecutionTarget verification"
  ],
  "ssot": "docs/runbook/TT-PHASE2-GOVERNANCE-STACK-SEPOLIA-BROADCAST-CHECKLIST.md §5"
}
EOF

ok "broadcast log → $LOG"
ok "report → $REPORT"
if [[ -n "$GOV_TOKEN" && -n "$TIMELOCK" && -n "$GOVERNOR" ]]; then
  echo "TT_PHASE2_SEPOLIA_BROADCAST_ADDRESSES: token=$GOV_TOKEN timelock=$TIMELOCK governor=$GOVERNOR"
fi
echo "TT_PHASE2_SEPOLIA_GOVERNANCE_BROADCAST: OK"
