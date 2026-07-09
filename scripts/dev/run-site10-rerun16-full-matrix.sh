#!/usr/bin/env bash
# ① Site10 · rerun16 全矩阵（844 · auth-nav + community + smoke-admin 窄切片绿后 · 单实例锁）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun16-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
GATES="$EVID/site10-rerun16-gates.txt"
PARSE="$EVID/site10-rerun16-parse.txt"
WAIT="$EVID/site10-rerun16-wait.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun16 start · matrixAuthStable login + community drawer/showcase + admin shell session"
echo "=== rerun16 $(date -u +%Y-%m-%dT%H:%M:%SZ) · post bucket fixes (target REAL FAIL << 51) ===" | tee -a "$RERUN_LOG"

export PLAYWRIGHT_REUSE_FE_SERVER=0
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG" "$WAIT"
rc=${PIPESTATUS[0]}
set -e
log "rerun16 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee "$GATES" | tee -a "$ORCH" || true

log "--- parse-fails (rerun16 REAL FAIL) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee "$PARSE" | tee -a "$ORCH"

log "rerun16 orchestrator complete · compare REAL FAIL vs rerun15=51"
