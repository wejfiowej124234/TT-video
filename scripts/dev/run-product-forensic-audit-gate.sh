#!/usr/bin/env bash
# DOMAIN-X · PRODUCT FORENSIC AUDIT · PF-01～PF-20 bootstrap gate
#
#   bash scripts/dev/run-product-forensic-audit-gate.sh
#
# SSOT: docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md §13 (DOMAIN-X)
# Success: TT_PRODUCT_FORENSIC_AUDIT: OK
# Note: Most PF dims require human forensic review; this gate proves tooling + SSOT paths exist.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(python -c "from datetime import datetime,timezone; print(datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))")"
OUT="${PF_AUDIT_OUT:-$ROOT/evidence/product-forensic-audit/${STAMP}}"
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
echo "== DOMAIN-X · PRODUCT FORENSIC AUDIT gate · out=$OUT =="

# PF-01 route ownership (machine baseline)
if [[ "${SKIP_PF_ROUTES:-}" != "1" ]]; then
  run_step "PF-01 run-check-04-routes" bash "$ROOT/scripts/run-check-04-routes.sh"
else
  echo "SKIP PF-01 run-check-04-routes (SKIP_PF_ROUTES=1)"
fi
run_step "PF-01 check-spec93-routes" python "$ROOT/scripts/check-spec93-routes-vs-app.py"

# PF-07 / PF-17 IA probes
run_step "PF-07/17 l5-pe-information-architecture" \
  bash "$ROOT/scripts/dev/l5-pe-information-architecture-audit.sh"
run_step "PF-07 account-nav tracker SSOT" \
  test -f "$ROOT/frontend/evidence/GO_local_auth_l5/account-nav-page-tracker.v1.json"

# PF-08 admin surface
run_step "PF-08 admin sidebar model" \
  test -f "$ROOT/frontend/lib/admin/adminShellSidebarModel.ts"
run_step "PF-08 admin deep audit script" \
  test -f "$ROOT/scripts/dev/run-admin-frontend-deep-audit.sh"

# PF-09 permission explosion baseline
run_step "PF-09 rbac route-matrix smoke script" \
  test -f "$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh"

# PF-11 / PF-04 publish hub vs workbench paths
run_step "PF-04/11 publish hub README" \
  test -f "$ROOT/frontend/app/me/publish/README.md" \
  || test -f "$ROOT/frontend/evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE1-CLOSURE.md"
run_step "PF-04/11 provider workbench freeze" \
  test -f "$ROOT/frontend/evidence/GO_local_provider_workbench_l5/PROVIDER-WORKBENCH-L5-FREEZE.md"

# PF-15 mobile
run_step "PF-15 l5-pe-mobile-responsive" \
  bash "$ROOT/scripts/dev/l5-pe-mobile-responsive-audit.sh"

# PF-17 cross-role reality matrix
run_step "PF-17 L5 cross-role matrix doc" \
  test -f "$ROOT/frontend/evidence/L5-CROSS-ROLE-REALITY-AUDIT-FINDINGS-MATRIX.md"

# PF-19 / PF-20 weight snapshot
run_step "PF-20 weight snapshot" \
  python "$ROOT/scripts/dev/generate-product-forensic-weight-snapshot.py" "$OUT"

# Registry stub (human findings land here)
REG="$OUT/product-forensic-registry.v1.json"
python "$ROOT/scripts/dev/generate-product-forensic-registry-stub.py" "$REG"

# PF deliverables: matrices · scores · top lists · executive report
run_step "PF artifacts bundle" python "$ROOT/scripts/dev/generate-product-forensic-artifacts.py" "$OUT"

echo ""
if [[ "$fail" -eq 0 ]]; then
  echo "TT_PRODUCT_FORENSIC_AUDIT: OK"
  echo "Evidence: $OUT"
  echo "Next: complete human forensic matrix in product-forensic-registry.v1.json (KEEP/MERGE/RETIRE/REFACTOR)."
  exit 0
fi

echo "TT_PRODUCT_FORENSIC_AUDIT: FAIL"
exit 1
