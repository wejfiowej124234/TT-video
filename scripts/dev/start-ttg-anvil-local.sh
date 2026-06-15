#!/usr/bin/env bash
# 一键：Anvil + 部署本地 TTG（MockERC20）+ 质押池 + 写入 env + 可选验收
#
# 用法（仓库根）：
#   bash scripts/dev/start-ttg-anvil-local.sh
#
# 可选：
#   TTG_ANVIL_SKIP_SMOKE=1          跳过 smoke-steward-stake-anvil
#   TTG_ANVIL_MINT_WALLET=0x…       deploy 后 mint 测试 TTG 到该地址
#   ANVIL_ALREADY_RUNNING=1         复用已有 Anvil
#   SKIP_ANVIL_STOP=1               脚本结束后不杀 Anvil
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export TTG_ANVIL_ROOT="$ROOT"
# shellcheck source=scripts/dev/lib/ttg-anvil-common.sh
source "$ROOT/scripts/dev/lib/ttg-anvil-common.sh"

# Deploy + apply; keep Anvil up for smoke / manual testing
export SKIP_ANVIL_STOP=1
bash "$ROOT/scripts/dev/deploy-ttg-anvil-local.sh" --apply

if [[ -n "${TTG_ANVIL_MINT_WALLET:-}" ]]; then
  bash "$ROOT/scripts/dev/mint-ttg-anvil-local.sh" "$TTG_ANVIL_MINT_WALLET"
fi

if [[ "${TTG_ANVIL_SKIP_SMOKE:-0}" != "1" ]]; then
  echo ">>> Running smoke-steward-stake-anvil (reuse .env pool · no redeploy)..."
  ANVIL_ALREADY_RUNNING=1 SKIP_ANVIL_STOP=1 STEWARD_SKIP_DEPLOY=1 \
    bash "$ROOT/scripts/dev/smoke-steward-stake-anvil.sh"
fi

echo ""
echo "TT_TTG_ANVIL_STACK: OK"
echo "  Next: restart API if running · open http://127.0.0.1:3012/steward/register"
echo "  Site login required for POST /steward/applications (①); wallet verify needs Bearer token."
