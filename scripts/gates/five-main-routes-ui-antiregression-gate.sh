#!/usr/bin/env bash
# ① 五主路由 UI 防回归闸（home linkage + 五主 theme/layout lock）
# SSOT: frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

FILES=(
  "components/landing/unlockModalUx.contract.test.ts"
  "components/landing/useLandingPage.contract.test.ts"
  "components/community/communityMainPathRg.contract.test.ts"
  "components/community/communityPageTheme.contract.test.ts"
  "components/did-rank/didRankTheme.contract.test.ts"
  "app/(home)/homeMarketing.contract.test.ts"
  "components/landing/itineraryResultsSection.contract.test.ts"
  "components/market/marketTheme.contract.test.ts"
  "lib/landingAmbientByCountry.test.ts"
  "components/community/communityShellTheme.contract.test.ts"
  "lib/traveltrustHomeLayoutLockL5.test.ts"
  "components/landing/LandingFooter.test.tsx"
)

echo "==> [five-main-routes-ui-gate] vitest · ${#FILES[@]} files (home linkage + 五主路由 theme)"
npx vitest run "${FILES[@]}"

echo ""
echo "TT_FIVE_MAIN_ROUTES_UI_GATE_SUMMARY: OK phase=local-1 files=${#FILES[@]}"
