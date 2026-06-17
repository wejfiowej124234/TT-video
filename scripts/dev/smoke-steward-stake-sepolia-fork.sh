#!/usr/bin/env bash
# ② Sepolia fork · RegionStewardStakePool 部署 + 只读验收（Anvil fork · 非真 Sepolia broadcast）
#
# 覆盖：fork Sepolia → 用真实 GOVERNANCE_TOKEN_ADDRESS 部署 pool → cast + Rust eth_call
# 不替代：真 Sepolia broadcast（须 funded PRIVATE_KEY + deploy-steward-stake-pool-testnet.sh）
#
# 用法：bash scripts/dev/smoke-steward-stake-sepolia-fork.sh
# 可选：SEPOLIA_RPC · FORK_PORT=8546 · SKIP_FORK_STOP=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

SEPOLIA_RPC="${SEPOLIA_RPC:-https://ethereum-sepolia-rpc.publicnode.com}"
FORK_PORT="${FORK_PORT:-8546}"
RPC="http://127.0.0.1:${FORK_PORT}"
FORK_PID=""
FORK_STARTED=0
J_CN="0x434e"

fail() { echo "smoke-steward-stake-sepolia-fork: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-steward-stake-sepolia-fork: OK $*"; }

load_dotenv_var() {
  local key="$1"
  [[ -n "${!key:-}" ]] && return 0
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

for k in GOVERNANCE_TOKEN_ADDRESS CHAIN_ID; do
  load_dotenv_var "$k"
done

TTG="${STEWARD_TTG_ADDRESS:-${GOVERNANCE_TOKEN_ADDRESS:-}}"
[[ -n "$TTG" && "$TTG" == 0x* ]] || fail "GOVERNANCE_TOKEN_ADDRESS not set in .env"

command -v anvil >/dev/null 2>&1 || fail "anvil not found"
command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

cleanup() {
  if [[ "$FORK_STARTED" == "1" && "${SKIP_FORK_STOP:-0}" != "1" && -n "$FORK_PID" ]]; then
    kill "$FORK_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

if curl -sS -o /dev/null -w "%{http_code}" "$RPC" 2>/dev/null | grep -qE '^200|405$'; then
  ok "fork anvil already on $RPC"
else
  anvil --fork-url "$SEPOLIA_RPC" --port "$FORK_PORT" --silent >/dev/null 2>&1 &
  FORK_PID=$!
  FORK_STARTED=1
  for _ in $(seq 1 40); do
    cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 && break
    sleep 0.5
  done
  cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || fail "fork anvil did not start"
  ok "fork anvil started (upstream $SEPOLIA_RPC)"
fi

FORK_CID="$(cast chain-id --rpc-url "$RPC")"
ok "fork chain_id=$FORK_CID ttg=$TTG"

cd "$ROOT/contracts"
export STEWARD_TTG_ADDRESS="$TTG"
DEPLOY_OUT="$(forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
  --rpc-url "$RPC" --broadcast -vv 2>&1)" || fail "forge deploy on Sepolia fork failed"

POOL="$(echo "$DEPLOY_OUT" | grep -m1 'REGION_STEWARD_STAKE_POOL' | awk '{print $NF}')"
[[ -n "$POOL" && "$POOL" == 0x* ]] || fail "parse REGION_STEWARD_STAKE_POOL failed"

CODE="$(cast code "$TTG" --rpc-url "$RPC" | tr -d ' \n')"
[[ -n "$CODE" && "$CODE" != "0x" ]] || fail "TTG has no code on fork"

VER="$(cast call "$POOL" "version()(string)" --rpc-url "$RPC")"
MIN_CN="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" "$J_CN" --rpc-url "$RPC" | awk '{print $1}')"
[[ -n "$MIN_CN" && "$MIN_CN" =~ ^[0-9]+$ ]] || fail "minStakeAmount(CN) failed"
ok "deployed pool=$POOL version=$VER minStakeCN=$MIN_CN"

export CHAIN_RPC_URL="$RPC"
export CHAIN_ID="$FORK_CID"
export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"
cd "$ROOT"
cargo test -p traveltrust-api steward_stake_pool_rpc_min_stake -- --ignored --nocapture \
  || fail "steward_stake_pool_rpc_min_stake on fork failed"
ok "cargo test steward_stake_pool_rpc_min_stake (Sepolia fork RPC)"

EVIDENCE="$ROOT/evidence/GO_phase2_steward_stake_sepolia/fork-smoke.latest.txt"
mkdir -p "$(dirname "$EVIDENCE")"
{
  echo "mode=sepolia_fork_anvil"
  echo "fork_upstream=$SEPOLIA_RPC"
  echo "chain_id=$FORK_CID"
  echo "governance_token=$TTG"
  echo "region_steward_stake_pool=$POOL"
  echo "pool_version=$VER"
  echo "min_stake_cn=$MIN_CN"
  echo "note=Not a Sepolia mainnet broadcast; run deploy-steward-stake-pool-testnet.sh for ② testnet GO"
} > "$EVIDENCE"
ok "evidence $EVIDENCE"

echo ""
echo "TT_SMOKE_STEWARD_STAKE_SEPOLIA_FORK: OK (② fork slice — not Sepolia broadcast GO)"
