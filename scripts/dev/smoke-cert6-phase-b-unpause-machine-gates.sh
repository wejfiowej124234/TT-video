#!/usr/bin/env bash
# Cert #6 Phase B unpause machine gates — HAT-R1 Phase A + Cert #5 + unpause probe (② only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

fail() { echo "smoke-cert6-phase-b-unpause-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert6-phase-b-unpause-machine: OK $*"; }

[[ -f "$ROOT/docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md" ]] \
  || fail "missing GovFreeze V2 baseline"

STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || fail "missing GO_ttg_cert session"
C5="$ROOT/evidence/GO_ttg_cert/${STAMP}/walkthrough/finance/FINANCE-WALKTHROUGH-SIGNOFF.json"
[[ -f "$C5" ]] || fail "Cert #5 FINANCE-WALKTHROUGH-SIGNOFF required"

HAT="$HAT_R1_ROOT"
[[ -f "$HAT/EXECUTE_EARLIEST_UNIX.txt" ]] || fail "missing HAT-R1 EXECUTE_EARLIEST_UNIX.txt"
[[ -f "$HAT/hat-r1-report-$(basename "$HAT").json" ]] || fail "missing HAT-R1 Phase A report"
ok "Cert #5 + HAT-R1 Phase A anchors"

python "$ROOT/scripts/dev/run-cert6-phase-b-unpause-matrix-checks.py" \
  --out "$ROOT/evidence/GO_ttg_cert/.cert6-matrix-checks.json" \
  --flow-map-out "$ROOT/evidence/GO_ttg_cert/.cert6-phase-b-flow-map.json" \
  || fail "phase-b unpause matrix checks"

echo "TT_CERT6_PHASE_B_UNPAUSE_MACHINE: OK"
