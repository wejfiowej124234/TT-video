#!/usr/bin/env bash
# Business Expansion Enterprise Gap Audit (167)
# 五域 · P0 企业级标准探针 · 不含 UI/UX/页面验收
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
p0_hold=0

verdict() {
  local id="$1" std="$2"
  echo "  $id enterprise: $std"
  if [[ "$std" != "MET" ]]; then p0_hold=1; fi
}

echo "== Business Expansion Enterprise Gap Audit =="

echo "-- P0 · BE-FRD-01 fraud-scan --"
if rg -q 'fraud-scan|fraud_scan' "$ROOT/crates/api/src/routes/internal/growth.rs" 2>/dev/null; then
  if rg -q 'run_growth_fraud_scan_best_effort' "$ROOT/crates/api/src/chain_off/auth.rs" 2>/dev/null; then
    verdict "BE-FRD-01" "MET"
  else
    verdict "BE-FRD-01" "PARTIAL"
    echo "       gap: fraud-scan route exists; register hook missing"
  fi
else
  verdict "BE-FRD-01" "NOT_MET"
  echo "       gap: POST /internal/growth/fraud-scan absent (102 §10.4 · 133 §8)"
fi
rg -q 'referral_hourly_rate_limit' "$ROOT/crates/api/src/db/growth_referral.rs" && echo "OK   hourly bind limit (partial defense)" || { echo "FAIL hourly bind"; fail=1; }

echo "-- P0 · BE-RS-01 RegionShare reconcile --"
if test -f "$ROOT/scripts/dev/region-share-reconcile-audit.py" || test -f "$ROOT/scripts/ops/region-share-reconcile.sh"; then
  verdict "BE-RS-01" "MET"
else
  if rg -q 'region_vault_forwarded' "$ROOT/crates/api/src/routes/admin/mod.rs" 2>/dev/null; then
    verdict "BE-RS-01" "PARTIAL"
    echo "       gap: indexer projection exists; automated RegionShare reconcile job missing"
  else
    verdict "BE-RS-01" "NOT_MET"
  fi
fi

echo "-- P0 · BE-DAO-01 governance UAT --"
if test -f "$ROOT/scripts/ops/b417-run-onchain-evidence.sh" \
  && test -f "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" \
  && test -f "$ROOT/scripts/ops/b417-sepolia-preflight.sh"; then
  if bash "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" "$ROOT/evidence/b417_governance_execution_runs/run_20260417T0810Z" >/dev/null 2>&1; then
    verdict "BE-DAO-01" "MET"
  else
    verdict "BE-DAO-01" "PARTIAL"
    echo "       gap: B-417 scripts restored; historical evidence verify pending"
  fi
elif test -f "$ROOT/evidence/b417_governance_execution_runs/README.md" && test -f "$ROOT/docs/verification-evidence/governor-timelock-queue-execute-evidence.md"; then
  if bash "$ROOT/scripts/ops/b417-env-gap-check.sh" >/dev/null 2>&1; then
    verdict "BE-DAO-01" "PARTIAL"
    echo "       gap: Foundry/B-417 harness OK; Sepolia live queue→execute UAT pack not enterprise-closed"
  else
    verdict "BE-DAO-01" "PARTIAL"
  fi
else
  verdict "BE-DAO-01" "NOT_MET"
fi

echo "-- P0 · BE-GCM-01 country go-live --"
if test -f "$ROOT/docs/runbook/COUNTRY-MARKET-GO-LIVE-PLAYBOOK.v1.md" && test -f "$ROOT/crates/api/src/routes/admin/admin_country_market_http.rs"; then
  verdict "BE-GCM-01" "MET"
else
  verdict "BE-GCM-01" "NOT_MET"
  echo "       gap: no standardized per-country go-live checklist/playbook or launch API"
fi
test -f "$ROOT/docs/handbook/engineering/140-C-S5-Catalog-Server-Geo-Validation-Operations-Report.md" && echo "OK   C-S5 geo validation baseline" || { echo "FAIL C-S5"; fail=1; }

test -f "$ROOT/evidence/business_expansion/enterprise_gap_matrix.v1.json" && echo "OK   enterprise gap matrix" || { echo "FAIL matrix"; fail=1; }
test -f "$ROOT/docs/handbook/engineering/167-Business-Expansion-Enterprise-Gap-Audit-Report.md" && echo "OK   167 report" || { echo "FAIL report"; fail=1; }

echo ""
if [[ "$fail" -eq 0 && "$p0_hold" -eq 1 ]]; then
  echo "TT_BUSINESS_EXPANSION_ENTERPRISE: GAP_AUDIT_COMPLETE p0_enterprise=HOLD (expected until P0 delivery)"
  exit 0
fi
[[ "$fail" -eq 0 ]] && echo "TT_BUSINESS_EXPANSION_ENTERPRISE: GAP_AUDIT_COMPLETE" || { echo "TT_BUSINESS_EXPANSION_ENTERPRISE: PROBE_FAIL"; exit 2; }
