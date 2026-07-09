#!/usr/bin/env bash
# ① Site10 · rerun20 全矩阵（844 · 验收收敛 · 基线 rerun19 REAL FAIL=46 · bug vs 噪声）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun20-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
GATES="$EVID/site10-rerun20-gates.txt"
PARSE="$EVID/site10-rerun20-parse.txt"
WAIT="$EVID/site10-rerun20-wait.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun20 start · acceptance convergence · baseline REAL FAIL=46 (rerun19) · bug vs test-noise"
echo "=== rerun20 $(date -u +%Y-%m-%dT%H:%M:%SZ) · FE stability ON · vs frozen baseline rerun19=46 ===" | tee -a "$RERUN_LOG"

export PLAYWRIGHT_REUSE_FE_SERVER=0
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1
export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY=1
export PLAYWRIGHT_SITE10_FE_HEAP_MB=16384

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG" "$WAIT"
rc=${PIPESTATUS[0]}
set -e
log "rerun20 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee "$GATES" | tee -a "$ORCH" || true

log "--- parse-fails (rerun20 REAL FAIL · bug vs noise vs baseline 46) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee "$PARSE" | tee -a "$ORCH"

restart_n="$(grep -c "memory threshold, restarting" "$WAIT" 2>/dev/null || echo 0)"
real_fail_n="$(grep -E '^REAL failures before FE crash:' "$PARSE" 2>/dev/null | tail -1 | grep -oE '[0-9]+' | tail -1 || echo '?')"
log "rerun20 FE memory restart count: ${restart_n} · REAL FAIL: ${real_fail_n} · baseline rerun19=46"
log "rerun20 orchestrator complete"
