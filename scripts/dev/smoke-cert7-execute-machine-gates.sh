#!/usr/bin/env bash
# Cert #7 Execute machine gates — Timelock elapsed + step-07-execute evidence (② only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

# shellcheck source=scripts/dev/lib/hat-r1-evidence-lib.sh
source "$ROOT/scripts/dev/lib/hat-r1-evidence-lib.sh"
HAT_R1_ROOT="$(hat_r1_resolve_evid_dir "$ROOT")"

fail() { echo "smoke-cert7-execute-machine: FAIL $*" >&2; exit 1; }
ok() { echo "smoke-cert7-execute-machine: OK $*"; }

[[ -f "$ROOT/docs/spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md" ]] \
  || fail "missing GovFreeze V2 baseline"

STAMP="$(cat "$ROOT/evidence/GO_ttg_cert/latest-stamp.txt" 2>/dev/null | tr -d '\r\n' || true)"
[[ -n "$STAMP" ]] || fail "missing GO_ttg_cert session"
C6="$ROOT/evidence/GO_ttg_cert/${STAMP}/phase-b/unpause/PHASE-B-UNPAUSE-SIGNOFF.json"
[[ -f "$C6" ]] || fail "Cert #6 PHASE-B-UNPAUSE-SIGNOFF required"

[[ "${HAT_R1_FORCE_EXECUTE:-0}" == "0" ]] || fail "HAT_R1_FORCE_EXECUTE forbidden for Cert #7"

ETA="$(cat "$HAT_R1_ROOT/EXECUTE_EARLIEST_UNIX.txt" | tr -d '\r\n')"
NOW="$(date +%s)"
if [[ "$NOW" -lt "$ETA" ]]; then
  fail "Timelock not elapsed (ETA=${ETA} remaining=$((ETA-NOW))s) — cannot Cert #7 Execute"
fi
ok "Timelock elapsed ETA=${ETA}"

python "$ROOT/scripts/dev/run-cert7-execute-matrix-checks.py" \
  --stamp "$STAMP" \
  --out "$ROOT/evidence/GO_ttg_cert/.cert7-matrix-checks.json" \
  --flow-map-out "$ROOT/evidence/GO_ttg_cert/.cert7-execute-flow-map.json" \
  || fail "execute matrix checks"

echo "TT_CERT7_EXECUTE_MACHINE: OK"
