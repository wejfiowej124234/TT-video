#!/usr/bin/env bash
# ① 订单走廊 · 自留 run-orders-corridor-local.sh exit 0 日志
#
# 用法（仓库根 · API :8080 · Next :3012 可选）：
#   bash scripts/dev/record-orders-corridor-acceptance-log.sh
#   SKIP_E2E=1 bash scripts/dev/record-orders-corridor-acceptance-log.sh
#
# 输出：frontend/evidence/GO_local_orders_l5/acceptance.latest.log
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/frontend/evidence/GO_local_orders_l5"
OUT_LOG="$OUT_DIR/acceptance.latest.log"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$OUT_DIR"

{
  echo "# GO_local_orders_l5 acceptance log · $STAMP (UTC)"
  echo "# cmd: bash scripts/dev/run-orders-corridor-local.sh"
  echo "# SSOT: frontend/evidence/GO_local_orders_l5/README.md"
  echo "# SKIP_E2E=${SKIP_E2E:-0}"
  echo ""
} >"$OUT_LOG"

set +e
bash "$ROOT/scripts/dev/run-orders-corridor-local.sh" 2>&1 | tee -a "$OUT_LOG"
rc=${PIPESTATUS[0]}
set -e

{
  echo ""
  echo "# exit_code=$rc · recorded=$STAMP"
} >>"$OUT_LOG"

if [[ "$rc" -ne 0 ]]; then
  echo "record-orders-corridor-acceptance: FAIL exit $rc (see $OUT_LOG)" >&2
  exit "$rc"
fi

echo "record-orders-corridor-acceptance: OK → $OUT_LOG"
grep -q "TT_ORDERS_CORRIDOR_LOCAL: OK" "$OUT_LOG" || {
  echo "record-orders-corridor-acceptance: FAIL missing TT_ORDERS_CORRIDOR_LOCAL: OK in log" >&2
  exit 1
}
