#!/usr/bin/env bash
# GD-L5 向导详情预约烟测证据（①）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_guide_detail_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/GD-L5-BOOKING-SMOKE-${STAMP}.log"

{
  echo "TT_GD_L5_BOOKING_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  bash "$ROOT/scripts/dev/smoke-guide-detail-booking-local.sh"
  echo "--- vitest guide detail L5 closure ---"
  cd "$ROOT/frontend"
  npx vitest run \
    "app/guides/[id]/guideDetailPageL5.contract.test.ts" \
    "lib/l5/guideDetailL5Closure.contract.test.ts" \
    "lib/orders/ordersNewL5.contract.test.ts"
  echo "TT_GD_L5_BOOKING_EVIDENCE: OK ${STAMP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_GD_L5_BOOKING_SMOKE: OK" "$RUN_LOG" || { echo "FAIL: missing smoke OK marker"; exit 1; }
grep -q "TT_GD_L5_BOOKING_EVIDENCE: OK" "$RUN_LOG" || { echo "FAIL: missing evidence OK marker"; exit 1; }

echo "Evidence: $RUN_LOG"
exit 0
