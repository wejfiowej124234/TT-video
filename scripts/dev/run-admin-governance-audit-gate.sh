#!/usr/bin/env bash
# DOMAIN-AG · Administration & Governance Audit
#
#   bash scripts/dev/run-admin-governance-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §28
# Success: TT_ADMIN_GOVERNANCE_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${AG_AUDIT_OUT:-$ROOT/evidence/admin-governance-audit/${STAMP}}"
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

mkdir -p "$OUT"
echo "== DOMAIN-AG · Administration & Governance Audit · out=$OUT =="

# AG-01/02 subjects & roles
run_step "AG-01 admin README" test -f "$ROOT/frontend/app/admin/README.md"
run_step "AG-02 adminPermissionIds SSOT" test -f "$ROOT/frontend/lib/admin/adminPermissionIds.ts"
run_step "AG-02 rbac registry yaml" test -f "$ROOT/registry/admin-rbac-permissions.v1.yaml"

# AG-03 RBAC boundary
run_step "AG-03 rbac matrix smoke" test -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"
run_step "AG-03 admin sidebar model" test -f "$ROOT/frontend/lib/admin/adminShellSidebarModel.ts"

# AG-04 Approval
run_step "AG-04 approvals routes" test -f "$ROOT/frontend/app/admin/approvals/page.tsx"

# AG-05 Operations
run_step "AG-05 inbox/operations" \
  test -f "$ROOT/frontend/app/admin/inbox/page.tsx" \
  && test -f "$ROOT/frontend/app/admin/operator-guide/page.tsx"

# AG-06 Risk
run_step "AG-06 anti-fraud growth" test -f "$ROOT/frontend/app/admin/growth/anti-fraud/page.tsx"
run_step "AG-06 compliance admin" test -f "$ROOT/frontend/app/admin/compliance/page.tsx"

# AG-07 Governance
run_step "AG-07 governance nav" test -f "$ROOT/frontend/lib/admin/adminShellGovernanceNavLinks.ts"
run_step "AG-07 governance pages" \
  test -d "$ROOT/frontend/app/admin/governance" \
  || test -f "$ROOT/frontend/app/admin/steward-applications/page.tsx"

# AG-08 Content moderation
run_step "AG-08 community moderation" \
  test -f "$ROOT/frontend/app/admin/community/moderation/cases/page.tsx"

# AG-09 Users
run_step "AG-09 users admin" test -f "$ROOT/frontend/app/admin/users/page.tsx"

# AG-10 Orders/disputes
run_step "AG-10 orders disputes" \
  test -f "$ROOT/frontend/app/admin/orders/page.tsx" \
  && test -f "$ROOT/frontend/app/admin/disputes/page.tsx"

# AG-11 Reports
run_step "AG-11 community reports" test -f "$ROOT/frontend/app/admin/community/reports/page.tsx"

# AG-13 Early bird & incentives
run_step "AG-13 early-bird page" test -f "$ROOT/frontend/app/admin/growth/early-bird/page.tsx"
run_step "AG-14 referral codes" test -f "$ROOT/frontend/app/admin/growth/referral-codes/page.tsx"

# AG-16 Audit logs
run_step "AG-16 audit logs" test -f "$ROOT/frontend/app/admin/audit/page.tsx"

# AG-17/18 Security
run_step "AG-17 admin security closure script" \
  test -f "$ROOT/scripts/dev/run-admin-security-closure-audit.sh"
run_step "AG-18 admin deep audit script" \
  test -f "$ROOT/scripts/dev/run-admin-frontend-deep-audit.sh"

# AG-19 L5 UX / mobile
run_step "AG-19 mobile admin audit" bash "$ROOT/scripts/dev/l5-pe-mobile-responsive-audit.sh"
run_step "AG-19 PF-08 deep audit inventory" \
  test -f "$ROOT/scripts/dev/inventory_admin_deep_audit.py"

# Cross PF/DOA
run_step "AG cross DOA-15 rbac smoke path" \
  test -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"

python "$ROOT/scripts/dev/generate-admin-governance-registry-stub.py" "$OUT/admin-governance-registry.v1.json"
run_step "AG artifacts bundle" python "$ROOT/scripts/dev/generate-admin-governance-artifacts.py" "$OUT"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_ADMIN_GOVERNANCE_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Verdicts: KEEP · MERGE · RETIRE · REFACTOR · UPDATE · DEPRECATE · REMOVE"
  exit 0
fi

echo "TT_ADMIN_GOVERNANCE_AUDIT: FAIL"
exit 1
