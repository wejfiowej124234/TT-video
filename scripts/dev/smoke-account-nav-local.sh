#!/usr/bin/env bash
# ① 本地 · 账户导航统一机读烟测（设置族 + 社区资料族 + P3 命名）
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-account-nav-local.sh
# 全量（含社区契约 + 可选 Playwright 分层）：bash scripts/dev/smoke-account-nav-full-local.sh
#
# 可选 Playwright（需 API + dev）：
#   PLAYWRIGHT_ACCOUNT_NAV=1 bash scripts/dev/smoke-account-nav-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

fail() { echo "smoke-account-nav: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-account-nav: OK $*"; }

npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"
ok "i18n gate"

npm run test -- \
  accountNavPageTracker \
  accountNavNamingP3 \
  meSettingsPageTracker \
  communityMePageTracker \
  meSettingsFamily \
  headerUserMenuNavModel \
  headerUserMenuNavActive \
  headerUtilityMenuUiFreeze \
  MeQuickLinksSection \
  --run >/dev/null || fail "vitest account nav union"

ok "vitest union"

if [[ "${PLAYWRIGHT_ACCOUNT_NAV:-}" == "1" ]]; then
  if [[ -z "${PLAYWRIGHT_E2E_STABILITY:-}" ]]; then
    export PLAYWRIGHT_E2E_STABILITY=1
  fi
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/account-nav-header-ia.spec.ts || fail "playwright account-nav-header-ia"
  node ./scripts/run-e2e-default.mjs --project=chromium \
    e2e/community-me-hub-notes-drawer-ia.spec.ts -g "compact quick links drawer hides reports" \
    || fail "playwright hub compact quick links"
  ok "playwright (account-nav-header + hub reports)"
fi

ok "done (phase ① local)"
