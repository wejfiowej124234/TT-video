#!/usr/bin/env bash
# Phase ② · Testnet Execution Sprint — 证据 + G-0～G-4 闸 + 全链 smoke
#
# 用法（仓库根）：
#   bash scripts/dev/record-phase2-testnet-execution-sprint-evidence.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

EVID="$ROOT/frontend/evidence/GO_phase2_testnet_execution_sprint"
mkdir -p "$EVID"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
RUN_LOG="$EVID/PHASE2-TESTNET-EXECUTION-SPRINT-${STAMP}.log"
STEPS_ROOT="$EVID/steps-${STAMP}"
mkdir -p "$STEPS_ROOT"

export STAGING_API_BASE="${STAGING_API_BASE:-https://tt-api-staging.fly.dev}"
export API_BASE="$STAGING_API_BASE"
export P2EXEC_EVID_ROOT="$STEPS_ROOT"

{
  echo "TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: START ${STAMP}"
  echo "phase: ② testnet staging"
  echo "api: ${STAGING_API_BASE}"
  echo "prerequisite: TT_PHASE2_G0_G4_ADMISSION: CLEAR (PHASE2-START-CHECKLIST-SPRINT)"
  echo "ssot: frontend/evidence/GO_phase2_testnet_execution_sprint/PHASE2-TESTNET-EXECUTION-SPRINT-FREEZE.md"

  echo ""
  echo "== Step A: vitest phase2 testnet execution contract =="
  cd "$ROOT/frontend"
  npx vitest run lib/phase2/phase2TestnetExecutionSprint.contract.test.ts

  echo ""
  echo "== Step B: G-0～G-4 admission pregate =="
  cd "$ROOT"
  bash scripts/dev/check-phase2-onboarding-staging-ready.sh

  echo ""
  echo "== Step C: staging full chain (10 steps + rollback records) =="
  bash scripts/dev/smoke-phase2-testnet-execution-sprint.sh 2>&1 | tee "$STEPS_ROOT/full-chain.log"

  echo ""
  echo "TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK ${STAMP}"
  echo "TT_PHASE2_TESTNET_EXECUTION_SPRINT_SUMMARY: exit=0 phase=② staging_10step_chain"
  echo "steps_evidence: ${STEPS_ROOT}"
} 2>&1 | tee "$RUN_LOG"

grep -q "TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK" "$RUN_LOG" || {
  echo "FAIL: missing evidence OK marker" >&2
  exit 2
}
grep -q "TT_PHASE2_TESTNET_EXECUTION_SPRINT: OK" "$STEPS_ROOT/full-chain.log" || {
  echo "FAIL: smoke chain missing OK marker" >&2
  exit 2
}

ln -sfn "$(basename "$STEPS_ROOT")" "$EVID/steps-latest" 2>/dev/null || cp -r "$STEPS_ROOT" "$EVID/steps-latest-copy" 2>/dev/null || true
echo "Evidence log: $RUN_LOG"
exit 0
