#!/usr/bin/env bash
# Test accounts SSOT convergence scan (docs + registry + probe discipline).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${TT_TEST_ACCOUNTS_EVIDENCE:-$ROOT/evidence/GO_test_accounts_ssot/${STAMP}}"
REG="$ROOT/registry/test-accounts-business-immutable.v1.yaml"
MATRIX="$ROOT/docs/runbook/TT-LOCAL-TEST-ACCOUNTS-MATRIX.md"
QUICK="$ROOT/docs/runbook/TT-TEST-ACCOUNTS-QUICK-REFERENCE.md"
LOCAL_DOC="$ROOT/docs/测试账号与本地联调.md"
PROBE="$ROOT/scripts/dev/probe-manual-uat-checklist-routes.sh"
conflicts=0
pass=0

check() {
  local id="$1" ok="$2" detail="$3"
  if [[ "$ok" == PASS ]]; then
    pass=$((pass + 1))
    echo "PASS $id — $detail"
  else
    conflicts=$((conflicts + 1))
    echo "BLOCKER $id — $detail"
  fi
}

mkdir -p "$OUT"
exec > >(tee -a "$OUT/scan.log") 2>&1
echo "== test accounts ssot convergence ${STAMP} =="

[[ -f "$REG" ]] && check REG-EXISTS PASS "immutable registry present" || check REG-EXISTS BLOCKER "missing registry yaml"

for id in C1 C2 C3 C4 E1 E2; do
  grep -q "  ${id}:" "$REG" && check "IMM-ID-${id}" PASS "registry entry" || check "IMM-ID-${id}" BLOCKER "missing in registry"
done

grep -q 'immutable_logical_ids' "$REG" && check IMM-GOV PASS "governance block" || check IMM-GOV BLOCKER "governance missing"
grep -q 'ADD_NEW_ID' "$REG" && check GOV-BREAK PASS "breaking change = ADD_NEW_ID" || check GOV-BREAK BLOCKER "policy missing"

grep -q 'tt-immutable-logical-ids' "$MATRIX" && check MATRIX-IMM PASS "matrix immutable section" || check MATRIX-IMM BLOCKER "matrix missing immutable ids"
grep -q 'TT-TEST-ACCOUNTS-QUICK-REFERENCE' "$LOCAL_DOC" && check LOCALDOC-LINK PASS "local doc links quick ref first" || check LOCALDOC-LINK BLOCKER "local doc missing quick ref"
grep -q '§2.1 账号速查' "$LOCAL_DOC" && check LOCALDOC-DUP BLOCKER "§2.1 duplicate table still present" || check LOCALDOC-DUP PASS "no §2.1 duplicate table"

grep -q 'IS_STAGING' "$PROBE" && check PROBE-STAGING PASS "probe staging-aware" || check PROBE-STAGING BLOCKER "probe not staging-aware"
grep -q 'IS_STAGING' "$PROBE" && check PROBE-E1 PASS "E1 staging skip via IS_STAGING" || check PROBE-E1 BLOCKER "E1 staging guard missing"

grep -q 'step_6b4_ids' "$REG" && check REG-6B4 PASS "E1 on 6b4 not 6b5" || check REG-6B4 BLOCKER "probe matrix missing 6b4"

for email in multi-demo@test.com tourist@test.com guide@test.com merchant@test.com provider-did-rank-demo@test.com tg_guide_main@trustgate-e2e.local; do
  grep -q "$email" "$QUICK" || grep -q "$email" "$REG" || { check "EMAIL-${email}" BLOCKER "not in quick/ref"; continue; }
  check "EMAIL-${email}" PASS "referenced"
done

grep -q '21' "$LOCAL_DOC" && grep -q '迁移' "$LOCAL_DOC" && check MIG-STALE BLOCKER "stale migration count 21 in local doc" || check MIG-STALE PASS "no stale migration 21 claim"

CHANGE="$ROOT/docs/runbook/TT-TEST-ACCOUNT-CHANGE.md"
START_README="$ROOT/scripts/dev/start-api-with-seed-README.md"
UI_CHK="$ROOT/docs/runbook/TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md"
JSON_REG="$ROOT/evidence/manual-uat/summary/test-accounts-registry.v1.json"

[[ -f "$CHANGE" ]] && check CHANGE-GATE PASS "TT-TEST-ACCOUNT-CHANGE template" || check CHANGE-GATE BLOCKER "missing change gate"
grep -q 'TT-TEST-ACCOUNTS-QUICK-REFERENCE' "$START_README" && check STARTAPI-LINK PASS "start-api README quick ref" || check STARTAPI-LINK BLOCKER "start-api README missing quick ref"
grep -q 'TT-TEST-ACCOUNTS-QUICK-REFERENCE' "$UI_CHK" && check UI-LINK PASS "UI checklist quick ref" || check UI-LINK BLOCKER "UI checklist missing quick ref"

if python "$ROOT/scripts/dev/sync-test-accounts-registry-json.py" >/dev/null 2>&1; then
  check JSON-SYNC PASS "registry JSON regenerated from YAML"
else
  check JSON-SYNC BLOCKER "registry JSON sync failed"
fi
[[ -f "$JSON_REG" ]] && check JSON-EXISTS PASS "test-accounts-registry.v1.json present" || check JSON-EXISTS BLOCKER "JSON registry missing"

cat > "$OUT/STATUS.txt" <<EOF
TT_TEST_ACCOUNTS_SSOT_CONVERGENCE: $([[ "$conflicts" -eq 0 ]] && echo PASS || echo CONFLICTS)
at=${STAMP}
pass=${pass}
conflicts=${conflicts}
EOF

echo "TT_TEST_ACCOUNTS_SSOT_CONVERGENCE: conflicts=${conflicts} pass=${pass}"
echo "Evidence: ${OUT}"
[[ "$conflicts" -eq 0 ]] && exit 0 || exit 2
