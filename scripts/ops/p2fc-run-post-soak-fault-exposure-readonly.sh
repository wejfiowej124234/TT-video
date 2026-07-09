#!/usr/bin/env bash
# P2FC · post-soak 故障暴露 / 断点建模（只读 · 非侵入 · Soak 不变）
#
# TN-P1-010 · Wave1/Wave2 · /meta 传播 · indexer/db/itineraries 一致性
# 不 deploy · 不重启 · 不改 MR12 策略
#
#   bash scripts/ops/p2fc-run-post-soak-fault-exposure-readonly.sh
#   bash scripts/ops/p2fc-run-post-soak-fault-exposure-readonly.sh --watch  # 900s
#
# 末行：TT_P2FC_FAULT_EXPOSURE_MODEL: PASS|WARN|FAIL
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SOAK_DIR="${P2FC_SOAK_DIR:-$ROOT/evidence/P2FC_SOAK_72H_STAGING}"
OUT="$SOAK_DIR/fault-exposure-model"
LOG="$OUT/fault-exposure.log"
PID_FILE="$OUT/fault-exposure-watch.pid"
POLL_SEC="${P2FC_FAULT_EXPOSURE_POLL_SEC:-900}"
WATCH=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --watch) WATCH=1; shift ;;
    -h|--help)
      sed -n '2,14p' "$0" | sed 's/^# \?//'
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

mkdir -p "$OUT"

run_once() {
  local ts rc=0 line
  ts="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "${ts} fault-exposure: start" >>"$LOG"
  # soak attest read-only (exit 2 = INFLIGHT OK)
  P2FC_SOAK_DIR="$SOAK_DIR" bash "$ROOT/scripts/ops/p2fc-soak-attest.sh" >>"$LOG" 2>&1 || true
  # MR12 lock consistency (read-only)
  bash "$ROOT/scripts/ops/p2fc-verify-mr12-execution-lock.sh" >>"$LOG" 2>&1 || true
  set +e
  PYTHONIOENCODING=utf-8 python "$ROOT/scripts/dev/gen-p2fc-post-soak-fault-exposure-model.py" \
    --soak-dir "$SOAK_DIR" 2>&1 | tee -a "$LOG"
  rc=${PIPESTATUS[0]}
  set -e
  line="$(grep -E '^TT_P2FC_FAULT_EXPOSURE_MODEL:' "$LOG" | tail -1 || true)"
  echo "${ts} fault-exposure: done rc=${rc} ${line}" >>"$LOG"
  return "$rc"
}

if [[ "$WATCH" -eq 0 ]]; then
  run_once
  exit $?
fi

if [[ -f "$PID_FILE" ]]; then
  old_pid="$(cat "$PID_FILE" 2>/dev/null || true)"
  if [[ -n "$old_pid" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo "p2fc-run-post-soak-fault-exposure: already running pid=${old_pid} log=${LOG}"
    exit 0
  fi
fi

nohup bash -c "
  ROOT=\"$ROOT\"
  SOAK_DIR=\"$SOAK_DIR\"
  POLL_SEC=\"$POLL_SEC\"
  while true; do
    bash \"\$ROOT/scripts/ops/p2fc-run-post-soak-fault-exposure-readonly.sh\" || true
    sleep \"\$POLL_SEC\"
  done
" >>"$LOG" 2>&1 &

echo $! >"$PID_FILE"
run_once || true
echo "p2fc-run-post-soak-fault-exposure: watch started pid=$(cat "$PID_FILE") poll_sec=${POLL_SEC} log=${LOG}"
exit 0
