#!/usr/bin/env bash
# Display Data Governance SSOT gate
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

REG="registry/display-data-governance.v1.yaml"
RUNBOOK="docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md"
SCRIPT="scripts/dev/run-display-data-governance.sh"
UAT="docs/runbook/TT-BUSINESS-MANUAL-UAT.md"

[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$RUNBOOK" ]] || fail "missing $RUNBOOK"
[[ -f "$SCRIPT" ]] || fail "missing $SCRIPT"
[[ -f "$UAT" ]] || fail "missing $UAT"

grep -q 'TT_DISPLAY_DATA_GOVERNANCE: ENFORCED' "$REG" || fail "registry machine key missing"
grep -q 'Display Data Governance' "$RUNBOOK" || fail "runbook title missing"
grep -q 'PRE_BUSINESS_UAT' "$REG" || fail "phase placement missing"
grep -q 'run-display-data-governance.sh' "$RUNBOOK" || fail "runbook must reference governance script"
grep -q 'f0e0b101-' "$REG" || fail "canonical trust gate prefix missing"
grep -q '00000000-0000-4000-8000-000000000311' "$REG" || fail "beijing showcase id missing"

echo "PASS: display-data-governance SSOT"
