#!/usr/bin/env bash
# Test accounts SSOT — full validation (scan + registry JSON + staging probe).
# SSOT: registry/test-accounts-business-immutable.v1.yaml
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${TT_TEST_ACCOUNTS_EVIDENCE:-$ROOT/evidence/GO_test_accounts_ssot/${STAMP}}"
mkdir -p "$OUT"

echo "== test accounts full validation ${STAMP} ==" | tee "$OUT/full-validation.log"

# 1 · Convergence scan
bash "$ROOT/scripts/dev/run-test-accounts-ssot-convergence-scan.sh" \
  | tee -a "$OUT/full-validation.log"

# 2 · Regenerate JSON mirror from YAML
python "$ROOT/scripts/dev/sync-test-accounts-registry-json.py" \
  | tee -a "$OUT/registry-sync.log"

# 3 · Staging route probe (E1 SKIP expected)
API_BASE=https://tt-api-staging.fly.dev \
FRONTEND_BASE=https://tt-web-staging.fly.dev \
  bash "$ROOT/scripts/dev/probe-manual-uat-checklist-routes.sh" \
  "$OUT/staging-checklist-probes.jsonl" \
  | tee -a "$OUT/staging-probe.log" || true

if grep -q 'TT_MANUAL_UAT_ROUTE_PROBE: PASS' "$OUT/staging-probe.log" 2>/dev/null; then
  echo "TT_TEST_ACCOUNTS_STAGING_PROBE: PASS" | tee -a "$OUT/full-validation.log"
else
  echo "TT_TEST_ACCOUNTS_STAGING_PROBE: FAIL" | tee -a "$OUT/full-validation.log"
  exit 2
fi

if grep -q 'SKIP E1-2' "$OUT/staging-probe.log" 2>/dev/null; then
  echo "TT_TEST_ACCOUNTS_E1_STAGING_SKIP: CONFIRMED" | tee -a "$OUT/full-validation.log"
fi

# 4 · Dashboard
python "$ROOT/scripts/dev/generate-manual-uat-dashboard.py" \
  | tee -a "$OUT/full-validation.log"

cat > "$OUT/STATUS.txt" <<EOF
TT_TEST_ACCOUNTS_SSOT_FULL_VALIDATION: PASS
TT_TEST_ACCOUNTS_SSOT_CONVERGENCE: PASS
TT_TEST_ACCOUNTS_STAGING_PROBE: PASS
TT_TEST_ACCOUNTS_IMMUTABLE_IDS: C1,C2,C3,C4,E1,E2
at=${STAMP}
EOF

echo "TT_TEST_ACCOUNTS_SSOT_FULL_VALIDATION: PASS"
echo "Evidence: ${OUT}"
