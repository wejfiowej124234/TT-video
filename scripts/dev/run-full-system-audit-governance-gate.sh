#!/usr/bin/env bash
# TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST v1.3 · §12 D61–D76 + DX-01
#
#   bash scripts/dev/run-full-system-audit-governance-gate.sh
#
# Success grep: TT_FULL_SYSTEM_AUDIT_GOVERNANCE: OK
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §12.0
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0

run_step() {
  local label="$1"
  shift
  echo "== $label =="
  if "$@"; then
    echo "OK   $label"
  else
    echo "FAIL $label"
    fail=1
  fi
}

echo "== TT Full System Audit · Governance §12 (D61–D76 + DX-01) =="

# D61 Release ownership
run_step "D61 SOLO-MAINTAINER index" \
  test -f "$ROOT/frontend/evidence/GO_local_phase1/SOLO-MAINTAINER-SIGNATURE-INDEX.md"
run_step "D61 sealed-programs index" \
  test -f "$ROOT/docs/runbook/sealed-programs-and-epics-master-index.md"

# D62 Change management
run_step "D62 CONTRIBUTING pre-push section" \
  rg -q 'pre-push-local' "$ROOT/CONTRIBUTING.md"
run_step "D62 R-002 spec" \
  test -f "$ROOT/docs/spec/R-002-回归执行闭环与发布准入.md"

# D63 Rollback
run_step "D63 fly rollback drill script" \
  test -f "$ROOT/scripts/dev/run-phase3-fly-release-rollback-drill.sh"
run_step "D63 db restore drill script" \
  test -f "$ROOT/scripts/dev/run-phase3-db-restore-drill-prod.sh"

# D64 Incident response
run_step "D64 ops RUNBOOK trigger table" \
  rg -q 'Runbook 触发阈值表' "$ROOT/ops/RUNBOOK.md"
run_step "D64 admin incidents route" \
  test -d "$ROOT/frontend/app/admin/alerts/incidents"

# D65 Monitoring
run_step "D65 observability admin route" \
  test -f "$ROOT/frontend/app/admin/observability/page.tsx" \
  || test -f "$ROOT/frontend/app/admin/observability/AdminObservabilityMain.tsx"

# D66 Kill switch
run_step "D66 onboarding kill switch doc" \
  rg -q 'ONBOARDING_PAYMENT_INTENTS_DISABLED' "$ROOT/docs/spec/96-18-商家与主理人准入费用与治理币兑换设计.md"

# D67 Feature flags
run_step "D67 admin flags API in 04" \
  rg -q 'admin/flags' "$ROOT/docs/spec"/04*.md
if [[ -f "$ROOT/scripts/ops/feature_flag_gate_workflow_digest.py" ]]; then
  run_step "D67 feature_flag_gate digest" \
    python "$ROOT/scripts/ops/feature_flag_gate_workflow_digest.py" verify
else
  echo "SKIP D67 digest (script missing)"
fi

# D68 Release evidence
run_step "D68 evidence README" test -f "$ROOT/evidence/README.md"
run_step "D68 PRODUCTION-GO package" \
  test -f "$ROOT/docs/runbook/PRODUCTION-GO-DECISION-PACKAGE.md"

# D69 Operational runbook
run_step "D69 RUNBOOK indexer section" \
  rg -q '2\.55' "$ROOT/ops/RUNBOOK.md"

# D70 Executive GO
run_step "D70 go-live checklist" test -f "$ROOT/docs/go-live-checklist.md"

# DX-01 Developer experience
run_step "DX-01 TT-9618 runbook" test -f "$ROOT/docs/runbook/TT-9618-onboarding-local-testnet.md"
run_step "DX-01 start-api-with-seed README" test -f "$ROOT/scripts/dev/start-api-with-seed-README.md"
run_step "DX-01 dev-preflight" test -f "$ROOT/scripts/dev-preflight.sh"

# D71 Architecture drift
run_step "D71 TT-9622 bounded contexts" \
  test -f "$ROOT/docs/runbook/TT-9622-bounded-contexts-layering-and-integration-map.md"

# D72 Technical debt
run_step "D72 96-18 backlog" test -f "$ROOT/docs/spec/96-18-未完成清单与多维检查.md"

# D73 Data retention
run_step "D73 settings data route" test -f "$ROOT/frontend/app/me/settings/data/page.tsx"

# D74 Vendor lock-in
run_step "D74 96-03 security supply chain" test -f "$ROOT/docs/spec/96-03-安全密钥与供应链.md"

# D75 Cost & capacity
run_step "D75 e2e-stability-probe" test -f "$ROOT/scripts/gates/e2e-stability-probe.sh"
run_step "D75 prod infra audit doc" \
  test -f "$ROOT/docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md"

# D76 Business continuity
run_step "D76 PI3-001 DR check script" \
  test -f "$ROOT/scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_FULL_SYSTEM_AUDIT_GOVERNANCE: OK"
  exit 0
fi

echo "TT_FULL_SYSTEM_AUDIT_GOVERNANCE: FAIL"
exit 1
