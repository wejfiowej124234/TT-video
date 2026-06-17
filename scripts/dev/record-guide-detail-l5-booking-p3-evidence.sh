#!/usr/bin/env bash
# GD-L5-P3 向导预约 itinerary-first 证据（①）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_guide_detail_l5"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/GD-L5-BOOKING-P3-SMOKE-${STAMP}.log"

{
  echo "TT_GD_L5_BOOKING_P3_EVIDENCE: START ${STAMP}"
  echo "phase: ① local only"
  cd "$ROOT/frontend"
  npx vitest run \
    "lib/l5/guideBookingP3.contract.test.ts" \
    "components/market/BookGuideModal.test.tsx"
  echo "TT_GD_L5_BOOKING_P3_EVIDENCE: OK ${STAMP}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_GD_L5_BOOKING_P3_EVIDENCE: OK" "$RUN_LOG" || { echo "FAIL: missing P3 evidence OK marker"; exit 1; }

echo "Evidence: $RUN_LOG"
echo "Optional E2E (frontend :3012): PLAYWRIGHT_BASE_URL=http://127.0.0.1:3012 npx playwright test e2e/b469-guides-drawer-booking-convergence.spec.ts"
exit 0
