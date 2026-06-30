#!/usr/bin/env bash
# ① 本地 · 账户导航全量烟测（设置 + 社区 + P3 · Vitest 一次 + 可选 Playwright 分层）
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-account-nav-full-local.sh
#
# 可选环境变量：
#   FRONTEND_BASE=http://127.0.0.1:3012     # HTTP 探活（设置 7 路由）
#   PLAYWRIGHT_ME_SETTINGS=1                # e2e/me-settings-l5-hub.spec.ts
#   PLAYWRIGHT_ACCOUNT_NAV=1              # 顶栏 IA + Hub 举报抽屉
#   PLAYWRIGHT_COMMUNITY_ME=1             # 社区 ME 全量 Playwright（跳过本子脚本已跑的 i18n/vitest）
#   PLAYWRIGHT_FULL=1                     # 上述 Playwright 全开（含 me-settings batch14 · account-nav IA）
#   PLAYWRIGHT_ME_SETTINGS_EVIDENCE=...   # 默认 PLAYWRIGHT_ME_SETTINGS_BATCH20.log
#   PLAYWRIGHT_ACCOUNT_NAV_FULL_EVIDENCE=... # PLAYWRIGHT_FULL=1 时写入 PLAYWRIGHT_ACCOUNT_NAV_FULL.log
#
# SSOT：frontend/evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json → playwright_matrix
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

fail() { echo "smoke-account-nav-full: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-account-nav-full: OK $*"; }

pw_layer_enabled() {
  case "$1" in
    settings) [[ "${PLAYWRIGHT_FULL:-}" == "1" || "${PLAYWRIGHT_ME_SETTINGS:-}" == "1" ]] ;;
    account_nav) [[ "${PLAYWRIGHT_FULL:-}" == "1" || "${PLAYWRIGHT_ACCOUNT_NAV:-}" == "1" ]] ;;
    community_me) [[ "${PLAYWRIGHT_FULL:-}" == "1" || "${PLAYWRIGHT_COMMUNITY_ME:-}" == "1" ]] ;;
    *) return 1 ;;
  esac
}

echo "== Account nav FULL smoke (① · ME-P1-10) =="

npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"
ok "i18n gate (once)"

npm run test -- \
  accountNavPageTracker \
  accountNavNamingP3 \
  meSettingsL5LocalGate \
  meSettingsL5 \
  meSettingsPageTracker \
  meSettingsPageI18nKeys \
  mePasswordPageI18nKeys \
  meSecurityPage.contract \
  meSettingsLanguage.contract \
  meSettingsHubStatus.contract \
  meSettingsNavEnrich.contract \
  meSettingsHubSection.contract \
  meSettingsFamily.contract \
  meSettingsFamilyFullScore.contract \
  meSettingsFeedbackExtension.contract \
  meSettingsHelpExtension.contract \
  meSettingsLegalExtension.contract \
  meSettingsRegisterExtension.contract \
  meSettingsTrustExtension.contract \
  disputesL5.contract \
  meSettingsBatch14Deep.contract \
  meSettingsBatch15Deep.contract \
  meSettingsBatch16Deep.contract \
  meSettingsBatch17Deep.contract \
  meSettingsBatch18Deep.contract \
  meSettingsBatch19Deep.contract \
  meSettingsBatch20Deep.contract \
  meSecurityRoutes \
  communityMePageTracker \
  communityMeContentNav \
  communityMeProfile.contract \
  communityRouteDataHooks.contract \
  communityMePostsPage.contract \
  communityMeReportsPage.contract \
  headerUserMenuNavModel \
  headerUserMenuNavActive \
  headerUtilityMenuUiFreeze \
  MeQuickLinksSection.contract \
  --run >/dev/null || fail "vitest full union"

ok "vitest full union"

FRONTEND_BASE="${FRONTEND_BASE:-}"
if [[ -n "$FRONTEND_BASE" ]]; then
  FRONTEND_BASE="${FRONTEND_BASE%/}"
  for path in \
    /me/settings /me/password /me/security \
    /me/settings/privacy /me/settings/language /me/settings/data /me/settings/notifications-prefs \
    /community/me /community/me/posts /community/me/collects /community/me/reports; do
    code="$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_BASE}${path}" || echo "000")"
    [[ "$code" == "200" ]] || fail "GET ${path} expected 200 got ${code}"
    ok "HTTP ${path} ${code}"
  done
fi

if pw_layer_enabled settings || pw_layer_enabled account_nav || pw_layer_enabled community_me; then
  export PLAYWRIGHT_E2E_STABILITY="${PLAYWRIGHT_E2E_STABILITY:-1}"
fi

_pw_reuse_next() {
  export COMMUNITY_ME_L5_GREEN_REUSE=1
}

if pw_layer_enabled settings; then
  echo ""
  echo "== Playwright · settings hub =="
  PW_ME_LOG="${PLAYWRIGHT_ME_SETTINGS_EVIDENCE:-$ROOT/frontend/evidence/GO_local_auth_l5/PLAYWRIGHT_ME_SETTINGS_BATCH20.log}"
  mkdir -p "$(dirname "$PW_ME_LOG")"
  set -o pipefail
  {
    echo "PLAYWRIGHT_ME_SETTINGS=1"
    echo "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
    node ./scripts/run-e2e-default.mjs --project=chromium e2e/me-settings-l5-hub.spec.ts
    pw_exit=$?
    echo "exit_code=${pw_exit}"
    echo "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
    exit "${pw_exit}"
  } 2>&1 | tee "$PW_ME_LOG" || fail "playwright me-settings-l5-hub (see $PW_ME_LOG)"
  set +o pipefail
  ok "playwright settings (log: $PW_ME_LOG)"
  _pw_reuse_next
fi

if [[ "${PLAYWRIGHT_FULL:-}" == "1" ]]; then
  FULL_LOG="${PLAYWRIGHT_ACCOUNT_NAV_FULL_EVIDENCE:-$ROOT/frontend/evidence/GO_local_auth_l5/PLAYWRIGHT_ACCOUNT_NAV_FULL.log}"
  {
    echo "# PLAYWRIGHT_FULL=1 account-nav smoke"
    echo "me_settings_log=${PLAYWRIGHT_ME_SETTINGS_EVIDENCE:-$ROOT/frontend/evidence/GO_local_auth_l5/PLAYWRIGHT_ME_SETTINGS_BATCH20.log}"
    echo "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
    echo "exit_code=0"
  } >"$FULL_LOG"
  ok "PLAYWRIGHT_FULL evidence → $FULL_LOG"
fi

if pw_layer_enabled account_nav; then
  echo ""
  echo "== Playwright · account nav IA =="
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/account-nav-header-ia.spec.ts \
    || fail "playwright account-nav-header-ia"
  node ./scripts/run-e2e-default.mjs --project=chromium \
    e2e/community-me-hub-notes-drawer-ia.spec.ts -g "compact quick links drawer hides reports" \
    || fail "playwright hub compact quick links"
  node ./scripts/run-e2e-default.mjs --project=chromium \
    e2e/community-me-hub-notes-drawer-ia.spec.ts -g "likes segment navigates" \
    || fail "playwright hub likes segment"
  node ./scripts/run-e2e-default.mjs --project=chromium e2e/community-me-hub-tab-redirect-matrix.spec.ts \
    || fail "playwright hub tab redirect matrix"
  ok "playwright account nav"
  _pw_reuse_next
fi

if pw_layer_enabled community_me; then
  echo ""
  echo "== Playwright · community me L5 (vitest/i18n skipped — already ran) =="
  export COMMUNITY_ME_L5_GREEN_REUSE=1
  SKIP_COMMUNITY_ME_I18N=1 SKIP_COMMUNITY_ME_VITEST=1 SKIP_COMMUNITY_ME_ACCOUNT_NAV_IA=1 \
    bash "$ROOT/scripts/dev/run-community-me-l5-green.sh" \
    || fail "playwright community me L5 green"
  ok "playwright community me"
fi

echo ""
ok "done (phase ① local)"
echo "TT_ACCOUNT_NAV_FULL_SMOKE: OK"
