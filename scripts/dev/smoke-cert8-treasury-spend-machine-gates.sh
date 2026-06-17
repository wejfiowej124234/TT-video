#!/usr/bin/env bash
# Cert #8 Treasury Spend machine gates (② · requires 2nd Timelock execute for PASS)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

fail() { echo "smoke-cert8-treasury-spend-machine: FAIL $*" >&2; exit 1; }

STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || fail "missing GO_ttg_cert session"

C7="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/execute/PHASE-B-EXECUTE-SIGNOFF.json"
HAT_EXEC="$HAT_R1_ROOT"/step-07-execute/tx-execute.json"
[[ -f "$HAT_EXEC" ]] || fail "Cert #7 execute tx evidence required"

python "$ROOT/scripts/dev/run-cert8-treasury-matrix-checks.py" \
  --stamp "$STAMP" \
  --out "$ROOT/evidence/GO_ttg_cert/.cert8-matrix-checks.json" \
  --flow-map-out "$ROOT/evidence/GO_ttg_cert/.cert8-treasury-flow-map.json" \
  || fail "treasury matrix checks"

echo "TT_CERT8_TREASURY_MACHINE: OK"
