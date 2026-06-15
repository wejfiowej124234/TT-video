#!/usr/bin/env bash
# ② 本地 · 部署 Anvil 上的 MockERC20（TTG）+ RegionStewardStakePool，并写入 scripts/dev/.env.anvil.local
#
# 用法（仓库根）：
#   bash scripts/dev/deploy-ttg-anvil-local.sh
#   bash scripts/dev/deploy-ttg-anvil-local.sh --apply   # 同时合并到根 .env
#
# 可选：ANVIL_PORT=8545 · ANVIL_ALREADY_RUNNING=1 · SKIP_ANVIL_STOP=1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export TTG_ANVIL_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/ttg-anvil-common.sh
source "$ROOT/scripts/dev/lib/ttg-anvil-common.sh"

# 被 start-ttg-anvil-local 调用时保留 Anvil 供后续 smoke
SKIP_ANVIL_STOP="${SKIP_ANVIL_STOP:-0}"

APPLY_ROOT=0
for arg in "$@"; do
  case "$arg" in
    --apply) APPLY_ROOT=1 ;;
    -h | --help)
      echo "Usage: bash scripts/dev/deploy-ttg-anvil-local.sh [--apply]"
      exit 0
      ;;
  esac
done

ttg_anvil_cleanup() {
  if [[ "${TTG_ANVIL_STARTED:-0}" == "1" && "${SKIP_ANVIL_STOP:-0}" != "1" && -n "${TTG_ANVIL_PID:-}" ]]; then
    kill "$TTG_ANVIL_PID" 2>/dev/null || true
  fi
}
trap ttg_anvil_cleanup EXIT

ttg_anvil_ensure_anvil
if [[ "${TTG_ANVIL_FORCE_DEPLOY:-0}" == "1" ]] || ! ttg_anvil_try_reuse_deploy; then
  ttg_anvil_deploy_pool
  ttg_anvil_write_env_file
fi

ttg_anvil_fund_test_wallets

if [[ "$APPLY_ROOT" == "1" ]]; then
  ttg_anvil_apply_root_env
  if [[ -f "$ROOT/frontend/.env.local" || -f "$ROOT/.env" ]]; then
    API_LISTEN_PORT="${API_LISTEN_PORT:-8080}" bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh" || true
  fi
fi

ttg_anvil_print_guide
echo ""
echo "TT_TTG_ANVIL_DEPLOY: OK pool=${TTG_ANVIL_POOL} ttg=${TTG_ANVIL_TTG}"
