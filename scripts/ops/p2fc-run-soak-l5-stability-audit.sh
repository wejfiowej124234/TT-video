#!/usr/bin/env bash
# P2FC · Soak 期间 L5 稳定性审计（只读 · 不 deploy · 不改 worker/watcher/staging）
#
# 扩展四维 · 900s 快照 · duration-convergence · graduation-risk-preconvergence-matrix
#
#   bash scripts/ops/p2fc-run-soak-l5-stability-audit.sh           # 单次
#   bash scripts/ops/p2fc-run-soak-l5-stability-audit.sh --watch  # 后台轮询（默认 900s）
#
# 产出：evidence/P2FC_SOAK_72H_STAGING/l5-stability-audit/
#   latest.json · snapshots.jsonl · metrics-timeseries.json · duration-convergence.json
#   graduation-risk-preconvergence-matrix.latest.json · long-term-drift-scan.json
#   fc-failure-competition-model.json · fc-optimal-execution-path.json · fc-minimal-risk-change-set.json
#   mr12-execution-lock-verification.json · MR12-EXECUTION-LOCK.json (sync)
# 末行：TT_P2FC_L5_STABILITY_AUDIT: PASS|WARN|FAIL · TT_MR12_EXECUTION_LOCK: FROZEN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
AUDIT_DIR="$SOAK_DIR/l5-stability-audit"
LOG="$AUDIT_DIR/stability-audit.log"
PID_FILE="$AUDIT_DIR/stability-audit.pid"
POLL_SEC="${P2FC_L5_STABILITY_AUDIT_POLL_SEC:-900}"
WATCH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,12p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$AUDIT_DIR"

run_once() {
  local ts line rc=0
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} l5-stability-audit: start" >>"$LOG"
  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-soak-l5-stability-audit.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"
  rc=${PIPESTATUS[0]}
  set -e
  line="$(grep -E '^TT_P2FC_L5_STABILITY_AUDIT:' "$LOG" | tail -1 || true)"
  echo "${ts} l5-stability-audit: done rc=${rc} ${line}" >>"$LOG"
  return "$rc"
}

if [[ "$WATCH" -eq 0 ]]; then
  run_once
  exit $?
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "p2fc-run-soak-l5-stability-audit: already running pid=${old_pid} log=${LOG}"
    exit 0
  fi
fi

nohup bash -c "
  ROOT=\"$ROOT\"
  SOAK_DIR=\"$SOAK_DIR\"
  LOG=\"$LOG\"
  POLL_SEC=\"$POLL_SEC\"
  while true; do
    ts=\$(date -u +%Y-%m-%dT%H:%M:%SZ)
    echo \"\${ts} l5-stability-audit: watch-cycle start\" >>\"\$LOG\"
    PYTHONIOENCODING=utf-8 python \"\$ROOT/scripts/dev/gen-p2fc-soak-l5-stability-audit.py\" --soak-dir \"\$SOAK_DIR\" >>\"\$LOG\" 2>&1 || true
    grep -E '^TT_P2FC_L5_STABILITY_AUDIT:' \"\$LOG\" | tail -1 >>\"\$LOG\" 2>/dev/null || true
    grep -E '^TT_MR12_EXECUTION_LOCK:' \"\$LOG\" | tail -1 >>\"\$LOG\" 2>/dev/null || true
    if [[ -f \"\$SOAK_DIR/COMPLETED.json\" ]]; then
      echo \"\$(date -u +%Y-%m-%dT%H:%M:%SZ) l5-stability-audit: COMPLETED.json seen — final cycle\" >>\"\$LOG\"
      break
    fi
    sleep \"\$POLL_SEC\"
  done
" >>"$LOG" 2>&1 &

echo $! >"$PID_FILE"
echo "p2fc-run-soak-l5-stability-audit: watch started pid=$(cat "$PID_FILE") poll_sec=${POLL_SEC} log=${LOG}"
exit 0
