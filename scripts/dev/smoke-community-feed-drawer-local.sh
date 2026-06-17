#!/usr/bin/env bash
# Phase ① local · community feed drawer smoke (vitest contracts + optional Playwright).
# Usage:
#   bash scripts/dev/smoke-community-feed-drawer-local.sh
#   RUN_E2E=1 bash scripts/dev/smoke-community-feed-drawer-local.sh   # needs Next :3012 + API
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

echo "smoke-community-feed-drawer-local: vitest contracts..."
  npm run test -- --run \
  components/community/postDetailVideoFeedNav.test.ts \
  components/community/postDetailMediaWheelPolicy.test.ts \
  components/community/communityDrawerTheme.contract.test.ts \
  components/community/communityFeedActionTheme.contract.test.ts \
  components/community/communityFollowPillClassName.test.ts \
  components/community/communityShellTheme.contract.test.ts \
  components/community/usePostDetailDrawerModel.test.ts \
  components/community/communityFeedMappers.commentsAndThreadCounts.test.ts \
  lib/communityShowcaseEngagementUi.test.ts \
  lib/communityCommentAuthorUi.test.ts

if [[ "${RUN_E2E:-0}" == "1" ]]; then
  echo "smoke-community-feed-drawer-local: Playwright (localhost:3012 + API)..."
  npm run e2e:community-feed-drawer-interaction
fi

echo "smoke-community-feed-drawer-local: exit 0"
