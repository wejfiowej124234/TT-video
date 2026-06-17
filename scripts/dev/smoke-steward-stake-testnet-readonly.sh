#!/usr/bin/env bash
# ② 测试网 · RegionStewardStakePool 只读烟测（已部署地址 · 不要求 stake tx）
#
# 前置：`.env` 含 CHAIN_RPC_URL + REGION_STEWARD_STAKE_POOL_ADDRESS（Sepolia/staging）
# 可选：STEWARD_TESTNET_API_SMOKE=1 — 对运行中 API 做 GET /steward/stake-status（wallet 仅校验 503/200 形态）
#
# 用法：bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

J_CN="0x434e"
PROBE_WALLET="${STEWARD_PROBE_WALLET:-0x0000000000000000000000000000000000000001}"

fail() { echo "smoke-steward-stake-testnet-readonly: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-steward-stake-testnet-readonly: OK $*"; }

load_dotenv_var() {
  local key="$1"
  [[ -n "${!key:-}" ]] && return 0
  [[ -f "$ROOT/.env" ]] || return 0
  local line
  line="$(grep -E "^${key}=" "$ROOT/.env" | head -1 || true)"
  [[ -n "$line" ]] || return 0
  export "$key=${line#*=}"
}

for k in CHAIN_RPC_URL CHAIN_ID REGION_STEWARD_STAKE_POOL_ADDRESS; do
  load_dotenv_var "$k"
done

[[ -n "${CHAIN_RPC_URL:-}" ]] || fail "CHAIN_RPC_URL not set"
[[ -n "${REGION_STEWARD_STAKE_POOL_ADDRESS:-}" ]] || fail "REGION_STEWARD_STAKE_POOL_ADDRESS not set — run deploy-steward-stake-pool-testnet.sh first"

POOL="${REGION_STEWARD_STAKE_POOL_ADDRESS}"
[[ "$POOL" == 0x* ]] || fail "invalid pool address $POOL"

command -v cast >/dev/null 2>&1 || fail "cast not found"

CID="$(cast chain-id --rpc-url "$CHAIN_RPC_URL")"
ok "chain_id=$CID pool=$POOL"

CODE="$(cast code "$POOL" --rpc-url "$CHAIN_RPC_URL" | tr -d ' \n')"
[[ -n "$CODE" && "$CODE" != "0x" ]] || fail "no contract code at $POOL"

VER="$(cast call "$POOL" "version()(string)" --rpc-url "$CHAIN_RPC_URL")"
MIN_CN="$(cast call "$POOL" "minStakeAmount(bytes2)(uint256)" "$J_CN" --rpc-url "$CHAIN_RPC_URL" | awk '{print $1}')"
[[ -n "$MIN_CN" && "$MIN_CN" =~ ^[0-9]+$ ]] || fail "minStakeAmount(CN) failed: $MIN_CN"
ok "version=$VER minStakeAmount(CN)=$MIN_CN"

HAS="$(cast call "$POOL" "hasJurisdictionStake(address,bytes2)(bool)" "$PROBE_WALLET" "$J_CN" --rpc-url "$CHAIN_RPC_URL")"
[[ "$HAS" == "true" || "$HAS" == "false" ]] || fail "hasJurisdictionStake call failed: $HAS"
ok "hasJurisdictionStake(probe)=$HAS"

# API 模块 eth_call 旁证（不要求 probe 已 stake）
export CHAIN_RPC_URL
export CHAIN_ID="${CHAIN_ID:-$CID}"
export REGION_STEWARD_STAKE_POOL_ADDRESS="$POOL"
cargo test -p traveltrust-api jurisdiction_bytes2 -- --nocapture \
  || fail "steward_stake_pool unit tests failed"

if [[ "${STEWARD_TESTNET_API_SMOKE:-0}" == "1" ]]; then
  API_BASE="${API_BASE:-http://127.0.0.1:8080}"
  API_BASE="${API_BASE%/}"
  hc="$(curl -sS -o /dev/null -w "%{http_code}" "$API_BASE/health" 2>/dev/null || echo "000")"
  [[ "$hc" == "200" ]] || fail "API not reachable at $API_BASE/health (got $hc)"
  STATUS="$(curl -sS "$API_BASE/api/v1/steward/stake-status?jurisdiction=CN&wallet=$PROBE_WALLET")"
  echo "$STATUS" | grep -q '"has_jurisdiction_stake"' \
    || fail "stake-status missing has_jurisdiction_stake: $STATUS"
  ok "GET /steward/stake-status HTTP (testnet RPC via running API)"
fi

echo ""
echo "TT_SMOKE_STEWARD_STAKE_TESTNET_READONLY: OK (② testnet read — not staging report.json GO)"
