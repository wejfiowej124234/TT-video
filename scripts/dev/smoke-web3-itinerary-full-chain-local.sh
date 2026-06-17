#!/usr/bin/env bash
# ① 本地 · Web3 创新行程全链 API 烟测（①创建无向导 → ②PATCH绑定向导/更换 → ③确认终版 UI 另验）
#
# 用法（仓库根，API 已起）：
#   bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh
#
# 可选：API_BASE=http://127.0.0.1:8080
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== smoke-web3-itinerary-full-chain-local (①) =="
bash "$ROOT/scripts/dev/smoke-landing-itinerary-flow-local.sh"
bash "$ROOT/scripts/dev/smoke-escrow-draft-guide-bind-local.sh"
echo ""
echo "TT_WEB3_ITINERARY_FULL_CHAIN_SMOKE: OK (① · create no guide · publish · bind · reassign)"
