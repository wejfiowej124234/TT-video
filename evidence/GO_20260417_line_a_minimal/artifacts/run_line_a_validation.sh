#!/usr/bin/env bash
# Line A — Runbook §7.1 步骤 1～5
# API_BASE = 根 URL，无尾斜杠（例 http://127.0.0.1:3012，与根 `.env` PORT/API_BASE_URL 一致）；GET /meta 在根，治理在 /api/v1/governance/*
# 步骤 4～5 须会话：未设 LINE_A_BEARER 时用种子账号登录（须 SEED_TEST_ACCOUNTS=1 + DATABASE_URL）
# 自动加载仓库根 `.env`（供 Step 3 `cast` 使用 FEE_ROUTER_ADDRESS / CHAIN_RPC_URL）
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
if [[ -f "${REPO_ROOT}/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  . "${REPO_ROOT}/.env"
  set +a
fi
API_BASE="${API_BASE:-http://127.0.0.1:3012}"
META_URL="${API_BASE}/meta"

LINE_A_BEARER="${LINE_A_BEARER:-}"
if [[ -z "${LINE_A_BEARER}" ]]; then
  LOGIN_EMAIL="${LINE_A_LOGIN_EMAIL:-tourist@test.com}"
  LOGIN_PASSWORD="${LINE_A_LOGIN_PASSWORD:-Test123!}"
  LINE_A_BEARER="$(curl -sS -X POST "${API_BASE}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${LOGIN_EMAIL}\",\"password\":\"${LOGIN_PASSWORD}\"}" | jq -r '.token // empty')"
fi
if [[ -z "${LINE_A_BEARER}" || "${LINE_A_BEARER}" == "null" ]]; then
  echo "WARN: 无 Bearer（登录失败或未打种子）。步骤 4～5 将返回 401；请设 LINE_A_BEARER 或确认 SEED_TEST_ACCOUNTS=1" >&2
  AUTH=()
else
  AUTH=(-H "Authorization: Bearer ${LINE_A_BEARER}")
fi

echo "=== Step 1: GET /meta → chain.chain_id + chain.contracts（七键）==="
curl -sS "${META_URL}" | jq '{chain_id: .chain.chain_id, contracts: .chain.contracts}'
echo

echo "=== Step 2: Track B — governance.treasury_track_b_entrances ==="
curl -sS "${META_URL}" | jq '.governance.treasury_track_b_entrances'
echo

echo "=== Step 3: FeeRouter 四向（链上只读；须 FEE_ROUTER_ADDRESS + CHAIN_RPC_URL）==="
if [[ -n "${FEE_ROUTER_ADDRESS:-}" && -n "${CHAIN_RPC_URL:-}" ]] && command -v cast >/dev/null 2>&1; then
  FR="$FEE_ROUTER_ADDRESS"
  RPC="$CHAIN_RPC_URL"
  echo "countryBucket:  $(cast call "$FR" "countryBucket()(address)" --rpc-url "$RPC" 2>/dev/null || echo "<cast failed>")"
  echo "globalStakers:  $(cast call "$FR" "globalStakers()(address)" --rpc-url "$RPC" 2>/dev/null || echo "<cast failed>")"
  echo "globalReserve:  $(cast call "$FR" "globalReserve()(address)" --rpc-url "$RPC" 2>/dev/null || echo "<cast failed>")"
  echo "globalOps:      $(cast call "$FR" "globalOps()(address)" --rpc-url "$RPC" 2>/dev/null || echo "<cast failed>")"
else
  echo "跳过：请设置 FEE_ROUTER_ADDRESS、CHAIN_RPC_URL 并安装 foundry cast"
  echo "  cast call \$FEE_ROUTER_ADDRESS \"countryBucket()(address)\" --rpc-url \$CHAIN_RPC_URL"
fi
echo

echo "=== Step 4: projection — fee-pool-aggregates（data_source=projection）==="
curl -sS "${AUTH[@]}" "${API_BASE}/api/v1/governance/fee-pool-aggregates" | jq '{data_source: .data_source, anchor: .anchor}'
echo

echo "=== Step 5: governance/pool（根级 SSOT 与 Σ 分离；event_log 见 DB/reconcile）==="
curl -sS "${AUTH[@]}" "${API_BASE}/api/v1/governance/pool" | jq '{data_source: .data_source, is_chain_ssot: .is_chain_ssot, pool_balance: .pool_balance, country_pool_data_source: .country_pool_data_source}'
echo "（event_log.track_type：须 PG event_log 或 internal indexer-reconcile）"
echo
echo "=== done ==="
