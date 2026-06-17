#!/usr/bin/env bash
# Production report.json evidence chain（PI3-004 · R-001 / R-003）
#
#   bash scripts/dev/verify-pi3-004-production-report-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BASELINE="$ROOT/evidence/pi3_004_production_readiness_verification/baseline_record.v1.json"
SKELETON_DIR="$ROOT/evidence/pi3_004_production_readiness_verification/r003-prod-skeleton"

pass=0
fail_n=0
warn_n=0
pass() { echo "  [PASS] $*"; pass=$((pass + 1)); }
fail() { echo "  [FAIL] $*" >&2; fail_n=$((fail_n + 1)); }
warn() { echo "  [WARN] $*" >&2; warn_n=$((warn_n + 1)); }
section() { echo ""; echo "=== $* ==="; }

section "1 · PI3-004 baseline"
[[ -f "$BASELINE" ]] && pass "baseline_record.v1.json" || fail "missing baseline"
python "$ROOT/scripts/gates/check-pi3-004-production-readiness-baseline-record.py" >/dev/null 2>&1 \
  && pass "baseline shape gate" || fail "baseline shape gate"
st="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('status',''))" "$BASELINE")"
pass "baseline status=${st}"

section "2 · Report skeleton (execution deliverable)"
if [[ ! -f "$SKELETON_DIR/report.json" ]]; then
  python "$ROOT/scripts/dev/generate-pi3-004-production-report-skeleton.py" \
    --out "$SKELETON_DIR" \
    --prod-api-base "https://api.example.com" \
    --prod-web-base "https://app.example.com" >/dev/null
fi
[[ -f "$SKELETON_DIR/report.json" ]] && pass "production report.json skeleton" || fail "skeleton missing"

python "$ROOT/scripts/validate-regression-report.py" "$SKELETON_DIR/report.json" >/dev/null 2>&1 \
  && pass "validate-regression-report shape OK" || fail "validate-regression-report shape FAIL"

env_name="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8'))['environment']['name'])" "$SKELETON_DIR/report.json")"
[[ "$env_name" == "production" ]] && pass "environment.name=production" || fail "environment.name=${env_name}"

rg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "$SKELETON_DIR/report.json")"
[[ "$rg" == "GO" ]] && pass "release_gate=GO (prod run complete)" || warn "release_gate=${rg} (skeleton/Owner run pending)"

section "3 · R-003 production run evidence"
latest_r003="$(ls -d "$ROOT/evidence/pi3_004_production_readiness_verification"/r003-production-* 2>/dev/null | sort | tail -1 || true)"
if [[ -n "$latest_r003" && -f "${latest_r003}/report.json" ]]; then
  pass "r003-production evidence (${latest_r003##*/})"
  prg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "${latest_r003}/report.json")"
  pass "r003 report release_gate=${prg}"
  if [[ "$prg" == "GO" ]]; then
    python "$ROOT/scripts/validate-regression-report.py" "${latest_r003}/report.json" --fail-on-no-go --require-go >/dev/null 2>&1 \
      && pass "r003 validate --fail-on-no-go --require-go" || fail "r003 GO validate FAIL"
  fi
else
  if [[ "$st" == "PASS" ]]; then
    fail "baseline PASS but no r003-production evidence"
  else
    warn "no r003-production run (Owner: run-r003-production-regression.sh)"
  fi
fi

section "4 · GO readiness"
prod_go=0
if [[ -n "$latest_r003" && -f "${latest_r003}/report.json" ]]; then
  prg="$(python -c "import json,sys; print(json.load(open(sys.argv[1],encoding='utf-8')).get('release_gate',''))" "${latest_r003}/report.json")"
  [[ "$prg" == "GO" && "$st" == "PASS" ]] && prod_go=1
fi
if [[ "$prod_go" == "1" ]]; then
  pass "production report GO chain closed"
else
  warn "PI3-004 production report GO not closed"
fi

echo ""
echo "verify-pi3-004-production-report-evidence: PASS=${pass} FAIL=${fail_n} WARN=${warn_n}"
[[ "$fail_n" -eq 0 ]] || exit 2
