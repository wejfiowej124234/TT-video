#!/usr/bin/env bash
# ① Site10 · rerun11 全矩阵（单实例锁 · 跑完 check-gates + parse-fails）
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
ORCH="$EVID/site10-rerun11-orchestrator.log"
RERUN_LOG="$EVID/site10-full-rerun6.log"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$ORCH"; }

log "rerun11 start · auth-register URL fix + exclude *.probe.spec.ts + matrix lock"
echo "=== rerun11 $(date -u +%Y-%m-%dT%H:%M:%SZ) · fixes: auth-nav + probe exclude + run lock ===" | tee -a "$RERUN_LOG"

set +e
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" run-matrix 2>&1 | tee -a "$RERUN_LOG"
rc=${PIPESTATUS[0]}
set -e
log "rerun11 matrix exit_code=$rc"

log "--- check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee -a "$ORCH" || true

log "--- parse-fails (rerun11 REAL FAIL only) ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" 2>&1 | tee -a "$ORCH"

log "rerun11 orchestrator complete · G2/G3 valid only if 949/949 finished"
