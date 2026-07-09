#!/usr/bin/env bash
# ① Site10 · rerun19 全矩阵（844 · FE stability 默认 ON · 未污染 G3 REAL FAIL 收敛）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun19-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
GATES="$EVID/site10-rerun19-gates.txt"
PARSE="$EVID/site10-rerun19-parse.txt"
WAIT="$EVID/site10-rerun19-wait.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun19 start · PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY=1 · FE heap 16384MB · compare vs rerun18 REAL FAIL=49"
echo "=== rerun19 $(date -u +%Y-%m-%dT%H:%M:%SZ) · FE stability ON · unfiltered G3 REAL FAIL vs rerun18=49 rerun17=44 ===" | tee -a "$RERUN_LOG"

export PLAYWRIGHT_REUSE_FE_SERVER=0
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1
export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY=1
export PLAYWRIGHT_SITE10_FE_HEAP_MB=16384

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG" "$WAIT"
rc=${PIPESTATUS[0]}
set -e
log "rerun19 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee "$GATES" | tee -a "$ORCH" || true

log "--- parse-fails (rerun19 REAL FAIL) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee "$PARSE" | tee -a "$ORCH"

restart_n="$(grep -c "memory threshold, restarting" "$WAIT" 2>/dev/null || echo 0)"
log "rerun19 FE memory restart count in wait log: ${restart_n}"
log "rerun19 orchestrator complete · compare REAL FAIL vs rerun18=49"
