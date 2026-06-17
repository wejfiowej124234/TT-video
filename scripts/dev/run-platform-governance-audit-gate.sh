#!/usr/bin/env bash
# Platform Governance Audit — DOMAIN-CX · BA · OPS · TRUST · ADMIN · CS
#
#   bash scripts/dev/run-platform-governance-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §21–§27
# Success: TT_PLATFORM_GOVERNANCE_AUDIT: OK
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${PGX_AUDIT_OUT:-$ROOT/evidence/platform-governance-audit/${STAMP}}"
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
echo "== Platform Governance Audit (CX+BA+OPS+TRUST+ADMIN+CS) · out=$OUT =="

# DOMAIN-CX Customer Experience
run_step "CX-01 TT-9625 golden path" test -f "$ROOT/docs/runbook/TT-9625-golden-path-system-spine.md"
run_step "CX-06 user journey audit" bash "$ROOT/scripts/dev/l5-pe-user-journey-audit.sh"
run_step "CX-14 account nav smoke" test -f "$ROOT/scripts/dev/smoke-account-nav-full-local.sh"
run_step "CX-16 cross-role matrix" \
  test -f "$ROOT/frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md"

# DOMAIN-BA Business Analytics
run_step "BA-01 conversion spine doc" test -f "$ROOT/docs/runbook/TT-9624-closed-loop-checklist.md"
run_step "BA-05 market discover SSOT" \
  test -f "$ROOT/frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md"

# DOMAIN-OPS Real Operation
run_step "OPS-01 ops RUNBOOK" test -f "$ROOT/ops/RUNBOOK.md"
run_step "OPS-03 dispute deep audit script" \
  test -f "$ROOT/scripts/dev/run-order-escrow-dispute-deep-audit.sh"
run_step "OPS-08 admin security closure" \
  test -f "$ROOT/scripts/dev/run-admin-security-closure-audit.sh"

# DOMAIN-TRUST Trust & Reputation
run_step "TRUST-01 acquisition trust rules" \
  test -f "$ROOT/docs/spec/artifacts/acquisition-publish-trust-rules.v1.md"
run_step "TRUST-05 identities freeze" \
  test -f "$ROOT/frontend/evidence/GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md"
run_step "TRUST-12 ITG deep audit script" \
  test -f "$ROOT/scripts/dev/run-identity-trust-governance-deep-audit.sh" \
  || test -f "$ROOT/scripts/identity-trust-governance-deep-audit.py"

# DOMAIN-ADMIN Administrator Governance
run_step "ADMIN-01 admin README" test -f "$ROOT/frontend/app/admin/README.md"
run_step "ADMIN-05 admin sidebar model" test -f "$ROOT/frontend/lib/admin/adminShellSidebarModel.ts"
run_step "ADMIN-09 rbac matrix smoke" \
  test -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"
run_step "ADMIN-12 admin deep audit script" \
  test -f "$ROOT/scripts/dev/run-admin-frontend-deep-audit.sh"

# DOMAIN-CS Cold Start & Network Effect
run_step "CS-01 seed README" test -f "$ROOT/scripts/dev/start-api-with-seed-README.md"
run_step "CS-04 seed script" \
  test -f "$ROOT/scripts/dev/start-api-with-seed.bat" \
  || test -f "$ROOT/scripts/dev/start-api-with-seed.sh"
run_step "CS-10 TT-9618 onboarding" test -f "$ROOT/docs/runbook/TT-9618-onboarding-local-testnet.md"
run_step "CS-15 enterprise site 10" test -f "$ROOT/scripts/dev/run-enterprise-site-10-local.sh"

python "$ROOT/scripts/dev/generate-platform-governance-registry-stub.py" "$OUT/platform-governance-registry.v1.json"
run_step "Platform governance artifacts" python "$ROOT/scripts/dev/generate-platform-governance-artifacts.py" "$OUT"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_PLATFORM_GOVERNANCE_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Verdicts: KEEP · MERGE · RETIRE · REFACTOR · UPDATE · DEPRECATE · REMOVE"
  exit 0
fi

echo "TT_PLATFORM_GOVERNANCE_AUDIT: FAIL"
exit 1
