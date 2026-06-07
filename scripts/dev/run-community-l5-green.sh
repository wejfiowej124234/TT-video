#!/usr/bin/env bash
# Phase ① · /community/* TT 社区 L5 vitest 窄绿集（UI 冻结 + 子路由/抽屉/发帖 contract）
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT/frontend"
npx vitest run \
  components/community/communityShellTheme.contract.test.ts \
  components/community/communityMainPathRg.contract.test.ts \
  components/community/communityPageTheme.contract.test.ts \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/communityModals.contract.test.ts \
  components/community/communityRelationalShowcaseHonesty.contract.test.ts \
  components/community/communityPhase1DataHonesty.contract.test.ts \
  components/community/communityPhase29W2.contract.test.ts \
  lib/me/mePhase29W3.contract.test.ts \
  components/community/PublishDrawer \
  lib/communityPostTagsPayload.test.ts \
  lib/communityShowcase.gating.test.ts \
  lib/communityExploreDestinationsFromApi.test.ts \
  app/community/communitySubRoutes.contract.test.ts \
  app/community/communityRouteDataHooks.contract.test.ts \
  components/me/communityMeProfile.contract.test.ts \
  lib/marketingRouteTransitionPerf.contract.test.ts
echo "TT_COMMUNITY_L5_GREEN: OK"
