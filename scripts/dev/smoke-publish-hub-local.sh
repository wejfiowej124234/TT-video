#!/usr/bin/env bash

# ① 本地 · 发布中心 /me/publish L5 机读烟测（vitest + i18n · 可选 Playwright）

#

# 用法（仓库根）：

#   bash scripts/dev/smoke-publish-hub-local.sh

#

# 可选 Playwright（需 API + dev）：

#   PLAYWRIGHT_PUBLISH_HUB=1 bash scripts/dev/smoke-publish-hub-local.sh

set -euo pipefail



ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT/frontend"



fail() { echo "smoke-publish-hub: FAIL $*" >&2; exit 1; }

ok() { echo "smoke-publish-hub: OK $*"; }



npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"

ok "i18n gate"



npm run test -- publishHubL5FullClosure publishHubPage publishHubUiFreeze publishHubGuideModel publishHubItemModel publishHubVisibleRailsModel publishHubFilterDeepLink publishHubPhaseTaskList accountNavNamingP3 headerUserMenuNavModel headerUtilityMenuUiFreeze activeWorkspaceContext headerWorkspaceContextNavModel workspaceContextWorkbenchNav publishHubWorkspaceContextSync publishHubOperatingSpineModel publishHubPublishSummaryRoute publishHubIdentityDefaultFilter meSettingsL5 meIdentitiesPage MeQuickLinksSection publishHubServerSummaryModel publishHubIaBoundaryFreeze accountOperatingModelUxWave0 accountOperatingModelUxWave1 ordersListL5 meSettingsPageI18nKeys --run >/dev/null || fail "vitest publish hub green set"

ok "vitest green set"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
export API_BASE STRICT_API=0
bash "$ROOT/scripts/dev/smoke-publish-hub-api-probe-local.sh" || fail "publish-summary API probe"

if [[ "${PLAYWRIGHT_PUBLISH_HUB:-}" == "1" ]]; then
  if [[ -z "${PLAYWRIGHT_E2E_STABILITY:-}" ]]; then
    export PLAYWRIGHT_E2E_STABILITY=1
  fi
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/publish-hub-l5.spec.ts || fail "playwright publish-hub-l5"
  ok "playwright publish-hub-l5"
fi
echo "TT_PUBLISH_HUB_SMOKE: OK phase=① wave1-local-spine+summary+l5-closure+ia-boundary+ux-wave0"

ok "done (phase ① local L5 ACTIVE · IA 100 · UX Wave0 100)"

