#!/usr/bin/env bash
# Cert #3 Admin walkthrough machine gates — RBAC gap=0 + five roles + admin L5 vitest (① local)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-cert3-admin-walkthrough-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert3-admin-walkthrough-machine: OK $*"; }

GAP="$(python - <<'PY'
import json
from pathlib import Path
root = Path(".")
stamp = (root / "evidence/GO_admin_rbac_alignment/latest-stamp.txt").read_text(encoding="utf-8").strip()
gap_path = root / "evidence/GO_admin_rbac_alignment" / stamp / "RBAC-GAP-LIST.v1.json"
print(json.loads(gap_path.read_text(encoding="utf-8"))["handlers_gap"])
PY
)"
[[ -f "evidence/GO_admin_rbac_alignment/$(cat evidence/GO_admin_rbac_alignment/latest-stamp.txt | tr -d '\r\n')/RBAC-GAP-LIST.v1.json" ]] || fail "missing RBAC-GAP-LIST"
[[ "$GAP" == "0" ]] || fail "RBAC-GAP-LIST handlers_gap=$GAP (need 0)"
ok "RBAC-GAP-LIST=0 stamp=$(cat evidence/GO_admin_rbac_alignment/latest-stamp.txt | tr -d '\r\n')"

cd "$ROOT/frontend"
npm run test -- \
  adminAdminPerfectClosureL5 \
  adminHomeCardPermission \
  adminHomeVisibility \
  adminPhase1DataHonesty \
  adminPhase1FullClosureL5 \
  --run >/dev/null || fail "admin vitest union"
ok "admin vitest union (107 pages + card visibility SSOT)"

cd "$ROOT"
MATRIX_OUT="$ROOT/evidence/GO_ttg_cert/.cert3-matrix-checks.json"
ARGS=(python "$ROOT/scripts/dev/run-cert3-admin-five-role-matrix-checks.py" --out "$MATRIX_OUT")
[[ "${CERT3_SKIP_API:-}" == "1" ]] && ARGS+=(--skip-api)
"${ARGS[@]}" || fail "five-role matrix checks"
ok "five-role matrix + cargo cert3 tests"

echo "TT_CERT3_ADMIN_WALKTHROUGH_MACHINE: OK"
