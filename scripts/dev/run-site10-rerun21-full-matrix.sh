#!/usr/bin/env bash
# ① Site10 · rerun21 全矩阵（844 · 桶级收敛 · baseline rerun20 REAL FAIL=49）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun21-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"
GATES="$EVID/site10-rerun21-gates.txt"
PARSE="$EVID/site10-rerun21-parse.txt"
WAIT="$EVID/site10-rerun21-wait.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

if [[ "${TRAVELTRUST_SITE10_RERUN21_SKIP_BUCKET_GATE:-0}" != "1" ]]; then
  log "--- bucket expansion preflight (community+market+admin+acquisition 10/10) ---"
  if ! bash "$ROOT/scripts/dev/run-site10-bucket-expansion-gate.sh" check 2>&1 | tee -a "$ORCH"; then
    log "rerun21 BLOCKED: run bash scripts/dev/run-site10-bucket-expansion-gate.sh run first"
    exit 1
  fi
  log "bucket expansion gate: OK · unlocking rerun21 full matrix"
fi

log "rerun21 start · bucket convergence · baseline REAL FAIL=49 (rerun20) · all buckets 10/10 → full matrix"
echo "=== rerun21 $(date -u +%Y-%m-%dT%H:%M:%SZ) · FE stability ON · vs baseline rerun20=49 ===" | tee -a "$RERUN_LOG"

export PLAYWRIGHT_REUSE_FE_SERVER=0
export TRAVELTRUST_COMMUNITY_PUBLIC_SHOWCASE=1
export NEXT_PUBLIC_TRAVELTRUST_COMMUNITY_SHOWCASE=1
export PLAYWRIGHT_SITE10_MATRIX_FE_STABILITY=1
export PLAYWRIGHT_SITE10_FE_HEAP_MB=16384

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG" "$WAIT"
rc=${PIPESTATUS[0]}
set -e
log "rerun21 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee "$GATES" | tee -a "$ORCH" || true

log "--- parse-fails (rerun21 REAL FAIL · vs baseline 49) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee "$PARSE" | tee -a "$ORCH"

restart_n="$(grep -c "memory threshold, restarting" "$WAIT" 2>/dev/null || echo 0)"
real_fail_n="$(grep -E '^REAL failures before FE crash:' "$PARSE" 2>/dev/null | tail -1 | grep -oE '[0-9]+' | tail -1 || echo '?')"
log "rerun21 FE memory restart count: ${restart_n} · REAL FAIL: ${real_fail_n} · baseline rerun20=49"
log "rerun21 orchestrator complete"
