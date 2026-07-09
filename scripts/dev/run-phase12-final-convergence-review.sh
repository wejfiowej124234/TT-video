#!/usr/bin/env bash
# Phase①/② Final Convergence Review — orchestrate existing audits only (no new dimensions)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
EVID="$ROOT/evidence/GO_phase12_final_convergence/$STAMP"
mkdir -p "$EVID"
LOG="$EVID/run.log"
exec > >(tee -a "$LOG") 2>&1

fail() { echo "TT_PHASE12_FINAL_CONVERGENCE: FAIL $*" >&2; exit 2; }

echo "== Phase①/② Final Convergence Review · $STAMP =="
echo "SSOT: docs/runbook/TT-PHASE12-FINAL-CONVERGENCE-REVIEW.md"
echo "policy: existing audits only · no new product audit types"

echo "== [1/8] Release pipeline + audit SSOT gates =="
bash "$ROOT/scripts/gates/check-release-pipeline-ssot.sh" | tee "$EVID/gate-release-pipeline.log"
bash "$ROOT/scripts/gates/check-frontend-api-consistency-audit-ssot.sh" | tee "$EVID/gate-fe-api.log"
bash "$ROOT/scripts/gates/check-display-data-governance-ssot.sh" | tee "$EVID/gate-ddg.log"

echo "== [2/8] Display Data Governance (local + staging) =="
bash "$ROOT/scripts/dev/run-display-data-governance.sh" 2>&1 | tee "$EVID/ddg-local.log"
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash "$ROOT/scripts/dev/run-display-data-governance.sh" 2>&1 | tee "$EVID/ddg-staging.log"

echo "== [3/8] Frontend–API Consistency strict (staging) =="
STRICT_WARNINGS=1 API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash "$ROOT/scripts/dev/run-frontend-api-consistency-audit.sh" 2>&1 | tee "$EVID/fe-api-staging.log"

echo "== [4/8] Business Manual UAT probes =="
bash "$ROOT/scripts/dev/run-business-manual-uat-probes.sh" 2>&1 | tee "$EVID/business-uat-local.log"
API_BASE=https://tt-api-staging.fly.dev ENV_LABEL=staging \
  bash "$ROOT/scripts/dev/run-business-manual-uat-probes.sh" 2>&1 | tee "$EVID/business-uat-staging.log"

echo "== [5/8] Staging web alignment (non-blocking) =="
bash "$ROOT/scripts/dev/check-staging-web-alignment.sh" \
  --web-base https://tt-web-staging.fly.dev \
  --api-base https://tt-api-staging.fly.dev \
  --chain-id 11155111 2>&1 | tee "$EVID/staging-alignment.log" || true

echo "== [6/8] Phase② alignment evidence (read-only · no fly proxy) =="
if [[ -f "$ROOT/evidence/enterprise_alignment_audit/20260701T012102Z/ENTERPRISE-ALIGNMENT-AUDIT-REPORT.md" ]]; then
  echo "  reuse evidence/enterprise_alignment_audit/20260701T012102Z" | tee "$EVID/baseline-consistency.log"
else
  echo "  WARN: alignment report missing — skip deep baseline replay" | tee "$EVID/baseline-consistency.log"
fi

echo "== [7/8] Generate Convergence Ledger =="
ROOT="$ROOT" STAMP="$STAMP" EVIDENCE_DIR="$EVID" \
  node "$ROOT/scripts/dev/gen-phase12-final-convergence-ledger.cjs" 2>&1 | tee "$EVID/ledger-gen.log"

echo "== [8/8] Summary =="
cat "$EVID/convergence-ledger.json" | head -40
echo ""
echo "Evidence: $EVID"
echo "TT_PHASE12_FINAL_CONVERGENCE: CLOSED"
exit 0
