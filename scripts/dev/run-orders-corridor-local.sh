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

_reclaim_frontend_listen_port() {
  local port="${FRONTEND_PORT:-3012}"
  if command -v powershell >/dev/null 2>&1; then
    powershell -NoProfile -Command \
      "\$p = @(Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique); foreach (\$x in \$p) { if (\$x -and \$x -ne 0) { Stop-Process -Id \$x -Force -ErrorAction SilentlyContinue } }" \
      2>/dev/null || true
  else
    bash -lc "pids=\$(lsof -t -iTCP:${port} -sTCP:LISTEN 2>/dev/null || true); if [ -n \"\$pids\" ]; then kill -9 \$pids 2>/dev/null || true; fi" \
      2>/dev/null || true
  fi
}

bash "$ROOT/scripts/dev/run-orders-l5-green.sh"
bash "$ROOT/scripts/dev/smoke-orders-list-local.sh"
bash "$ROOT/scripts/dev/smoke-orders-pay-escrow-local.sh"

if [[ "${SKIP_E2E:-}" != "1" ]]; then
  echo "== Playwright · orders-corridor (UI list → pay / escrow) =="
  _reclaim_frontend_listen_port
  export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
  export PLAYWRIGHT_RELAX_META_CHAIN_GUARD="${PLAYWRIGHT_RELAX_META_CHAIN_GUARD:-1}"
  export PLAYWRIGHT_FULL_STACK="${PLAYWRIGHT_FULL_STACK:-1}"
  export PLAYWRIGHT_REUSE_FE_SERVER="${PLAYWRIGHT_REUSE_FE_SERVER:-1}"
  export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
  # Site10 编排：API 已由外层烟测拉起；勿 kill :8080 / 勿 purge .next（run-e2e-default 同源旗标）
  export COMMUNITY_ME_L5_GREEN_REUSE="${COMMUNITY_ME_L5_GREEN_REUSE:-1}"
  export PLAYWRIGHT_SKIP_NEXT_PURGE="${PLAYWRIGHT_SKIP_NEXT_PURGE:-1}"
  cd "$ROOT/frontend"
  npm run e2e:orders-corridor
else
  echo "SKIP_E2E=1 → skipped Playwright orders corridor"
fi

echo ""
echo "TT_ORDERS_CORRIDOR_LOCAL: OK (① local · not ②③ staging/production GO)"
echo "  SSOT: frontend/evidence/GO_local_orders_l5/README.md"
