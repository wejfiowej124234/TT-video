#!/usr/bin/env bash
# Cert #2 machine gates — IA vitest union + API slot isolation (no i18n gate · ① local)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-cert2-multi-identity-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert2-multi-identity-machine: OK $*"; }

cd "$ROOT/frontend"
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
  --run >/dev/null || fail "vitest IA union"
ok "vitest IA union"

cd "$ROOT"
if [[ "${CERT2_SKIP_API:-}" != "1" ]]; then
  bash "$ROOT/scripts/dev/smoke-multi-identity-closure-local.sh" || fail "api multi-identity closure"
  ok "api multi-identity closure"
else
  ok "api multi-identity closure SKIPPED (CERT2_SKIP_API=1)"
fi

echo "TT_CERT2_MULTI_IDENTITY_MACHINE: OK"
