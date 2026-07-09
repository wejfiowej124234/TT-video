#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
REG="registry/phase12-final-convergence.v1.yaml"
RB="docs/runbook/TT-PHASE12-FINAL-CONVERGENCE-REVIEW.md"
SCRIPT="scripts/dev/run-phase12-final-convergence-review.sh"
GEN="scripts/dev/gen-phase12-final-convergence-ledger.cjs"
fail() { echo "FAIL: $*" >&2; exit 1; }
[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$RB" ]] || fail "missing $RB"
[[ -f "$SCRIPT" ]] || fail "missing $SCRIPT"
[[ -f "$GEN" ]] || fail "missing $GEN"
grep -q 'TT_PHASE12_FINAL_CONVERGENCE' "$REG" || fail "machine key"
grep -q 'Convergence Ledger' "$RB" || fail "runbook ledger section"
echo "PASS: phase12-final-convergence SSOT"
