#!/usr/bin/env bash
# L5 Enterprise · RBAC Security static audit (161 · RBAC track)
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
fail=0
check() { if eval "$2"; then echo "OK   $1"; else echo "FAIL $1"; fail=1; fi; }

echo "== L5 Enterprise RBAC Security Audit =="
check "local RBAC matrix smoke" "test -f '$ROOT/scripts/dev/smoke-admin-rbac-matrix-local.sh'"
check "E4 escalation probe" "test -f '$ROOT/scripts/dev/l5-p0-e4-rbac-escalation-smoke.sh'"
check "E3 2FA probe" "test -f '$ROOT/scripts/dev/l5-p0-e3-2fa-coverage-smoke.sh'"
check "ops plane auth hints" "rg -q 'OpsPlaneAuthHints' '$ROOT/frontend/components/admin/ops/OpsPlaneFetchStates.tsx'"
check "admin permission SSOT" "test -f '$ROOT/frontend/lib/admin/adminPermissionIds.ts'"
check "mutating actions audit" "test -f '$ROOT/scripts/dev/run-admin-mutating-actions-audit.sh'"

API_BASE="${API_BASE:-http://127.0.0.1:8080}"
if curl -sS -o /dev/null -w '%{http_code}' --max-time 2 "$API_BASE/health" 2>/dev/null | grep -q 200; then
  echo "INFO: API live — optional live RBAC matrix available"
  echo "  bash scripts/dev/smoke-admin-rbac-matrix-local.sh"
else
  echo "WARN: API not live — static RBAC harness GO only (live matrix optional for 161)"
fi

if [[ "$fail" -ne 0 ]]; then
  echo "TT_RBAC_SECURITY: HOLD"
  exit 2
fi
echo "TT_RBAC_SECURITY: RBAC_SECURITY_GO"
exit 0
