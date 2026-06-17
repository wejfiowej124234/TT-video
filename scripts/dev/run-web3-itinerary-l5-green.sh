#!/usr/bin/env bash
# ① 本地 · Web3 创新行程链路 L5 机读绿集（`/` 预览 → 解锁 → `/escrow` 草稿 Experience）
#
# 不含 ② 测试网 / 真 USDC / staging GO
#
# 用法（仓库根）：
#   bash scripts/dev/run-web3-itinerary-l5-green.sh
#
# SSOT：frontend/evidence/GO_local_web3_itinerary_l5/README.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

echo "== Web3 itinerary L5 green set (①) =="

npm run test:i18n:ci

npx vitest run \
  "app/(home)/homeMarketing.contract.test.ts" \
  lib/landingAmbientByCountry.test.ts \
  components/landing/itineraryResultsSection.contract.test.ts \
  components/landing/useLandingPage.contract.test.ts \
  components/landing/unlockModalUx.contract.test.ts \
  components/landing/UnlockModal.test.tsx \
  components/landing/LandingFooter.test.tsx \
  lib/escrowExperienceUi.contract.test.ts \
  lib/escrowProtocolUi.contract.test.ts \
  lib/escrowConsumerL5.contract.test.ts \
  lib/escrowDraftExperienceUiFreeze.contract.test.ts \
  lib/escrowOrderAmountSsot.test.ts \
  lib/ordersGuideDeepLink.test.ts \
  lib/marketOrderCardFromGetOrder.test.ts \
  lib/marketBindOrderList.test.ts \
  lib/landingItinerarySession.test.ts \
  lib/isAssignedGuideId.test.ts \
  lib/escrowDraftFlow.test.ts \
  lib/escrowExperienceP03P04.test.ts \
  lib/escrowExperienceDevTools.test.ts \
  lib/web3PagesPhase1DataHonesty.contract.test.ts \
  lib/marketTravelBookmarksSync.test.ts \
  lib/marketTripDaysFilter.test.ts \
  lib/marketDevVarietyOrders.test.ts \
  components/market/useMarketPage.contract.test.ts \
  components/market/OrderCard.contract.test.ts \
  components/escrow/OrderFlowSteps.test.tsx \
  components/escrow/OrderFlowSteps.integration.test.tsx \
  components/escrow/EscrowDetail/ChatBlock.test.tsx

echo ""
echo "TT_WEB3_ITINERARY_L5_GREEN: OK (① local · preview unlock · escrow draft experience)"
echo "  SSOT: frontend/evidence/GO_local_web3_itinerary_l5/README.md"
