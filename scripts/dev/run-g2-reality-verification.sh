#!/usr/bin/env bash
# G2 Reality Verification — five truth sources + Production Runtime Identity Guard.
# Release Train: Reality Audit → Platform Coverage Audit → Reality Verification → Formal → Gate PASS
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

FIX_STAMP="${G2_FIX_STAMP:-}"
if [[ -z "$FIX_STAMP" ]]; then
  FIX_STAMP="$(ls -1d evidence/GO_production_readiness/g2-reality-fix/*/ 2>/dev/null | sort | tail -1 | xargs basename 2>/dev/null || true)"
fi

STAMP="${AUDIT_STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}"
export AUDIT_STAMP="$STAMP"
EVID="evidence/GO_production_readiness/g2-reality-verification/${STAMP}"
COVERAGE_EVID="$EVID/platform-coverage"
FIX_DIR=""
[[ -n "$FIX_STAMP" ]] && FIX_DIR="evidence/GO_production_readiness/g2-reality-fix/${FIX_STAMP}"

echo "=== G2 Reality Verification · $STAMP ==="
echo "PROD_API_BASE=${PROD_API_BASE:-https://tt-api-prod.fly.dev}"
[[ -n "$FIX_DIR" ]] && echo "Fix baseline: $FIX_DIR"

echo "=== Platform Coverage Audit (Release Train) ==="
mkdir -p "$COVERAGE_EVID"
node scripts/dev/audit-platform-coverage.cjs --evidence-dir "$COVERAGE_EVID"
node scripts/dev/validate-platform-coverage-gate.cjs --signoff "$COVERAGE_EVID/platform-coverage-audit.json" --gate G2
coverage_gate_exit=$?

bash scripts/dev/run-g2-reality-verification-probes.sh "$EVID"

VERIFY_ARGS=(--evidence-dir "$EVID")
[[ -n "$FIX_DIR" ]] && VERIFY_ARGS+=(--fix-dir "$FIX_DIR")

set +e
node scripts/dev/validate-g2-reality-verification.cjs "${VERIFY_ARGS[@]}"
verify_exit=$?
set -e

node scripts/dev/sync-production-readiness-g2-matrix.cjs \
  --signoff "$EVID/g2-reality-verification-signoff.json" \
  --mode verification

node scripts/dev/validate-production-readiness-master-matrix.cjs

echo ""
echo "TT_G2_REALITY_VERIFICATION: see $EVID/g2-reality-verification-signoff.json"
echo "Plan: docs/runbook/G2-REALITY-VERIFICATION-PLAN.md"

final_exit=$verify_exit
if [[ "$coverage_gate_exit" -ne 0 ]]; then
  final_exit=1
fi
exit "$final_exit"
