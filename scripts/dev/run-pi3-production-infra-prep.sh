#!/usr/bin/env bash
# PI3 Production Infrastructure Prep · 002 → 001 → 003 → 004 (excludes 005/006)
#
#   bash scripts/dev/run-pi3-production-infra-prep.sh
#
# Owner live closure: set PROD_WEB_BASE + PROD_API_BASE then re-run gates.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
OUT="${PI3_PREP_EVIDENCE_DIR:-$ROOT/evidence/GO_phase2_testnet_20260526/phase3-production-prep/pi3-infra-prep-${STAMP}}"
mkdir -p "$OUT"
LOG="$OUT/run.log"
exec > >(tee -a "$LOG") 2>&1

fail=0
run_step() {
  local id="$1" cmd="$2" log="$3"
  echo ""
  echo "== ${id} =="
  if eval "$cmd" 2>&1 | tee "$OUT/$log"; then
    echo "${id}: OK"
  else
    echo "${id}: HOLD (expected until Owner prod resources)" >&2
    fail=$((fail + 1))
  fi
}

echo "== PI3 Production Infrastructure Prep · ${STAMP} =="
echo "SSOT: docs/runbook/TT-PI3-PRODUCTION-INFRASTRUCTURE-PREP.md"
echo "Order: PI3-002 → PI3-001 → PI3-003 → PI3-004 (PI3-005/006 deferred)"
echo "PROD_WEB_BASE=${PROD_WEB_BASE:-<unset>}"
echo "PROD_API_BASE=${PROD_API_BASE:-<unset>}"

run_step "PI3-002 execution gate" "bash '$ROOT/scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh'" "pi3-002-gate.log" || true
run_step "PI3-001 execution gate" "bash '$ROOT/scripts/check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh'" "pi3-001-gate.log" || true
run_step "PI3-003 execution gate" "bash '$ROOT/scripts/check-pi3-003-stripe-live-production-webhook-execution.sh'" "pi3-003-gate.log" || true
run_step "PI3-004 execution gate" "bash '$ROOT/scripts/check-pi3-004-production-readiness-verification-execution.sh'" "pi3-004-gate.log" || true

echo ""
echo "== Infrastructure audit (proxy) =="
bash "$ROOT/scripts/dev/run-production-infrastructure-audit.sh" 2>&1 | tee "$OUT/infra-audit.log" || true

echo ""
echo "== PI3 prep ledger =="
ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$OUT" \
  node "$ROOT/scripts/dev/gen-pi3-prep-ledger.cjs" | tee "$OUT/ledger-gen.log"

echo ""
echo "Evidence: $OUT"
echo "PI3_INFRA_PREP: recorded (gates may HOLD until Owner config)"
exit 0
