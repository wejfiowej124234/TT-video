#!/usr/bin/env bash
# 将 scripts/dev/.env.anvil.local 合并进仓库根 .env（标记块，可重复执行）
#
# 用法：bash scripts/dev/apply-ttg-anvil-env-to-root.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export TTG_ANVIL_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/ttg-anvil-common.sh
source "$ROOT/scripts/dev/lib/ttg-anvil-common.sh"

[[ -f "$(ttg_anvil_env_file_path)" ]] \
  || ttg_anvil_fail "run deploy-ttg-anvil-local.sh first"

ttg_anvil_apply_root_env
API_LISTEN_PORT="${API_LISTEN_PORT:-8080}" bash "$ROOT/scripts/dev/sync-frontend-env-local-from-root.sh"
echo "TT_TTG_ANVIL_APPLY: OK — restart traveltrust-api and Next dev server"
