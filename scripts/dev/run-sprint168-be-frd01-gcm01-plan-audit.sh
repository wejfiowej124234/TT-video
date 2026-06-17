#!/usr/bin/env bash
# Sprint 168 · BE-FRD-01 + BE-GCM-01 plan completeness gate (implementation plan phase)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { local name="$1"; shift; if "$@"; then echo "OK   $name"; else echo "FAIL $name"; fail=1; fi; }

echo "== Sprint 168 Plan Audit (BE-FRD-01 + BE-GCM-01) =="

check "168 blueprint" test -f "$ROOT/docs/handbook/engineering/168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md"
check "fraud-engine-v1.yaml" test -f "$ROOT/docs/handbook/engineering/artifacts/fraud-engine-v1.yaml"
check "country playbook v1" test -f "$ROOT/docs/runbook/COUNTRY-MARKET-GO-LIVE-PLAYBOOK.v1.md"
check "acceptance matrix" test -f "$ROOT/evidence/business_expansion/sprint168_acceptance_matrix.v1.json"
check "evidence template" test -f "$ROOT/evidence/country_market/_TEMPLATE/README.md"
check "167 baseline" test -f "$ROOT/docs/handbook/engineering/167-Business-Expansion-Enterprise-Gap-Audit-Report.md"

rg -q 'growth_fraud_scan_runs' "$ROOT/docs/handbook/engineering/168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md" && echo "OK   FRD data model in 168" || { echo "FAIL FRD data model"; fail=1; }
rg -q 'country_market_launches' "$ROOT/docs/handbook/engineering/168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md" && echo "OK   GCM data model in 168" || { echo "FAIL GCM data model"; fail=1; }
rg -q 'ROI' "$ROOT/docs/handbook/engineering/168-Business-Expansion-Sprint168-BE-FRD01-BE-GCM01-Blueprint.md" && echo "OK   ROI section" || { echo "FAIL ROI"; fail=1; }

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_SPRINT168_BE_FRD01_GCM01: PLAN_COMPLETE"
  exit 0
fi
echo "TT_SPRINT168_BE_FRD01_GCM01: PLAN_INCOMPLETE"
exit 2
