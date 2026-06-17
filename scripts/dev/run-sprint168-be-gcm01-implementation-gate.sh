#!/usr/bin/env bash
# BE-GCM-01 · country market implementation gate (Sprint 168-B)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
ISO="${1:-CN}"

echo "== Sprint 168-B BE-GCM-01 Implementation Gate (iso=$ISO) =="

test -f "$ROOT/crates/api/src/db/country_market_launch_ops.rs" && echo "OK   country_market_launch_ops" || { echo "FAIL ops"; fail=1; }
test -f "$ROOT/docs/runbook/COUNTRY-MARKET-GO-LIVE-PLAYBOOK.v1.md" && echo "OK   playbook v1" || { echo "FAIL playbook"; fail=1; }
rg -q 'country_market_gate_blocked' "$ROOT/crates/api/src/routes/admin/admin_content_http.rs" && echo "OK   publish gate" || { echo "FAIL publish gate"; fail=1; }
test -f "$ROOT/frontend/app/admin/content/country-market/page.tsx" && echo "OK   admin page" || { echo "FAIL admin page"; fail=1; }
test -f "$ROOT/evidence/country_market/$ISO/walkthrough.json" && echo "OK   $ISO walkthrough" || { echo "FAIL $ISO walkthrough"; fail=1; }

cd "$ROOT"
cargo test -p traveltrust-api country_market_launch_ops::tests -- --nocapture >/dev/null && echo "OK   cargo unit tests" || { echo "FAIL cargo tests"; fail=1; }

cd "$ROOT/frontend"
npx vitest run app/admin/content/country-market/adminCountryMarket.contract.test.ts --silent 2>/dev/null && echo "OK   country-market contract" || { echo "FAIL contract"; fail=1; }

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "BE_GCM_01_GO"
  exit 0
fi
echo "BE_GCM_01_HOLD"
exit 2
