#!/usr/bin/env bash
# Phase ③ · Production Convergence — SSOT conflict scan (read-only)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PHASE3_CONVERGENCE_DIR:-$ROOT/evidence/GO_phase3_production_convergence/${STAMP}}"
mkdir -p "$OUT"
REPORT="$OUT/SSOT-CONFLICT-REPORT.md"

CANON_SIGNOFF="evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260701T002252Z.md"
CANON_OPS="evidence/manual-uat/signoff/PHASE3-OPS-VALIDATION-SIGNOFF-20260701T010000Z.md"
PREP_MD="docs/runbook/PHASE3-PRODUCTION-PREPARATION.md"

conflicts=0
pass=0

note() { echo "$1" | tee -a "$REPORT"; }
check() {
  local id="$1" ok="$2" detail="$3"
  if [[ "$ok" == "PASS" ]]; then
    pass=$((pass + 1))
    note "| ${id} | PASS | ${detail} |"
  else
    conflicts=$((conflicts + 1))
    note "| ${id} | BLOCKER | ${detail} |"
  fi
}

{
  echo "# Phase ③ Production Convergence — SSOT Conflict Scan"
  echo ""
  echo "- **at:** ${STAMP}"
  echo "- **canonical testnet sign-off:** \`${CANON_SIGNOFF}\`"
  echo "- **canonical ops sign-off:** \`${CANON_OPS}\`"
  echo ""
  echo "| ID | Verdict | Detail |"
  echo "|----|---------|--------|"
} > "$REPORT"

# 1 · Latest testnet sign-off CLOSED
if grep -q 'TT_TESTNET_SIGNOFF: CLOSED' "$ROOT/$CANON_SIGNOFF" 2>/dev/null \
  && grep -q 'TT_TESTNET_GRADUATION: CLOSED' "$ROOT/$CANON_SIGNOFF" 2>/dev/null; then
  check "SSOT-SIGNOFF-CANON" PASS "Canonical sign-off CLOSED keys present"
else
  check "SSOT-SIGNOFF-CANON" BLOCKER "Canonical sign-off missing CLOSED keys"
fi

# 2 · Stale sign-offs must be SUPERSEDED
for stale in \
  "evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260630T154900Z.md" \
  "evidence/manual-uat/signoff/TESTNET-SIGNOFF-20260630T163100Z.md"; do
  base="$(basename "$stale")"
  if [[ ! -f "$ROOT/$stale" ]]; then
    check "SSOT-STALE-${base}" PASS "file absent (no stale conflict)"
  elif grep -qi 'SUPERSEDED BY' "$ROOT/$stale" 2>/dev/null; then
    check "SSOT-STALE-${base}" PASS "SUPERSEDED BY header present"
  else
    check "SSOT-STALE-${base}" BLOCKER "Missing SUPERSEDED BY → ${CANON_SIGNOFF}"
  fi
done

# 3 · Runbook machine keys
if grep -q 'PHASE3_PRODUCTION_CONVERGENCE: ACTIVE' "$ROOT/$PREP_MD" \
  && grep -q 'PHASE3_OPS_VALIDATION: CLOSED' "$ROOT/$PREP_MD" \
  && grep -q 'TT_TESTNET_SIGNOFF: CLOSED' "$ROOT/$PREP_MD"; then
  check "SSOT-RUNBOOK-KEYS" PASS "PHASE3-PRODUCTION-PREPARATION.md keys aligned"
else
  check "SSOT-RUNBOOK-KEYS" BLOCKER "Runbook keys stale vs SSOT truth table"
fi

# 4 · Ops validation sign-off exists
if [[ -f "$ROOT/$CANON_OPS" ]] && grep -q 'PHASE3_OPS_VALIDATION: CLOSED' "$ROOT/$CANON_OPS" 2>/dev/null; then
  check "SSOT-OPS-SIGNOFF" PASS "Phase 1 ops sign-off CLOSED"
else
  check "SSOT-OPS-SIGNOFF" BLOCKER "Ops validation sign-off missing or OPEN"
fi

# 5 · Session SUMMARY 22/22
summary="$ROOT/evidence/manual-uat/sessions/20260630T144813Z/SUMMARY.json"
if [[ -f "$summary" ]]; then
  if python -c "import json,sys;s=json.load(open(sys.argv[1],encoding='utf-8'));t=s.get('testnet_signoff') or {};exit(0 if t.get('pass',0)>=22 and t.get('fail',0)==0 else 1)" "$summary" 2>/dev/null; then
    check "SSOT-SESSION-SUMMARY" PASS "Session SUMMARY testnet_signoff 22/22 PASS"
  else
    check "SSOT-SESSION-SUMMARY" BLOCKER "Session SUMMARY testnet_signoff not 22/22"
  fi
else
  check "SSOT-SESSION-SUMMARY" BLOCKER "Session SUMMARY.json missing"
fi

{
  echo ""
  echo "## Summary"
  echo ""
  echo "- **pass:** ${pass}"
  echo "- **conflicts:** ${conflicts}"
  echo ""
} >> "$REPORT"

cat > "$OUT/STATUS.txt" <<EOF
TT_PHASE3_PRODUCTION_CONVERGENCE_SCAN: $([[ "$conflicts" -eq 0 ]] && echo OK || echo CONFLICTS)
at=${STAMP}
pass=${pass}
conflicts=${conflicts}
EOF

echo "TT_PHASE3_PRODUCTION_CONVERGENCE_SCAN: conflicts=${conflicts} pass=${pass}"
echo "Report: ${REPORT}"
[[ "$conflicts" -eq 0 ]] && exit 0 || exit 2
