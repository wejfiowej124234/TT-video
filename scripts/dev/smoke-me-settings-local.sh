#!/usr/bin/env bash
# ① 本地 · /me/settings Hub + /me/password L5 机读烟测（无需 API / Docker）
# 机读闸：evidence/GO_local_auth_l5/me-settings-l5-local-gate.v1.json
# 账户导航 JSON 闸：evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json
# 全站账户导航：scripts/dev/smoke-account-nav-local.sh · 全量：scripts/dev/smoke-account-nav-full-local.sh
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-me-settings-local.sh
#
# 可选：若前端 dev 已起，追加 HTTP 探活 FRONTEND_BASE=http://127.0.0.1:3012
# 可选 Playwright（需 API + Next）：PLAYWRIGHT_ME_SETTINGS=1 bash scripts/dev/smoke-me-settings-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

fail() { echo "smoke-me-settings: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-me-settings: OK $*"; }

npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"
ok "i18n gate"

npm run test -- \
  meSettingsL5LocalGate \
  meSettingsL5 \
  meSettingsProfileL5 \
  meSettingsPageI18nKeys \
  mePasswordPageI18nKeys \
  meSecurityPage.contract \
  meSettingsLanguage.contract \
  meSettingsHubStatus.contract \
  meSecurityRoutes \
  meSettingsNavEnrich.contract \
  meSettingsHubSection.contract \
  meSettingsFamily.contract \
  meSettingsHubFlash.contract \
  meSettingsExtensionPlaywrightCoverage.contract \
  meSettingsBatch12Deep.contract \
  meSettingsBatch13Deep.contract \
  meSettingsBatch14Deep.contract \
  meSettingsBatch15Deep.contract \
  meSettingsBatch16Deep.contract \
  meSettingsBatch17Deep.contract \
  meSettingsBatch18Deep.contract \
  meSettingsBatch19Deep.contract \
  meSettingsBatch20Deep.contract \
  meSettingsFamilyFullScore.contract \
  meSettingsNotificationPrefs.contract \
  meSettingsVerifyEmail.contract \
  meSettingsFeedbackExtension.contract \
  meSettingsHelpExtension.contract \
  meSettingsLegalExtension.contract \
  meSettingsRegisterExtension.contract \
  meSettingsTrustExtension.contract \
  disputesL5.contract \
  meSettingsPageTracker.contract \
  MeQuickLinksSection.contract \
  headerUserMenuNavModel \
  headerUserMenuNavActive \
  headerUtilityMenuUiFreeze \
  accountNavNamingP3 \
  --run >/dev/null || fail "vitest me settings green set"

ok "vitest green set"

if [[ "${PLAYWRIGHT_ME_SETTINGS:-}" == "1" ]]; then
  if [[ -z "${PLAYWRIGHT_E2E_STABILITY:-}" ]]; then
    export PLAYWRIGHT_E2E_STABILITY=1
  fi
  API_PORT="${PLAYWRIGHT_API_PORT:-8080}"
  API_HEALTH="${PLAYWRIGHT_API_HEALTH_URL:-http://127.0.0.1:${API_PORT}/health}"
  if curl -sf "$API_HEALTH" >/dev/null 2>&1; then
    export PLAYWRIGHT_REUSE_API_SERVER="${PLAYWRIGHT_REUSE_API_SERVER:-1}"
    ok "API health OK — reuse server (${API_HEALTH})"
  else
    echo "smoke-me-settings: API not yet up at ${API_HEALTH}; Playwright webServer will start API (needs DATABASE_URL)" >&2
  fi
  PW_EVIDENCE="${PLAYWRIGHT_ME_SETTINGS_EVIDENCE:-$ROOT/frontend/evidence/GO_local_auth_l5/PLAYWRIGHT_ME_SETTINGS_BATCH20.log}"
  mkdir -p "$(dirname "$PW_EVIDENCE")"
  set -o pipefail
  {
    echo "PLAYWRIGHT_ME_SETTINGS=1"
    echo "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
    node ./scripts/run-e2e-default.mjs --project=chromium e2e/me-settings-l5-hub.spec.ts e2e/me-settings-profile-l5.spec.ts
    pw_exit=$?
    echo "exit_code=${pw_exit}"
    echo "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date)"
    exit "${pw_exit}"
  } 2>&1 | tee "$PW_EVIDENCE" || fail "playwright me-settings-l5-hub (see $PW_EVIDENCE)"
  set +o pipefail
  ok "playwright me-settings-l5-hub (log: $PW_EVIDENCE)"
fi

FRONTEND_BASE="${FRONTEND_BASE:-}"
if [[ -n "$FRONTEND_BASE" ]]; then
  FRONTEND_BASE="${FRONTEND_BASE%/}"
  for path in \
    /me/settings \
    /me/settings/profile \
    /me/password \
    /me/security \
    /me/settings/privacy \
    /me/settings/language \
    /me/settings/data \
    /me/settings/notifications-prefs \
    /me/settings/trust \
    /help \
    /trust \
    /disputes \
    /privacy \
    /terms \
    /community/feedback; do
    code="$(curl -s -o /dev/null -w "%{http_code}" "${FRONTEND_BASE}${path}" || echo "000")"
    [[ "$code" == "200" ]] || fail "GET ${path} expected 200 got ${code}"
    ok "HTTP ${path} ${code}"
  done
fi

ok "done (phase ① local)"
