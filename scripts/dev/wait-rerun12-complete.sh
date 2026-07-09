#!/usr/bin/env bash
# Wait for Site10 rerun12 matrix lock release, then check-gates + parse-fails.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
EVID="$ROOT/frontend/evidence/GO_local_phase1"
LOCK="$EVID/site10-matrix-run.lock"
OUT="$EVID/site10-rerun12-complete.status.txt"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$OUT"; }

: >"$OUT"
log "wait-rerun12: polling lock $LOCK"
while [[ -f "$LOCK" ]]; do
  prog="$(grep -oE '\[[0-9]+/844\]' "$EVID/site10-rerun12-wait.log" 2>/dev/null | tail -1 || echo "?")"
  log "progress=$prog"
  sleep 120
done
log "lock released — running check-gates + parse-fails"
{
  echo "=== check-gates ==="
  bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates || true
  echo "=== parse-fails ==="
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$EVID/site10.acceptance.latest.log" || true
  echo "=== playwright summary ==="
  grep -E '^\s+[0-9]+ (failed|passed|skipped|did not run|flaky)' "$EVID/site10.acceptance.latest.log" | tail -6 || true
} >>"$OUT" 2>&1
log "wait-rerun12: DONE"
