#!/usr/bin/env bash
# ① 本地 · `/orders` 列表 + `/orders/new` + `/pay` Hub L5 机读绿集
#
# 用法（仓库根）：
#   bash scripts/dev/run-orders-l5-green.sh
#
# SSOT：frontend/evidence/GO_local_orders_l5/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

echo "== Orders corridor L5 green set (①) =="

npm run test:i18n:ci

npx vitest run \
  lib/orders/ordersListL5.contract.test.ts \
  lib/orders/ordersNewL5.contract.test.ts \
  lib/orders/ordersCorridorGate.contract.test.ts \
  lib/pay/payHubL5.contract.test.ts \
  lib/escrowProtocolUi.contract.test.ts \
  lib/apiClient/orders/orders.list.test.ts \
  app/pay/page.test.tsx

echo ""
echo "TT_ORDERS_L5_GREEN: OK (① local · orders list · pay hub · escrow link markers)"
echo "  SSOT: frontend/evidence/GO_local_orders_l5/README.md"
