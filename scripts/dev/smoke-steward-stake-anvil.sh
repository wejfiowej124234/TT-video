#!/usr/bin/env bash
# ② Anvil · RegionStewardStakePool 链上 stake 烟测（非 ① chain_off；非 Sepolia staging GO）
#
# 覆盖：forge 部署 → mint/approve → stake(CN) → hasJurisdictionStake 回读
#
# 用法：bash scripts/dev/smoke-steward-stake-anvil.sh
# 可选：ANVIL_PORT=8545 · ANVIL_ALREADY_RUNNING=1 · SKIP_ANVIL_STOP=1 · STEWARD_SKIP_DEPLOY=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

ANVIL_PORT="${ANVIL_PORT:-8545}"
RPC="http://127.0.0.1:${ANVIL_PORT}"
ANVIL_PID=""
ANVIL_STARTED=0
EPHEMERAL_API_PID=""

# anvil #0 deployer · #1 steward candidate
DEPLOYER_PK="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
STEWARD_PK="0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
J_CN="0x434e"

fail() { echo "smoke-steward-stake-anvil: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-steward-stake-anvil: OK $*"; }

cleanup() {
  if [[ -n "${EPHEMERAL_API_PID:-}" ]]; then
    kill "$EPHEMERAL_API_PID" 2>/dev/null || true
  fi
  if [[ "$ANVIL_STARTED" == "1" && "${SKIP_ANVIL_STOP:-0}" != "1" && -n "$ANVIL_PID" ]]; then
    kill "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

command -v forge >/dev/null 2>&1 || fail "forge not found"
command -v cast >/dev/null 2>&1 || fail "cast not found"

if [[ "${ANVIL_ALREADY_RUNNING:-0}" != "1" ]]; then
  if curl -sS -o /dev/null -w "%{http_code}" "$RPC" 2>/dev/null | grep -qE '^200|405$'; then
    ok "anvil already listening on $RPC"
  else
    anvil --port "$ANVIL_PORT" --silent >/dev/null 2>&1 &
    ANVIL_PID=$!
    ANVIL_STARTED=1
    for _ in $(seq 1 30); do
      if cast chain-id --rpc-url "$RPC" >/dev/null 2>&1; then
        break
      fi
      sleep 0.5
    done
    cast chain-id --rpc-url "$RPC" >/dev/null 2>&1 || fail "anvil did not start on $RPC"
    ok "anvil started on $RPC"
  fi
fi

load_dotenv_var() {
  local key="$1"
  if [[ -n "${!key:-}" ]]; then
    return 0
  fi
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^[[:space:]]*${key}=" "$ROOT/.env" 2>/dev/null | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

load_dotenv_var REGION_STEWARD_STAKE_POOL_ADDRESS
load_dotenv_var GOVERNANCE_TOKEN_ADDRESS
load_dotenv_var GOVERNANCE_VOTES_TOKEN_ADDRESS

POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS:-}"
TTG="${GOVERNANCE_TOKEN_ADDRESS:-${GOVERNANCE_VOTES_TOKEN_ADDRESS:-}}"

reuse_deployed=0
if [[ "${STEWARD_SKIP_DEPLOY:-0}" == "1" && -n "$POOL" && -n "$TTG" ]]; then
  reuse_deployed=1
elif [[ -n "$POOL" && -n "$TTG" && "$POOL" == 0x* && "$TTG" == 0x* ]]; then
  code="$(cast code "$POOL" --rpc-url "$RPC" 2>/dev/null || echo "0x")"
  if [[ "$code" != "0x" && "$code" != "" ]]; then
    reuse_deployed=1
  fi
fi

if [[ "$reuse_deployed" == "1" ]]; then
  ok "reuse deployed pool=$POOL ttg=$TTG (skip forge deploy)"
else
  cd "$ROOT/contracts"
  DEPLOY_OUT="$(forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
    --rpc-url "$RPC" --broadcast -vv 2>&1)" || fail "forge deploy script failed"

  POOL="$(echo "$DEPLOY_OUT" | grep -m1 'REGION_STEWARD_STAKE_POOL' | awk '{print $NF}')"
  TTG="$(echo "$DEPLOY_OUT" | grep -m1 'STEWARD_TTG_TOKEN' | awk '{print $NF}')"
  [[ -n "$POOL" && "$POOL" == 0x* ]] || fail "could not parse REGION_STEWARD_STAKE_POOL from deploy output"
  [[ -n "$TTG" && "$TTG" == 0x* ]] || fail "could not parse STEWARD_TTG_TOKEN from deploy output"
  ok "deployed pool=$POOL ttg=$TTG"
fi

cd "$ROOT"

MIN_STAKE_RAW="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" "$J_CN" --rpc-url "$RPC")"
MIN_STAKE="$(echo "$MIN_STAKE_RAW" | awk '{print $1}')"
[[ -n "$MIN_STAKE" && "$MIN_STAKE" =~ ^[0-9]+$ ]] || fail "minStakeAmount(CN) parse failed: $MIN_STAKE_RAW"
ok "minStakeAmount(CN)=$MIN_STAKE"

STEWARD_ADDR="$(cast wallet address --private-key "$STEWARD_PK")"

# MockERC20 mint path (deploy script mints nothing; admin mints for steward)
cast send "$TTG" "mint(address,uint256)" "$STEWARD_ADDR" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$DEPLOYER_PK" >/dev/null \
  || fail "TTG mint failed (use MockERC20 from deploy or set STEWARD_TTG_ADDRESS with mintable token)"

cast send "$TTG" "approve(address,uint256)" "$POOL" "$MIN_STAKE" \
  --rpc-url "$RPC" --private-key "$STEWARD_PK" >/dev/null \
  || fail "approve failed"

APP_ID="$(cast keccak "smoke-steward-anvil")"
cast send "$POOL" "stake(bytes2,uint256,bytes32)" "$J_CN" "$MIN_STAKE" "$APP_ID" \
  --rpc-url "$RPC" --private-key "$STEWARD_PK" >/dev/null \
  || fail "stake failed"

HAS="$(cast call "$POOL" "hasJurisdictionStake(address,bytes2)(bool)" "$STEWARD_ADDR" "$J_CN" --rpc-url "$RPC")"
[[ "$HAS" == "true" ]] || fail "hasJurisdictionStake expected true got $HAS"
ok "on-chain stake CN confirmed"

# Rust eth_call 模块 · 只读 minStake（不要求 wallet 已 stake）
export CHAIN_RPC_URL="$RPC"
export CHAIN_ID="${CHAIN_ID:-$(cast chain-id --rpc-url "$RPC")}"
export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"
cd "$ROOT"
cargo test -p traveltrust-api steward_stake_pool_rpc_min_stake -- --ignored --nocapture \
  || fail "steward_stake_pool_rpc_min_stake failed"
ok "cargo test steward_stake_pool_rpc_min_stake"

# Rust eth_call 旁证 · hasJurisdictionStake（stake 后须 true）
export STEWARD_WALLET="$STEWARD_ADDR"
cargo test -p traveltrust-api steward_stake_pool_anvil_live -- --ignored --nocapture \
  || fail "steward_stake_pool_anvil_live eth_call parity failed"
ok "cargo test steward_stake_pool_anvil_live (eth_call parity)"

# ② HTTP 对拍：临时 API（默认开；STEWARD_API_HTTP_SMOKE=0 跳过）
EPHEMERAL_API_PID=""
EPHEMERAL_API_PORT="${STEWARD_EPHEMERAL_API_PORT:-18081}"
if [[ "${STEWARD_API_HTTP_SMOKE:-1}" == "1" ]]; then
  command -v curl >/dev/null 2>&1 || fail "curl required for STEWARD_API_HTTP_SMOKE"
  ok "starting ephemeral API on :$EPHEMERAL_API_PORT (Anvil chain env)"
  cargo build -p traveltrust-api -q
  (
    cd "$ROOT"
    export CHAIN_RPC_URL="$RPC"
    export CHAIN_ID
    export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"
    export PORT="$EPHEMERAL_API_PORT"
    export SEED_TEST_ACCOUNTS=0
    exec cargo run -p traveltrust-api --quiet
  ) &
  EPHEMERAL_API_PID=$!
  EPHE_API="http://127.0.0.1:${EPHEMERAL_API_PORT}"
  for _ in $(seq 1 90); do
    hc="$(curl -sS -o /dev/null -w "%{http_code}" "$EPHE_API/health" 2>/dev/null || echo "000")"
    if [[ "$hc" == "200" ]]; then
      break
    fi
    sleep 1
  done
  hc="$(curl -sS -o /dev/null -w "%{http_code}" "$EPHE_API/health" 2>/dev/null || echo "000")"
  [[ "$hc" == "200" ]] || fail "ephemeral API not healthy on $EPHE_API (got $hc)"
  STATUS="$(curl -sS "$EPHE_API/api/v1/steward/stake-status?jurisdiction=CN&wallet=$STEWARD_ADDR")"
  echo "$STATUS" | grep -q '"has_jurisdiction_stake":true' \
    || fail "API stake-status expected has_jurisdiction_stake true: $STATUS"
  ok "GET /steward/stake-status HTTP parity (ephemeral API + Anvil pool)"
fi

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
API_BASE="${API_BASE%/}"
if [[ "${STEWARD_API_HTTP_SMOKE:-1}" == "0" && "${STEWARD_API_EXTERNAL_SMOKE:-0}" == "1" ]]; then
  hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
  if [[ "$hc" != "200" ]]; then
    fail "STEWARD_API_EXTERNAL_SMOKE=1 but API not reachable at $API_BASE/health (got $hc)"
  fi
  STATUS="$(curl -sS "$API_BASE/api/v1/steward/stake-status?jurisdiction=CN&wallet=$STEWARD_ADDR")"
  echo "$STATUS" | grep -q '"has_jurisdiction_stake":true' \
    || fail "API stake-status expected has_jurisdiction_stake true: $STATUS"
  ok "GET /steward/stake-status HTTP parity (须 API 已设 CHAIN_RPC_URL + REGION_STEWARD_STAKE_POOL_ADDRESS)"
fi

echo ""
echo "TT_SMOKE_STEWARD_STAKE_ANVIL: OK (② Anvil only — not Sepolia/staging GO)"
echo "  pool:    $POOL"
echo "  ttg:     $TTG"
echo "  steward: $STEWARD_ADDR"
