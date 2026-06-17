#!/usr/bin/env bash
# ① 本地 · 多重身份 IA 收口机读烟测（Hub + 账户导航 + onboarding 深链）
#
# 用法（仓库根）：
#   bash scripts/dev/smoke-multi-identity-ia-closure-local.sh
# 可选 E2E（需 API + dev）：
#   PLAYWRIGHT_MULTI_IDENTITY_IA=1 bash scripts/dev/smoke-multi-identity-ia-closure-local.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

fail() { echo "smoke-multi-identity-ia: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-multi-identity-ia: OK $*"; }

npm run test:i18n:ci >/dev/null || fail "test:i18n:ci"
ok "i18n gate"

npm run test -- \
  meIdentitiesIaClosure \
  meIdentitiesPage \
  meIdentitiesUiFreeze \
  meIdentitiesL5FullScore \
  meIdentitySlotVisibility \
  meIdentitiesProfileLinksModel \
  meIdentitiesProfileLinkVisuals \
  stewardAdmissionNav \
  meOnboardingPage \
  accountNavNamingP3 \
  --run >/dev/null || fail "vitest IA closure union"

ok "vitest union"

cd "$ROOT"
bash scripts/dev/smoke-account-nav-local.sh >/dev/null || fail "smoke-account-nav-local"
ok "account-nav smoke"

bash scripts/dev/smoke-steward-workbench-l5-local.sh >/dev/null || fail "smoke-steward-workbench-l5-local"
ok "steward workbench smoke"

if [[ "${PLAYWRIGHT_MULTI_IDENTITY_IA:-}" == "1" ]]; then
  cd "$ROOT/frontend"
  if [[ -z "${PLAYWRIGHT_E2E_STABILITY:-}" ]]; then
    export PLAYWRIGHT_E2E_STABILITY=1
  fi
  PLAYWRIGHT_FULL_STACK=1 node ./scripts/run-e2e-default.mjs --project=chromium \
    e2e/me-identities-core-hub.spec.ts || fail "playwright me-identities-core-hub"
  ok "playwright me-identities-core-hub"
fi

echo "TT_MULTI_IDENTITY_IA_CLOSURE_SMOKE: OK phase=①"
ok "done (phase ① local · Multi-Identity IA Closure)"
