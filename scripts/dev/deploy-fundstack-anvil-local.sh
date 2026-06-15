#!/usr/bin/env bash
# ① Anvil · FundStack（GuideIdentityStakingPool + Registry + MockERC20 USDC）
#
# 用法：
#   bash scripts/dev/deploy-fundstack-anvil-local.sh          # deploy + write .env.fundstack-anvil.local
#   bash scripts/dev/deploy-fundstack-anvil-local.sh --apply  # 同上 + 合并根 .env + sync frontend/.env.local
#
# 可选：ANVIL_PORT=8545 · ANVIL_ALREADY_RUNNING=1 · FUNDSTACK_SKIP_DEPLOY=1（仅 apply）
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=scripts/dev/lib/fundstack-anvil-common.sh
source "$ROOT/scripts/dev/lib/fundstack-anvil-common.sh"

APPLY=0
for arg in "$@"; do
  [[ "$arg" == "--apply" ]] && APPLY=1
done

fundstack_anvil_ensure_anvil

if [[ "${FUNDSTACK_SKIP_DEPLOY:-0}" == "1" ]]; then
  fundstack_anvil_ok "FUNDSTACK_SKIP_DEPLOY=1 — skip forge deploy"
elif fundstack_anvil_try_reuse_deploy; then
  fundstack_anvil_write_env_file
else
  fundstack_anvil_deploy
  fundstack_anvil_write_env_file
fi

if [[ "$APPLY" == "1" ]]; then
  fundstack_anvil_apply_root_env
  bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"
  fundstack_anvil_ok "frontend/.env.local synced — restart Next.js dev server"
fi

echo "TT_FUNDSTACK_ANVIL_DEPLOY: OK"
