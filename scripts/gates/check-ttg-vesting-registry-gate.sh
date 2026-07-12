#!/usr/bin/env bash
# TTG_VESTING_REGISTRY_GATE — Step 7C · allocation semantics v3
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

echo "== TTG Vesting & Distribution Registry Gate (v3) =="

python "$VALIDATOR" || fail "validate-ttg-vesting-registry.py"

grep -q '^version: 3' "$REG" || fail "version must be 3"
grep -q '^vesting_tracks:' "$REG" || fail "vesting_tracks required"
grep -q '^governance_planned_release:' "$REG" || fail "governance_planned_release required"
grep -q '^primary_market:' "$REG" || fail "primary_market required"
grep -q '^allocation_bucket_paths:' "$REG" || fail "allocation_bucket_paths required"

for track in team advisors; do
  grep -q "^  ${track}:" "$REG" || fail "missing vesting track $track"
done
grep -qE '^  public_global:' "$REG" && fail "public_global must not be under vesting_tracks" || true
grep -qE '^  investor:' "$REG" && fail "forbidden investor pool" || true

grep -q 'amount_tokens: 1500000' "$REG" || fail "team 1.5M required"
grep -q 'public_round_1_early:' "$REG" || fail "primary market R1 required"
grep -q 'public_round_3:' "$REG" || fail "primary market R3 required"
grep -q 'three_round_primary_market' "$REG" || fail "primary market model required"
grep -q 'single_beneficiary_cliff_vesting' "$REG" || fail "forbidden model list required"
grep -q 'country_pool_shelf:' "$REG" || fail "country_pool_shelf path required"
grep -q 'treasury_dao:' "$REG" || fail "treasury_dao path required"
grep -q 'release_paths:' "$REG" || fail "release_paths required"
grep -q 'optional_lockup_seconds: OWNER_INPUT' "$REG" || fail "round optional lockup OWNER_INPUT"
grep -q 'governance_planned_release' "$REG" || fail "ecosystem governance release required"

grep -q '1,500,000' "$CHECKLIST" || fail "checklist team 1.5M"
grep -q '500,000' "$CHECKLIST" || fail "checklist round amounts"
grep -q 'Primary Market' "$CHECKLIST" || fail "checklist primary market section"

echo "TTG_VESTING_REGISTRY_GATE: PASS"
echo "TT_TTG_VESTING_SUMMARY: PASS v3 vesting=team+advisors pm=500k+500k+1m ecosystem=governance bucket_paths=ok"
