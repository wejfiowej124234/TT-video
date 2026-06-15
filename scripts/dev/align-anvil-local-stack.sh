#!/usr/bin/env bash
# ① Anvil 全栈对齐：FundStack → TTG → supersede Sepolia 顶栏键 → sync frontend
#
# 用法（仓库根）：
#   bash scripts/dev/align-anvil-local-stack.sh
#   ANVIL_ALREADY_RUNNING=1 bash scripts/dev/align-anvil-local-stack.sh
#
# 可选：TTG_ANVIL_FORCE_DEPLOY=1（强制重部署 TTG 池，修复地址碰撞）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export ANVIL_ENV_ROOT="$ROOT"

echo "align-anvil-local-stack: FundStack deploy + apply ..."
if cast chain-id --rpc-url "${ANVIL_RPC:-http://127.0.0.1:8545}" >/dev/null 2>&1; then
  export ANVIL_ALREADY_RUNNING=1
else
  export ANVIL_ALREADY_RUNNING=0
fi
SKIP_ANVIL_STOP=1 \
  bash "$ROOT/scripts/dev/deploy-fundstack-anvil-local.sh" --apply

echo "align-anvil-local-stack: TTG deploy + apply ..."
SKIP_ANVIL_STOP=1 \
  TTG_ANVIL_FORCE_DEPLOY="${TTG_ANVIL_FORCE_DEPLOY:-1}" \
  bash "$ROOT/scripts/dev/deploy-ttg-anvil-local.sh" --apply

# shellcheck source=scripts/dev/lib/anvil-local-env-lib.sh
source "$ROOT/scripts/dev/lib/anvil-local-env-lib.sh"
anvil_env_supersede_sepolia_top_level
anvil_env_dedupe_managed_blocks
anvil_env_prune_superseded_comments
anvil_env_prune_duplicate_top_level_keys

API_LISTEN_PORT="${API_LISTEN_PORT:-8080}" bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"

echo "align-anvil-local-stack: bytecode audit ..."
bash "$ROOT/scripts/dev/verify-anvil-local-bytecode.sh"

echo "align-anvil-local-stack: mint USDC to Anvil test wallets ..."
bash "$ROOT/scripts/dev/mint-fundstack-anvil-usdc.sh" || true

echo "align-anvil-local-stack: align guide DB stake to chain ..."
bash "$ROOT/scripts/dev/align-guide-stake-db-to-chain-local.sh" || true

if [[ "${SKIP_ANVIL_STAKE_SMOKES:-0}" != "1" ]]; then
  echo "align-anvil-local-stack: guide + provider stake smokes (FUNDSTACK_SKIP_DEPLOY=1) ..."
  FUNDSTACK_SKIP_DEPLOY=1 bash "$ROOT/scripts/dev/smoke-guide-identity-stake-anvil.sh"
  FUNDSTACK_SKIP_DEPLOY=1 bash "$ROOT/scripts/dev/smoke-provider-identity-stake-anvil.sh"
fi

echo "align-anvil-local-stack: env ↔ meta check (API must be running on :8080) ..."
if curl -sS -o /dev/null -w "%{http_code}" --connect-timeout 2 "${API_BASE_URL:-http://127.0.0.1:8080}/health" 2>/dev/null | grep -q 200; then
  API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8080}" bash "$ROOT/scripts/dev/verify-root-env-vs-meta-chain-contracts.sh" || true
else
  echo "align-anvil-local-stack: SKIP verify-root-env-vs-meta (API not on :8080 — restart API then run script)"
fi

echo "TT_ANVIL_LOCAL_ALIGN: OK — restart traveltrust-api (TRAVELTRUST_CHAIN_ON=1) + Next.js dev server"
