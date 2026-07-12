#!/usr/bin/env bash
# TTG_VESTING_REGISTRY_GATE — Step 7C governance reinforcement
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

REG="registry/ttg-vesting-registry.v1.yaml"
DOC="docs/runbook/TT-TTG-VESTING-PRODUCTION-GOVERNANCE.md"
CHECKLIST="docs/runbook/TT-TTG-VESTING-OWNER-INPUT-CHECKLIST.md"
VALIDATOR="registry/validate-ttg-vesting-registry.py"

[[ -f "$REG" ]] || fail "missing $REG"
[[ -f "$DOC" ]] || fail "missing $DOC"
[[ -f "$CHECKLIST" ]] || fail "missing $CHECKLIST"
[[ -f "$VALIDATOR" ]] || fail "missing $VALIDATOR"

echo "== TTG Vesting Registry Gate (Step 7C) =="

python "$VALIDATOR" || fail "validate-ttg-vesting-registry.py"

grep -q 'production_required: true' "$REG" || fail "production_required must be true"
grep -q 'registry_lifecycle_status: READY_TEMPLATE' "$REG" || fail "READY_TEMPLATE required"
for pool in team investor ecosystem treasury; do
  grep -q "^  ${pool}:" "$REG" || fail "missing pool $pool"
done
grep -q 'OWNER_INPUT' "$REG" || fail "OWNER_INPUT placeholders required"
grep -q 'revocable: false' "$REG" || fail "team must be non-revocable"
grep -q 'controller: timelock' "$REG" || fail "team controller must be timelock"

grep -q 'Owner Input Checklist' "$CHECKLIST" || fail "checklist header missing"
grep -q 'cliff_seconds' "$CHECKLIST" || fail "checklist missing cliff"

echo "TTG_VESTING_REGISTRY_GATE: PASS"
echo "TT_TTG_VESTING_SUMMARY: PASS governance_defined validator=ok checklist=ok lifecycle=READY_TEMPLATE"
