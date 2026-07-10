#!/usr/bin/env bash
# ① TravelTrust PH-1 homepage local gate (vitest default · optional e2e/lighthouse)
# SSOT: docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT/frontend"

echo "==> [traveltrust-ph1-homepage-local] vitest contracts (default ① path)"
npx vitest run \
  lib/traveltrustPh1LocalGate.contract.test.ts \
  app/traveltrust/traveltrustNetworkPage.contract.test.ts \
  app/traveltrust/traveltrustSeo.contract.test.ts \
  lib/traveltrustAnnouncementLaneGovernance.contract.test.ts \
  --reporter=dot

if [[ "${TRAVELTRUST_PH1_E2E:-0}" == "1" ]]; then
  echo "==> TRAVELTRUST_PH1_E2E=1 · npm run e2e:pi1-traveltrust (home-landing-shell.spec.ts)"
  npm run e2e:pi1-traveltrust
fi

if [[ "${TRAVELTRUST_PH1_E2E_FULL:-0}" == "1" ]]; then
  echo "==> TRAVELTRUST_PH1_E2E_FULL=1 · full pi1 acceptance"
  TRAVELTRUST_PH1_E2E=1 npm run e2e:pi1-traveltrust
fi

if [[ "${TRAVELTRUST_PH1_VISUAL:-0}" == "1" ]]; then
  echo "==> TRAVELTRUST_PH1_VISUAL=1 · e2e:traveltrust-visual"
  npm run e2e:traveltrust-visual
fi

if [[ "${TRAVELTRUST_PH1_VERIFY_SCREENSHOTS:-0}" == "1" ]]; then
  echo "==> TRAVELTRUST_PH1_VERIFY_SCREENSHOTS=1 · traveltrust-ph1-verify-screenshots.spec.ts"
  npx playwright test e2e/traveltrust-ph1-verify-screenshots.spec.ts
fi

if [[ "${TRAVELTRUST_PH1_LIGHTHOUSE:-0}" == "1" ]]; then
  echo "==> TRAVELTRUST_PH1_LIGHTHOUSE=1 · lighthouse:traveltrust"
  npm run lighthouse:traveltrust
fi

echo ""
echo "TT_TRAVELTRUST_PH1_HOMEPAGE_LOCAL: OK phase=local-1 evidence=GO_local_traveltrust_ph1"
