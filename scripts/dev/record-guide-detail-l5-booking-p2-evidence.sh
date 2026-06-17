#!/usr/bin/env bash
# GD-L5-P2 向导预约业务闭环证据（①）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_guide_detail_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/GD-L5-BOOKING-P2-SMOKE-${STAMP}.log"

{
  echo "TT_GD_L5_BOOKING_P2_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  bash "$ROOT/scripts/dev/smoke-guide-detail-booking-p2-local.sh"
  echo "--- vitest GD-L5-P2 contract ---"
  cd "$ROOT/frontend"
  npx vitest run \
    "lib/l5/guideBookingP2.contract.test.ts" \
    "lib/guideBookingDates.test.ts"
  echo "TT_GD_L5_BOOKING_P2_EVIDENCE: OK ${STAMP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_GD_L5_BOOKING_P2_SMOKE: OK" "$RUN_LOG" || { echo "FAIL: missing P2 smoke OK marker"; exit 1; }
grep -q "TT_GD_L5_BOOKING_P2_EVIDENCE: OK" "$RUN_LOG" || { echo "FAIL: missing P2 evidence OK marker"; exit 1; }

echo "Evidence: $RUN_LOG"
exit 0
