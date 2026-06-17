#!/usr/bin/env bash
# ① 本地 · 订单列表走廊机读闸（L5 绿集 + API 烟测 + 可选 Playwright）
#
# 用法（仓库根）：
#   bash scripts/dev/run-orders-corridor-local.sh
#   SKIP_E2E=1 bash scripts/dev/run-orders-corridor-local.sh
#
# SSOT：frontend/evidence/GO_local_orders_l5/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "== orders corridor local (① · list → pay · escrow) =="

bash "$ROOT/scripts/dev/run-orders-l5-green.sh"
bash "$ROOT/scripts/dev/smoke-orders-list-local.sh"
bash "$ROOT/scripts/dev/smoke-orders-pay-escrow-local.sh"

if [[ "${SKIP_E2E:-}" != "1" ]]; then
  echo "== Playwright · orders-corridor (UI list → pay / escrow) =="
  cd "$ROOT/frontend"
  npm run e2e:orders-corridor
else
  echo "SKIP_E2E=1 → skipped Playwright orders corridor"
fi

echo ""
echo "TT_ORDERS_CORRIDOR_LOCAL: OK (① local · not ②③ staging/production GO)"
echo "  SSOT: frontend/evidence/GO_local_orders_l5/README.md"
