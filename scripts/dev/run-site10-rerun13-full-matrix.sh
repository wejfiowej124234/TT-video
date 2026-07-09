#!/usr/bin/env bash
# ① Site10 · rerun13 全矩阵（单实例锁 · 跑完 check-gates + parse-fails）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun13-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun13 start · rerun12 bucket fixes (showcase env + auth-nav + community report session)"
echo "=== rerun13 $(date -u +%Y-%m-%dT%H:%M:%SZ) · post rerun12 57 REAL FAIL fixes ===" | tee -a "$RERUN_LOG"

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG"
rc=${PIPESTATUS[0]}
set -e
log "rerun13 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee -a "$ORCH" || true

log "--- parse-fails (rerun13 REAL FAIL only) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee -a "$ORCH"

log "rerun13 orchestrator complete · G2/G3 valid only if full matrix finished"
