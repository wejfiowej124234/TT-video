#!/usr/bin/env bash
# Cert #4 Safe walkthrough machine gates — GovFreeze V2 baseline + GORP evidence (② only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "smoke-cert4-safe-walkthrough-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert4-safe-walkthrough-machine: OK $*"; }

[[ -f "$ROOT/docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md" ]] \
  || fail "missing GovFreeze V2 baseline freeze doc"

STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || fail "missing GO_ttg_cert session"
SIGNOFF="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/admin/ADMIN-WALKTHROUGH-SIGNOFF.json"
[[ -f "$SIGNOFF" ]] || fail "Cert #3 signoff required before Cert #4 ($SIGNOFF)"

python "$ROOT/scripts/dev/run-cert4-safe-three-role-matrix-checks.py" \
  --out "$ROOT/evidence/GO_ttg_cert/.cert4-matrix-checks.json" \
  --matrix-out "$ROOT/evidence/GO_ttg_cert/.cert4-dual-timelock-matrix.json" \
  || fail "three-role Safe matrix checks"

ok "GovFreeze V2 + GORP + cutover evidence chain"
echo "TT_CERT4_SAFE_WALKTHROUGH_MACHINE: OK"
