#!/usr/bin/env bash
# PER Round 1 · Final Spot Check — gates + 7-page matrix + parity JSON
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
EVID="$ROOT/docs/spec/governance-token/evidence/phase3-production-entry-baseline"
JSON="${EVIDENCE_JSON:-$EVID/PER-FINAL-SPOT-CHECK-LATEST.json}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LOG="$EVID/PER-FINAL-SPOT-CHECK-${STAMP}.log"

mkdir -p "$EVID"

{
  echo "TT_PER_FINAL_SPOT_CHECK: START ${STAMP}"
  echo "phase: ① local SSOT"

  echo ""
  echo "== Gate: production UI hygiene =="
  bash "$ROOT/scripts/gates/check-production-ui-hygiene-gate.sh"

  echo ""
  echo "== Gate: public surface audit =="
  bash "$ROOT/scripts/gates/check-public-surface-audit-gate.sh"

  echo ""
  echo "== Parity: market guide catalog =="
  bash "$ROOT/scripts/dev/run-market-guide-catalog-parity.sh"

  echo ""
  echo "== 7-page matrix + public surface parity =="
  WEB_BASE="${WEB_BASE:-http://127.0.0.1:3012}" \
  API_BASE="${API_BASE:-http://127.0.0.1:8080}" \
  EVIDENCE_JSON="$JSON" \
  node "$ROOT/scripts/dev/run-per-final-spot-check.cjs"
} 2>&1 | tee "$LOG"

echo "TT_PER_FINAL_SPOT_CHECK_EVIDENCE: $JSON"
echo "TT_PER_FINAL_SPOT_CHECK_LOG: $LOG"
