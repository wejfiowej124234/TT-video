#!/usr/bin/env bash
# 轮询 rerun11 直至 949/949 + 编排器收尾，写 progress 行供 Agent 读取
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"
ACCEPT="$ROOT/frontend/evidence/GO_local_phase1/site10.acceptance.latest.log"
ORCH="$ROOT/frontend/evidence/GO_local_phase1/site10-rerun11-orchestrator.log"
WAIT_LOG="$ROOT/frontend/evidence/GO_local_phase1/site10-rerun11-wait.log"
LOCK="$ROOT/frontend/evidence/GO_local_phase1/site10-matrix-run.lock"

log() { echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$WAIT_LOG"; }

log "wait-rerun11: monitoring until orchestrator complete"

prev=""
stable=0
while true; do
  if grep -q "rerun11 orchestrator complete" "$ORCH" 2>/dev/null; then
    log "DONE: orchestrator complete"
    break
  fi

  last="$(grep -E '\[[0-9]+/949\]' "$ACCEPT" 2>/dev/null | tail -1 || true)"
  idx="$(echo "$last" | sed -n 's/.*\[\([0-9]*\)\/949\].*/\1/p')"
  if [[ "$idx" == "949" ]] && [[ ! -f "$LOCK" ]]; then
    log "DONE: 949/949 and lock released; waiting 60s for orchestrator tail"
    sleep 60
    if grep -q "rerun11 orchestrator complete" "$ORCH" 2>/dev/null; then
      log "DONE: orchestrator complete after 949"
      break
    fi
  fi

  if [[ -n "$idx" && "$idx" == "$prev" ]]; then
    stable=$((stable + 1))
  else
    stable=0
    prev="$idx"
  fi
  log "progress=${idx:-?}/949 stable=${stable} lock=$([[ -f $LOCK ]] && echo yes || echo no)"

  if [[ $stable -ge 45 ]] && [[ ! -f "$LOCK" ]]; then
    log "WARN: stalled ${idx:-?}/949 45+ polls without lock — treating as done"
    break
  fi

  sleep 120
done

log "--- final check-gates ---"
bash "$ROOT/scripts/dev/run-site10-matrix-convergence.sh" check-gates 2>&1 | tee -a "$WAIT_LOG" || true

log "--- final parse-fails ---"
PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/parse-site10-failures.py" "$ACCEPT" 2>&1 | tee -a "$WAIT_LOG"

log "wait-rerun11: finished"
