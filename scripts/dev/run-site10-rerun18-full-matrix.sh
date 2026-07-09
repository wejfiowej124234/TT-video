#!/usr/bin/env bash
# ① Site10 · rerun18 全矩阵（844 · guest auth-gate 子簇窄切片 6× 绿后 · 验证 REAL FAIL 是否清）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun18-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
GATES="$EVID/site10-rerun18-gates.txt"
PARSE="$EVID/site10-rerun18-parse.txt"
WAIT="$EVID/site10-rerun18-wait.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun18 start · guest likes/collects auth-gate stability verified (6× narrow slice green)"
echo "=== rerun18 $(date -u +%Y-%m-%dT%H:%M:%SZ) · verify guest gate REAL FAIL cleared vs rerun17=44 ===" | tee -a "$RERUN_LOG"

export PLAYWRIGHT_REUSE_FE_SERVER=0
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG" "$WAIT"
rc=${PIPESTATUS[0]}
set -e
log "rerun18 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee "$GATES" | tee -a "$ORCH" || true

log "--- parse-fails (rerun18 REAL FAIL) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee "$PARSE" | tee -a "$ORCH"

log "rerun18 orchestrator complete · compare REAL FAIL vs rerun17=44"
