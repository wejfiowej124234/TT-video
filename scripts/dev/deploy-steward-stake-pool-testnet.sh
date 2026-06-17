#!/usr/bin/env bash
# ② 测试网 · DeployRegionStewardStakePool（Sepolia / staging · 非 ③ GO）
#
# 前置：根 `.env` 或环境变量
#   CHAIN_RPC_URL · CHAIN_ID · GOVERNANCE_TOKEN_ADDRESS（或 STEWARD_TTG_ADDRESS）
#   PRIVATE_KEY — 部署者（须有余额；勿提交）
#
# 用法：bash scripts/dev/deploy-steward-stake-pool-testnet.sh
# 可选：DRY_RUN=1（仅校验 env，不 broadcast）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ -f "$ROOT/scripts/dev/.env.steward-deploy.local" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/scripts/dev/.env.steward-deploy.local"
  set +a
fi

EVIDENCE_DIR="${STEWARD_TESTNET_EVIDENCE:-$ROOT/evidence/GO_phase2_steward_stake_sepolia}"
LOG="$EVIDENCE_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

fail() { echo "deploy-steward-stake-pool-testnet: FAIL $*" >&2; exit 1; }
ok() { echo "deploy-steward-stake-pool-testnet: OK $*"; }

load_dotenv_var() {
  local key="$1"
  [[ -n "${!key:-}" ]] && return 0
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

for k in CHAIN_RPC_URL CHAIN_ID GOVERNANCE_TOKEN_ADDRESS PRIVATE_KEY TIMELOCK_ADDRESS; do
  load_dotenv_var "$k"
done

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL not set"
[[ -n "${CHAIN_ID:-}" ]] || fail "CHAIN_ID not set"
[[ -n "${TIMELOCK_ADDRESS:-}" ]] || fail "TIMELOCK_ADDRESS not set (R-02 · pool owner must be Timelock · not deployer EOA)"

PK="${PRIVATE_KEY:-}"
[[ -n "$PK" ]] || fail "PRIVATE_KEY not set"
[[ "$PK" != *replace* ]] || fail "PRIVATE_KEY is placeholder — set a funded testnet deployer key locally (do not commit)"

export STEWARD_TTG_ADDRESS="${STEWARD_TTG_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-}}"
[[ -n "$STEWARD_TTG_ADDRESS" ]] || fail "STEWARD_TTG_ADDRESS or GOVERNANCE_TOKEN_ADDRESS required for testnet (no MockERC20)"

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

DEPLOYER="$(cast wallet address --private-key "$PK" 2>/dev/null || true)"
[[ -n "$DEPLOYER" ]] || fail "invalid PRIVATE_KEY"
BAL="$(cast balance "$DEPLOYER" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null | awk '{print $1}')"
[[ -n "$BAL" && "$BAL" != "0" ]] || fail "deployer $DEPLOYER has 0 wei on chain $CHAIN_ID — fund before broadcast"

ok "preflight deployer=$DEPLOYER balance=$BAL chain_id=$CHAIN_ID ttg=$STEWARD_TTG_ADDRESS timelock=$TIMELOCK_ADDRESS"

# R-02 · owner 不得为 deployer（forge 脚本内 resolveChainOwner 双保险）
if [[ "$TIMELOCK_ADDRESS" == "$DEPLOYER" ]]; then
  fail "TIMELOCK_ADDRESS must not equal deployer EOA (R-02)"
fi

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  ok "DRY_RUN=1 — skip forge broadcast"
  exit 0
fi

mkdir -p "$EVIDENCE_DIR"

cd "$ROOT/contracts"
set +e
DEPLOY_OUT="$(forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
  --rpc-url "$CHAIN_RPC_URL" --broadcast -vv 2>&1)"
RC=$?
set -e
echo "$DEPLOY_OUT" | tee "$LOG"
[[ "$RC" -eq 0 ]] || fail "forge deploy failed (see $LOG)"

POOL="$(echo "$DEPLOY_OUT" | grep -m1 'REGION_STEWARD_STAKE_POOL' | awk '{print $NF}')"
[[ -n "$POOL" && "$POOL" == 0x* ]] || fail "could not parse REGION_STEWARD_STAKE_POOL from deploy output"

VER="$(cast call "$POOL" "version()(string)" --rpc-url "$CHAIN_RPC_URL" 2>/dev/null || echo "?")"
MIN_CN="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" 0x434e --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"

{
  echo "chain_id=$CHAIN_ID"
  echo "deployer=$DEPLOYER"
  echo "region_steward_stake_pool=$POOL"
  echo "steward_ttg=$STEWARD_TTG_ADDRESS"
  echo "pool_version=$VER"
  echo "min_stake_cn=$MIN_CN"
  echo "deploy_log=$LOG"
  echo ""
  echo "# Add to repo root .env (do not commit PRIVATE_KEY):"
  echo "REGION_STEWARD_STAKE_POOL_ADDRESS=$POOL"
} | tee "$EVIDENCE_DIR/addresses.latest.txt"

ok "deployed pool=$POOL version=$VER minStakeCN=$MIN_CN"
echo ""
echo "TT_DEPLOY_STEWARD_STAKE_TESTNET: OK (② testnet deploy — not staging report.json GO)"
echo "  evidence: $EVIDENCE_DIR/addresses.latest.txt"
echo "  next: bash scripts/dev/smoke-steward-stake-testnet-readonly.sh"
