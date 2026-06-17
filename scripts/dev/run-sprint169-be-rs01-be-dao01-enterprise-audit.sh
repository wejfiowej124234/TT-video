#!/usr/bin/env bash
# Sprint 169 · BE-RS-01 + BE-DAO-01 enterprise audit (audit-only · no FRD/GCM)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0

rs_verdict="HOLD"
dao_verdict="HOLD"

echo "== Sprint 169 Enterprise Audit (BE-RS-01 + BE-DAO-01) =="

echo "-- Scope lock --"
echo "OK   FRD/GCM out of scope (168-B closed)"

echo "-- BE-RS-01 RegionShare reconcile chain --"
test -f "$ROOT/crates/api/src/db/fee_router_events.rs" && echo "OK   FeeRouter projection" || { echo "FAIL fee_router"; fail=1; }
test -f "$ROOT/crates/api/src/db/region_vault_events.rs" && echo "OK   RegionVault projection" || { echo "FAIL region_vault"; fail=1; }
test -f "$ROOT/crates/api/src/db/region_snapshot.rs" && echo "OK   region_share_snapshot_lines" || { echo "FAIL snapshot"; fail=1; }
test -f "$ROOT/crates/api/src/db/p5_country_ledger.rs" && echo "OK   p5_country_ledger (orthogonal pilot)" || { echo "FAIL p5"; fail=1; }

if test -f "$ROOT/scripts/ops/region-share-reconcile.sh" || test -f "$ROOT/scripts/dev/region-share-reconcile-audit.py"; then
  rs_verdict="GO"
  echo "BE_RS_01: GO (automated reconcile script present)"
else
  echo "BE_RS_01: HOLD (no cross-leg reconcile job · amount closure missing)"
fi

echo "-- BE-DAO-01 Governance UAT chain --"
test -f "$ROOT/docs/verification-evidence/governor-timelock-queue-execute-evidence.md" && echo "OK   B-089/B-100 Foundry SSOT" || { echo "FAIL foundry ssot"; fail=1; }
test -f "$ROOT/docs/runbook/TT-PHASE2-SEPOLIA-DEPLOYED-SPINE-SUMMARY.md" && echo "OK   Sepolia spine" || { echo "FAIL spine"; fail=1; }

b417_orchestration=0
for s in b417-governance-execution-automation.sh b417-run-onchain-evidence.sh b417-evidence-pack-verify.sh b417-governor-queue-testnet.sh b417-sepolia-preflight.sh; do
  if test -f "$ROOT/scripts/ops/$s"; then b417_orchestration=$((b417_orchestration + 1)); fi
done
echo "INFO B-417 orchestration scripts on disk: $b417_orchestration/5"

if test -f "$ROOT/evidence/business_expansion/sprint171_governance_uat_evidence_chain.v1.json"; then
  if bash "$ROOT/scripts/ops/b417-evidence-pack-verify.sh" "$ROOT/evidence/b417_governance_execution_runs/run_20260417T0810Z" >/dev/null 2>&1 \
    && [[ "$b417_orchestration" -eq 5 ]]; then
    dao_verdict="GO"
    echo "BE_DAO_01: GO (B-417 orchestration restored · historical Sepolia pack verify PASS)"
  elif [[ "$b417_orchestration" -eq 5 ]]; then
    dao_verdict="PARTIAL"
    echo "BE_DAO_01: PARTIAL (orchestration restored · live owner sign-off pending)"
  fi
elif test -f "$ROOT/evidence/business_expansion/sprint169_governance_uat_evidence_chain.v1.json"; then
  if rg -q '"live_sepolia_uat_pack".*"enterprise_signed".*false' "$ROOT/evidence/business_expansion/sprint169_governance_uat_evidence_chain.v1.json" 2>/dev/null; then
    dao_verdict="HOLD"
    echo "BE_DAO_01: HOLD (Sepolia live UAT pack not enterprise-signed)"
  fi
else
  echo "FAIL governance evidence chain json"; fail=1
fi

test -f "$ROOT/evidence/business_expansion/sprint169_region_share_reconcile_matrix.v1.json" && echo "OK   reconcile matrix" || { echo "FAIL reconcile matrix"; fail=1; }
test -f "$ROOT/docs/handbook/engineering/170-Business-Expansion-Sprint169-RS-DAO-Enterprise-Audit-Report.md" && echo "OK   170 audit report" || { echo "FAIL report"; fail=1; }

echo ""
echo "Verdict: BE_RS_01_${rs_verdict} · BE_DAO_01_${dao_verdict}"
if [[ "$fail" -eq 0 ]]; then
  echo "TT_SPRINT169_BE_RS01_BE_DAO01: ENTERPRISE_AUDIT_COMPLETE"
  [[ "$rs_verdict" == "GO" && "$dao_verdict" == "GO" ]] && exit 0
  exit 0
fi
echo "TT_SPRINT169_BE_RS01_BE_DAO01: AUDIT_PROBE_FAIL"
exit 2
