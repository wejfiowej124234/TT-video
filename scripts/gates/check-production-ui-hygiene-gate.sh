#!/usr/bin/env bash
# Wave A · Production UI hygiene — mock/dev surfaces must not ship enabled on production builds.
#
#   bash scripts/gates/check-production-ui-hygiene-gate.sh
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

fail() {
  echo "check-production-ui-hygiene-gate: FAIL $*" >&2
  exit 2
}

STAGING_DOCKER="$ROOT/frontend/Dockerfile.fly-staging"
[[ -f "$STAGING_DOCKER" ]] || fail "missing $STAGING_DOCKER"

if ! grep -q 'NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=0' "$STAGING_DOCKER"; then
  fail "staging/prod Dockerfile must set NEXT_PUBLIC_TRAVELTRUST_ALLOW_CHAIN_OFF_MOCK_PAY_UI=0"
fi

GATEWAY="$ROOT/frontend/components/traveltrust/cinematic/TravelTrustStablecoinGateway.tsx"
grep -q 'allowChainOffMockPayUi' "$GATEWAY" || fail "TravelTrustStablecoinGateway must gate mock swap with allowChainOffMockPayUi"
grep -q 'showMockSwapUi ? { "data-tt-traveltrust-ttg-mock-swap-v1"' "$GATEWAY" \
  || fail "mock-swap data attribute must be conditional on showMockSwapUi"

HEADER="$ROOT/frontend/components/header/HeaderUserMenu.tsx"
grep -q 'publicChromeDisplayName' "$HEADER" || fail "HeaderUserMenu must sanitize test personas via publicChromeDisplayName"

SPACING="$ROOT/frontend/lib/traveltrustSpacingDebug.ts"
grep -q 'allowTravelTrustSpacingDebugChrome' "$SPACING" \
  || fail "traveltrustSpacingDebug must gate via allowTravelTrustSpacingDebugChrome"
grep -q 'isTravelTrustSpacingDebugDevHost()' "$SPACING" \
  && grep -q 'shouldMountTravelTrustSpacingDebug' "$SPACING" \
  || fail "traveltrustSpacingDebug mount helper missing"
if grep -q 'if (isTravelTrustSpacingDebugDevHost()) return true' "$SPACING"; then
  fail "spacing debug must not auto-mount on NODE_ENV=development alone"
fi

FOOTER="$ROOT/frontend/components/landing/LandingFooter.tsx"
grep -q 'footer_link_trust_center' "$FOOTER" || fail "LandingFooter must use consumer trust links"
grep -q 'traveltrust_link_feeRouter' "$FOOTER" && fail "LandingFooter must not expose FeeRouter self-check"
grep -q 'footer_link_governance_fee_routes' "$FOOTER" && fail "LandingFooter must not expose operator fee-routes link"

HELP="$ROOT/frontend/app/help/page.tsx"
for loc in zh.ts en.ts; do
  grep -q 'ui_link_nav_arrow_suffix:' "$ROOT/frontend/locales/$loc" || fail "missing ui_link_nav_arrow_suffix in locales/$loc"
done

cd "$ROOT/frontend" && npx vitest run \
  lib/travelTrustUiGuards.test.ts \
  lib/traveltrustSpacingDebug.test.ts \
  lib/publicChromeHygiene.test.ts \
  app/help/helpPage.i18n.contract.test.ts \
  app/traveltrust/traveltrustNetworkPage.contract.test.ts \
  components/landing/LandingFooter.test.tsx \
  --reporter=dot >/dev/null || fail "production UI hygiene vitest failed"

echo "check-production-ui-hygiene-gate: PASS PRODUCTION_UI_HYGIENE_WAVE_A"
