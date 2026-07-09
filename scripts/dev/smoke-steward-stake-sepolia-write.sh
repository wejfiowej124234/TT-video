#!/usr/bin/env bash
# ② Sepolia fork · RegionStewardStakePool 写路径烟测（等价主链合约逻辑 · fork 部署）
#
# Live registry pool（REGION_STEWARD_STAKE_POOL_ADDRESS）在 Step 0 只读验收；
# 写路径在 Sepolia state fork 上 deploy MockERC20 + pool（已播 TTG 无 approve · 不可 live stake）。
#
# 覆盖：approve → stake → read position → requestRelease → releasableAmount(0)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh
source "$ROOT/scripts/dev/lib/phase2-web3-p2-003-b407-lib.sh"

SEPOLIA_RPC="${P2B407_RPC_URL:-${CHAIN_RPC_URL:-https://ethereum-sepolia-rpc.publicnode.com}}"
SEPOLIA_RPC_FALLBACKS=(
  "$SEPOLIA_RPC"
  "https://1rpc.io/sepolia"
  "https://sepolia.drpc.org"
  "https://rpc.sepolia.org"
)
LIVE_POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-}"
FORK_PORT="${STEWARD_FORK_PORT:-$((8555 + $(date +%s) % 400))}"
RPC="http://127.0.0.1:${FORK_PORT}"
FORK_PID=""
FORK_STARTED=0
FORK_UPSTREAM=""
J_CN="0x434e"
DEPLOYER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
fail() { echo "smoke-steward-stake-sepolia-write: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-steward-stake-sepolia-write: OK $*"; }

cleanup() {
  if [[ "$FORK_STARTED" == "1" && "${SKIP_FORK_STOP:-0}" != "1" && -n "$FORK_PID" ]]; then
    kill "$FORK_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

p2b407_load_env

PK_STAKER="$(p2b407_normalize_hex_pk "${STEWARD_STAKER_PK:-${B407_TRAVELER_PK:-${PRIVATE_KEY:-}}}")"
[[ -n "$PK_STAKER" ]] || fail "STEWARD_STAKER_PK or B407_TRAVELER_PK or PRIVATE_KEY required"
STAKER="$(cast wallet address --private-key "$PK_STAKER")"

command -v anvil >/dev/null 2>&1 || fail "anvil not found"
command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

if curl -sS -o /dev/null -w "%{http_code}" "$RPC" 2>/dev/null | grep -qE '^200|405$'; then
  ok "anvil already on $RPC"
  FORK_UPSTREAM="${FORK_UPSTREAM:-existing-local}"
elif [[ "${STEWARD_WRITE_USE_LOCAL_ANVIL:-0}" == "1" ]]; then
  ok "STEWARD_WRITE_USE_LOCAL_ANVIL=1 — local anvil chain-id=11155111"
  anvil --chain-id 11155111 --port "$FORK_PORT" --silent >/dev/null 2>&1 &
  FORK_PID=$!
  FORK_STARTED=1
  for _ in $(seq 1 45); do
    cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 && break
    sleep 1
  done
  cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || fail "local anvil did not start"
  FORK_UPSTREAM="local-chain-id-11155111"
  ok "local anvil started chain-id=11155111"
else
  for upstream in "${SEPOLIA_RPC_FALLBACKS[@]}"; do
    [[ -z "$upstream" ]] && continue
    anvil --fork-url "$upstream" --port "$FORK_PORT" --silent >/dev/null 2>&1 &
    FORK_PID=$!
    FORK_STARTED=1
    for _ in $(seq 1 45); do
      if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
        FORK_UPSTREAM="$upstream"
        break 2
      fi
      sleep 1
    done
    kill "$FORK_PID" 2>/dev/null || true
    FORK_PID=""
    FORK_STARTED=0
  done
  if [[ -z "$FORK_UPSTREAM" ]]; then
    ok "Sepolia fork RPC unavailable — starting local anvil chain-id=11155111 (write-path equivalent only)"
    anvil --chain-id 11155111 --port "$FORK_PORT" --silent >/dev/null 2>&1 &
    FORK_PID=$!
    FORK_STARTED=1
    for _ in $(seq 1 45); do
      cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 && break
      sleep 1
    done
    cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || fail "local anvil did not start"
    FORK_UPSTREAM="local-chain-id-11155111"
  fi
  ok "fork anvil started upstream=${FORK_UPSTREAM}"
fi
[[ "$(cast chain-id --rpc-url "$RPC")" == "11155111" ]] || fail "expected fork chain_id 11155111"

if [[ -n "$LIVE_POOL" && "$LIVE_POOL" == 0x* && "$FORK_UPSTREAM" != "local-chain-id-11155111" ]]; then
  LIVE_CODE="$(cast code "$LIVE_POOL" --rpc-url "$RPC" | tr -d ' \n')"
  [[ -n "$LIVE_CODE" && "$LIVE_CODE" != "0x" ]] || fail "registry pool $LIVE_POOL has no code on fork"
  ok "registry pool present on fork $LIVE_POOL"
fi
# Fork 写路径：MockERC20 + 新 pool（与 smoke-steward-stake-anvil 同构 · chain_id=11155111）
CONTRACTS_ROOT="$ROOT/contracts"
MOCK_OUT="$(cd "$CONTRACTS_ROOT" && forge create src/MockERC20.sol:MockERC20 --rpc-url "$RPC" --private-key "$DEPLOYER_PK" --broadcast 2>&1)" || {
  if [[ "$FORK_UPSTREAM" != "local-chain-id-11155111" && "$FORK_STARTED" == "1" ]]; then
    ok "fork deploy failed — retry on local anvil chain-id=11155111"
    kill "$FORK_PID" 2>/dev/null || true
    FORK_PID=""
    anvil --chain-id 11155111 --port "$FORK_PORT" --silent >/dev/null 2>&1 &
    FORK_PID=$!
    FORK_STARTED=1
    for _ in $(seq 1 45); do
      cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 && break
      sleep 1
    done
    cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || fail "local anvil retry did not start"
    FORK_UPSTREAM="local-chain-id-11155111"
    MOCK_OUT="$(cd "$CONTRACTS_ROOT" && forge create src/MockERC20.sol:MockERC20 --rpc-url "$RPC" --private-key "$DEPLOYER_PK" --broadcast 2>&1)" \
      || fail "MockERC20 deploy failed (local anvil retry): $MOCK_OUT"
  else
    fail "MockERC20 deploy failed: $MOCK_OUT"
  fi
}
MOCK="$(echo "$MOCK_OUT" | grep -oE 'Deployed to: 0x[a-fA-F0-9]{40}' | awk '{print $3}')"
[[ -n "$MOCK" ]] || fail "parse MockERC20 address"

export STEWARD_TTG_ADDRESS="$MOCK"
export PRIVATE_KEY="$DEPLOYER_PK"
export TIMELOCK_ADDRESS="${TIMELOCK_ADDRESS:-0x0359d4fB9c4B9f69188A1E9AE2202ABfeD1fEe8f}"  # LEGACY · fork default · GovFreeze V2 ACTIVE: 0x904a6c4c…
DEPLOY_OUT="$(cd "$CONTRACTS_ROOT" && forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
  --rpc-url "$RPC" --broadcast -vv 2>&1)" || fail "DeployRegionStewardStakePool on fork failed: $DEPLOY_OUT"
POOL="$(echo "$DEPLOY_OUT" | grep -m1 'REGION_STEWARD_STAKE_POOL' | awk '{print $NF}')"
[[ -n "$POOL" && "$POOL" == 0x* ]] || fail "parse pool from deploy output"
ok "fork-deployed pool=$POOL mock_ttg=$MOCK"

MIN_STAKE="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" "$J_CN" --rpc-url "$RPC" | awk '{print $1}')"
[[ -n "$MIN_STAKE" && "$MIN_STAKE" =~ ^[0-9]+$ ]] || fail "minStakeAmount(CN) failed"
ok "minStakeAmount(CN)=$MIN_STAKE"

cast send "$MOCK" "mint(address,uint256)" "$STAKER" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" >/dev/null || fail "mint failed"

# B407 staker key is not a default anvil account — fund gas on local fork
cast send "$STAKER" --value 1ether --rpc-url "$RPC" --private-key "$DEPLOYER_PK" >/dev/null 2>&1 || true

ALLOW_BEFORE="$(cast call "$MOCK" "allowance(address,address)(uint256)" "$STAKER" "$POOL" --rpc-url "$RPC" | awk '{print $1}')"
ok "preflight allowance=$ALLOW_BEFORE staker_ttg=$(cast call "$MOCK" "balanceOf(address)(uint256)" "$STAKER" --rpc-url "$RPC" | awk '{print $1}')"

cast send "$MOCK" "approve(address,uint256)" "$POOL" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$PK_STAKER" >/dev/null || fail "approve failed"
ALLOW_AFTER="$(cast call "$MOCK" "allowance(address,address)(uint256)" "$STAKER" "$POOL" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$ALLOW_AFTER" -ge "$MIN_STAKE" ]] || fail "allowance after approve: $ALLOW_AFTER"
ok "approve allowance=$ALLOW_AFTER"

APP_ID="$(cast keccak "tn-p1-004-steward-stake-$(date +%s)")"
STAKE_TX="$(cast send "$POOL" "stake(bytes2,uint256,bytes32)" "$J_CN" "$MIN_STAKE" "$APP_ID" \
  --rpc-url "$RPC" --private-key "$PK_STAKER" --json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).transactionHash||'')}catch{}})")"
[[ -n "$STAKE_TX" ]] || fail "stake tx missing"
ok "stake tx=$STAKE_TX"

HAS="$(cast call "$POOL" "hasJurisdictionStake(address,bytes2)(bool)" "$STAKER" "$J_CN" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$HAS" == "true" ]] || fail "hasJurisdictionStake expected true got $HAS"

POS="$(cast call "$POOL" "stakes(address,bytes2)(uint256,bytes32,uint64,uint64,uint256,bool)" "$STAKER" "$J_CN" --rpc-url "$RPC")"
AMT="$(echo "$POS" | sed -n '1p' | awk '{print $1}')"
ACTIVE="$(echo "$POS" | sed -n '6p' | awk '{print $1}')"
[[ "$AMT" == "$MIN_STAKE" && "$ACTIVE" == "true" ]] || fail "stakes read: $POS"
ok "read position amount=$AMT active=$ACTIVE"

REL_TX="$(cast send "$POOL" "requestRelease(bytes2)" "$J_CN" \
  --rpc-url "$RPC" --private-key "$PK_STAKER" --json | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{try{process.stdout.write(JSON.parse(s).transactionHash||'')}catch{}})")"
[[ -n "$REL_TX" ]] || fail "requestRelease tx missing"
ok "requestRelease tx=$REL_TX"

RELEASABLE="$(cast call "$POOL" "releasableAmount(address,bytes2)(uint256)" "$STAKER" "$J_CN" --rpc-url "$RPC" | awk '{print $1}')"
[[ "$RELEASABLE" == "0" ]] || fail "expected releasableAmount=0 before delay got $RELEASABLE"
ok "releasableAmount=0 (claimReleased after 90d delay — not in this smoke)"

SUMMARY_JSON="$(node -e "console.log(JSON.stringify({
  mode:'sepolia_fork_deploy_write',
  fork_upstream:process.argv[1],
  live_registry_pool:process.argv[2]||null,
  fork_pool:process.argv[3],
  fork_mock_ttg:process.argv[4],
  jurisdiction:'CN',
  staker:process.argv[5],
  min_stake:process.argv[6],
  approve_allowance:process.argv[7],
  stake_tx:process.argv[8],
  request_release_tx:process.argv[9],
  releasable_amount:process.argv[10],
  honest_boundary:'Write on fork-deployed pool; live Sepolia registry pool readonly-only until GovernanceVotesToken redeploy with approve'
},null,2))" \
  "$FORK_UPSTREAM" "${LIVE_POOL:-}" "$POOL" "$MOCK" "$STAKER" "$MIN_STAKE" "$ALLOW_AFTER" "$STAKE_TX" "$REL_TX" "$RELEASABLE")"
echo "$SUMMARY_JSON"
if [[ -n "${STEWARD_WRITE_JSON:-}" ]]; then
  echo "$SUMMARY_JSON" >"${STEWARD_WRITE_JSON}"
fi

echo ""
echo "TT_SMOKE_STEWARD_STAKE_SEPOLIA_WRITE: OK (② Sepolia fork write — registry pool live readonly separate)"
