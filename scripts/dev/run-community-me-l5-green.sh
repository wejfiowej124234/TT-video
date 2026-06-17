#!/usr/bin/env bash

# ① 本地 · `/community/me` Hub + 独立页 L5 窄绿集（Vitest contract + deterministic Playwright）

#

# 不含 ② 测试网 / ③ Production GO

#

# 用法（仓库根）：

#   bash scripts/dev/run-community-me-l5-green.sh

#   cd frontend && npm run green:community-me-l5

#

# SSOT：frontend/evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md

# 机读：frontend/evidence/GO_local_community_me_l5/community-me-l5-local-gate.v1.json
# 账户导航：frontend/evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json
# 全量烟测（Vitest 已跑本脚本契约时可 SKIP_*）：scripts/dev/smoke-account-nav-full-local.sh

set -euo pipefail



ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT/frontend"



if [[ -z "${PLAYWRIGHT_E2E_STABILITY:-}" ]]; then

  export PLAYWRIGHT_E2E_STABILITY=1

fi



echo "== Community /community/me L5 green set (① · ME-P1-7) =="

if [[ -z "${SKIP_COMMUNITY_ME_I18N:-}" ]]; then
  npm run test:i18n:ci
else
  echo "(skip i18n — caller already ran test:i18n:ci)"
fi

if [[ -z "${SKIP_COMMUNITY_ME_VITEST:-}" ]]; then
npx vitest run \
  lib/accountNav/accountNavPageTracker.contract.test.ts \
  lib/communityMePageTracker.contract.test.ts \
  app/community/me/posts/communityMePostsPage.contract.test.ts \
  app/community/me/reports/communityMeReportsPage.contract.test.ts \
  components/me/communityMeProfile.contract.test.ts \
  lib/communityMeContentNav.test.ts \
  app/community/communityRouteDataHooks.contract.test.ts
else
  echo "(skip vitest — caller already ran community me contracts)"
fi

echo ""

echo "== Playwright deterministic (warm order: a-parity → b-load-more → c-dedicated → data-state guest) =="

# 两批 Playwright（`-g` 不可与 a/b/c 同进程，否则只跑 data-state 访客用例）
node ./scripts/run-e2e-default.mjs --project=chromium \
  e2e/community-me-l5-a-parity-closeout.spec.ts \
  e2e/community-me-l5-b-load-more-mocked.spec.ts \
  e2e/community-me-l5-c-dedicated-l5.spec.ts
export COMMUNITY_ME_L5_GREEN_REUSE=1
node ./scripts/run-e2e-default.mjs --project=chromium \
  e2e/community-me-data-state.spec.ts -g "访客"

if [[ -z "${SKIP_COMMUNITY_ME_ACCOUNT_NAV_IA:-}" ]]; then
  echo ""
  echo "== Playwright account nav IA (header menu + hub drawer + tab matrix) =="
  node ./scripts/run-e2e-default.mjs --project=chromium \
    e2e/account-nav-header-ia.spec.ts \
    e2e/community-me-hub-notes-drawer-ia.spec.ts -g "compact quick links drawer hides reports" \
    e2e/community-me-hub-notes-drawer-ia.spec.ts -g "likes segment navigates" \
    e2e/community-me-hub-tab-redirect-matrix.spec.ts
else
  echo "(skip account-nav IA Playwright — caller already ran smoke-account-nav-full account_nav layer)"
fi



echo ""

echo "TT_COMMUNITY_ME_L5_GREEN: OK (① local · vitest union + deterministic Playwright + account nav IA + tab matrix)"

echo "  SSOT: frontend/evidence/GO_local_community_me_l5/COMMUNITY-ME-L5-FREEZE.md"

